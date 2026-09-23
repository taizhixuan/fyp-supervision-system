"""
Pluggable LLM provider shared by the chatbot and the proposal analyzer.

Every provider is reached through the OpenAI-compatible Chat Completions API,
so one client class covers all of them:

    ollama  - local models served by Ollama (http://ollama:11434/v1), no key
    groq    - Groq cloud (gpt-oss-120b by default), needs GROQ_API_KEY
    openai  - OpenAI cloud, needs OPENAI_API_KEY
    custom  - any other OpenAI-compatible endpoint (vLLM, LM Studio, OpenRouter)
    none    - no LLM; callers fall back to their non-LLM paths

Startup config comes from the environment. The backend can override it at
runtime (admin Integration Settings) through PUT /ai/llm-config; "env" as the
provider drops the override and goes back to the environment config.

This file is duplicated in ai-chatbot/ and ai-proposal-analyzer/ because each
service is its own Docker build context. Keep the two copies identical.
"""

import logging
import os
import re
import threading
import time
from dataclasses import dataclass, field
from typing import Optional

logger = logging.getLogger(__name__)

PROVIDERS = ("ollama", "groq", "openai", "custom", "none")

DEFAULTS = {
    "ollama": {"base_url": "http://ollama:11434/v1", "model": "llama3.2:3b"},
    # Groq retires models without notice (llama-3.3-70b-versatile went 404 in 2026).
    "groq": {"base_url": "https://api.groq.com/openai/v1", "model": "openai/gpt-oss-120b"},
    "openai": {"base_url": "https://api.openai.com/v1", "model": "gpt-4o-mini"},
    "custom": {"base_url": None, "model": None},
}

# Local models on CPU are slow, cloud ones are fast. Both stay under the
# backend's 120 s read timeout so the service can still fall back and answer.
DEFAULT_TIMEOUT = {"ollama": 100.0, "groq": 45.0, "openai": 45.0, "custom": 100.0}


_THINK_RE = re.compile(r"<think>.*?</think>", re.DOTALL | re.IGNORECASE)


def clean_reply(text: Optional[str]) -> str:
    """Drop <think>...</think> reasoning that some models (Qwen, Gemma 4,
    DeepSeek-R1) put in the answer text, so students only see the answer."""
    if not text:
        return ""
    text = _THINK_RE.sub("", text)
    # An unclosed <think> means the model ran out of tokens mid-reasoning.
    if "<think>" in text.lower():
        text = text[: text.lower().index("<think>")]
    return text.strip()


def _env(name: str, default: Optional[str] = None) -> Optional[str]:
    """Compose passes `${VAR:-}` as an empty string; treat that as unset."""
    raw = os.environ.get(name)
    if raw is None or raw.strip() == "":
        return default
    return raw.strip()


def _env_key(provider: str) -> Optional[str]:
    if provider == "groq":
        return _env("GROQ_API_KEY") or _env("LLM_API_KEY")
    if provider == "openai":
        return _env("OPENAI_API_KEY") or _env("LLM_API_KEY")
    if provider == "custom":
        return _env("LLM_API_KEY")
    return None


@dataclass
class LLMState:
    provider: str = "none"
    base_url: Optional[str] = None
    model: Optional[str] = None
    api_key: Optional[str] = field(default=None, repr=False)
    timeout: float = 60.0
    source: str = "env"
    client: object = field(default=None, repr=False)

    @property
    def configured(self) -> bool:
        return self.client is not None and bool(self.model)

    @property
    def local(self) -> bool:
        return self.provider == "ollama"


def env_config() -> dict:
    """Resolve the startup provider from the environment.

    LLM_PROVIDER picks one explicitly. Without it the old precedence still
    applies (LLM_API_KEY, then GROQ_API_KEY, then OPENAI_API_KEY), and
    OLLAMA_BASE_URL alone is enough to select Ollama.
    """
    explicit = (_env("LLM_PROVIDER") or "").lower()
    if explicit in PROVIDERS:
        provider = explicit
    elif _env("LLM_API_KEY"):
        provider = "custom" if _env("LLM_BASE_URL") else "groq"
    elif _env("GROQ_API_KEY"):
        provider = "groq"
    elif _env("OPENAI_API_KEY"):
        provider = "openai"
    elif _env("OLLAMA_BASE_URL"):
        provider = "ollama"
    else:
        provider = "none"

    if provider == "ollama":
        return {
            "provider": "ollama",
            "base_url": _env("OLLAMA_BASE_URL", DEFAULTS["ollama"]["base_url"]),
            "model": _env("OLLAMA_MODEL", DEFAULTS["ollama"]["model"]),
        }
    if provider == "none":
        return {"provider": "none"}
    return {
        "provider": provider,
        "base_url": _env("LLM_BASE_URL", DEFAULTS[provider]["base_url"]),
        "model": _env("LLM_MODEL", DEFAULTS[provider]["model"]),
    }


class LLMProvider:
    def __init__(self):
        self._lock = threading.Lock()
        self._state = LLMState()
        self.reset_to_env()

    # -- state ------------------------------------------------------------

    def snapshot(self) -> LLMState:
        """Callers grab one snapshot per request so a config change mid-call
        can't pair the old client with the new model name."""
        with self._lock:
            return self._state

    @property
    def client(self):
        return self.snapshot().client

    @property
    def model(self) -> Optional[str]:
        return self.snapshot().model

    @property
    def provider(self) -> str:
        return self.snapshot().provider

    def describe(self) -> dict:
        s = self.snapshot()
        return {
            "provider": s.provider,
            "model": s.model if s.provider != "none" else None,
            "baseUrl": s.base_url,
            "configured": s.configured,
            "local": s.local,
            "source": s.source,
            "apiKeySet": bool(s.api_key) and s.provider != "ollama",
            "timeoutSeconds": s.timeout,
        }

    # -- configuration ----------------------------------------------------

    def reset_to_env(self) -> dict:
        cfg = env_config()
        self._apply(source="env", **cfg)
        return self.describe()

    def configure(self, provider: str, base_url: Optional[str] = None,
                  model: Optional[str] = None, api_key: Optional[str] = None) -> dict:
        provider = (provider or "").strip().lower()
        if provider == "env":
            return self.reset_to_env()
        if provider not in PROVIDERS:
            raise ValueError(f"Unknown provider '{provider}'. Use one of: env, {', '.join(PROVIDERS)}")
        if provider == "custom" and not (base_url and model):
            raise ValueError("The custom provider needs both baseUrl and model.")
        self._apply(provider=provider, base_url=base_url, model=model,
                    api_key=api_key, source="admin")
        return self.describe()

    def _apply(self, provider: str, base_url: Optional[str] = None, model: Optional[str] = None,
               api_key: Optional[str] = None, source: str = "env"):
        if provider == "none":
            with self._lock:
                self._state = LLMState(provider="none", source=source)
            logger.info("LLM disabled (provider=none, source=%s)", source)
            return

        defaults = DEFAULTS.get(provider, {})
        base_url = (base_url or "").strip() or defaults.get("base_url")
        model = (model or "").strip() or defaults.get("model")
        api_key = (api_key or "").strip() or _env_key(provider)
        if provider == "ollama":
            # Ollama ignores the key but the OpenAI client refuses an empty one.
            api_key = "ollama"
        timeout = float(_env("LLM_TIMEOUT", str(DEFAULT_TIMEOUT.get(provider, 60.0))))

        client = None
        if not api_key:
            logger.warning("LLM provider %s selected but no API key is available; LLM disabled", provider)
        else:
            try:
                from openai import OpenAI
                client = OpenAI(api_key=api_key, base_url=base_url, timeout=timeout, max_retries=1)
            except ImportError:
                logger.warning("openai package not installed; LLM disabled")

        with self._lock:
            self._state = LLMState(provider=provider, base_url=base_url, model=model,
                                   api_key=api_key, timeout=timeout, source=source, client=client)
        logger.info("LLM configured: provider=%s model=%s base_url=%s source=%s ready=%s",
                    provider, model, base_url, source, client is not None)

    # -- probes -----------------------------------------------------------

    def test(self) -> dict:
        s = self.snapshot()
        if not s.configured:
            return {"success": False, "message": "No LLM configured.", **self.describe()}
        start = time.time()
        try:
            resp = s.client.chat.completions.create(
                model=s.model,
                messages=[{"role": "user", "content": "Reply with the single word: ready"}],
                # Room for reasoning models, which think before answering.
                max_tokens=256,
                temperature=0,
            )
            reply = clean_reply(resp.choices[0].message.content)
            ms = int((time.time() - start) * 1000)
            return {"success": True, "message": f"{s.provider}/{s.model} replied in {ms} ms",
                    "reply": reply[:80], "responseTime": ms, **self.describe()}
        except Exception as e:
            ms = int((time.time() - start) * 1000)
            return {"success": False, "message": f"{type(e).__name__}: {e}",
                    "responseTime": ms, **self.describe()}

    def list_models(self) -> list:
        """Models the current endpoint offers (Ollama lists what's pulled)."""
        s = self.snapshot()
        if s.client is None:
            return []
        try:
            return sorted(m.id for m in s.client.models.list().data)
        except Exception as e:
            logger.info("Model listing failed for %s: %s", s.provider, e)
            return []


def register_llm_routes(app, llm: LLMProvider, on_change=None):
    """Admin-facing config endpoints. When AI_INTERNAL_TOKEN is set, callers
    must send it in X-Internal-Token (the backend does), so the published
    dev ports can't be used to repoint the LLM."""
    from flask import jsonify, request

    def _authorized() -> bool:
        token = _env("AI_INTERNAL_TOKEN")
        return not token or request.headers.get("X-Internal-Token") == token

    @app.route("/ai/llm-config", methods=["GET"])
    def llm_config_get():
        if not _authorized():
            return jsonify({"error": "unauthorized"}), 401
        return jsonify(llm.describe())

    @app.route("/ai/llm-config", methods=["PUT"])
    def llm_config_put():
        if not _authorized():
            return jsonify({"error": "unauthorized"}), 401
        data = request.get_json(silent=True) or {}
        try:
            result = llm.configure(
                provider=str(data.get("provider", "")),
                base_url=data.get("baseUrl"),
                model=data.get("model"),
                api_key=data.get("apiKey"),
            )
        except ValueError as e:
            return jsonify({"error": str(e)}), 400
        if on_change:
            on_change(llm)
        return jsonify(result)

    @app.route("/ai/llm-test", methods=["POST"])
    def llm_test():
        if not _authorized():
            return jsonify({"error": "unauthorized"}), 401
        return jsonify(llm.test())

    @app.route("/ai/llm-models", methods=["GET"])
    def llm_models():
        if not _authorized():
            return jsonify({"error": "unauthorized"}), 401
        return jsonify({"provider": llm.provider, "models": llm.list_models()})
