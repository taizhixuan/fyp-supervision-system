import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Puzzle,
  Mail,
  Cloud,
  Globe,
  Cpu,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  RotateCw,
  Power,
  ChevronDown,
  ChevronUp,
  Server,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'
import { useToast } from '@/components/ui/Toast'
import {
  useIntegrations,
  useTestIntegration,
  useUpdateIntegration,
  useLlmConfig,
  useLlmModels,
  useUpdateLlmConfig,
  useTestLlm,
} from '@/lib/hooks/useAdmin'
import { getApiErrorMessage } from '@/lib/api/client'
import { cn } from '@/lib/utils/cn'
import type {
  Integration,
  IntegrationType,
  LlmProviderName,
  LlmServiceState,
  LlmTestResult,
  TestIntegrationResult,
} from '@/types'

// Only types the backend actually implements get a section. The LLM row has its own panel.
const SECTIONS: { type: IntegrationType; label: string; icon: typeof Mail; description: string; color: string }[] = [
  { type: 'AI', label: 'AI Services', icon: Globe, description: 'Local model services behind the backend gateway', color: 'bg-orange-100 text-orange-700 border border-orange-200' },
  { type: 'EMAIL', label: 'Email Service', icon: Mail, description: 'SMTP used for OTPs, password resets and notifications', color: 'bg-sky-100 text-sky-700 border border-sky-200' },
  { type: 'STORAGE', label: 'File Storage', icon: Cloud, description: 'Where uploads, reports and backups are written', color: 'bg-violet-100 text-violet-700 border border-violet-200' },
]

const RUNTIME_LABELS: Record<string, string> = {
  sendingEnabled: 'Sending enabled',
  smtpHost: 'SMTP host',
  smtpPort: 'SMTP port',
  fromAddress: 'From address',
  uploadPath: 'Upload path',
  writable: 'Writable',
  serviceUrl: 'Service URL',
}

const SERVICE_LABELS: Record<string, string> = {
  chatbot: 'FYP Chatbot',
  analyzer: 'Proposal Analyzer',
}

const PROVIDERS: { value: LlmProviderName; label: string; hint: string; local?: boolean }[] = [
  { value: 'ollama', label: 'Local (Ollama)', hint: 'Runs on this server. No API key, no data leaves the machine.', local: true },
  { value: 'groq', label: 'Groq API', hint: 'Cloud, very fast. Key from GROQ_API_KEY.' },
  { value: 'openai', label: 'OpenAI API', hint: 'Cloud. Key from OPENAI_API_KEY.' },
  { value: 'custom', label: 'Custom endpoint', hint: 'Any OpenAI-compatible server (vLLM, LM Studio, OpenRouter).' },
  { value: 'env', label: 'Server default', hint: 'Use what the AI containers were started with (.env).' },
  { value: 'none', label: 'Off', hint: 'No LLM. Scores still work; chat falls back to retrieved text.' },
]

const PROVIDER_DEFAULTS: Partial<Record<LlmProviderName, { baseUrl: string; model: string }>> = {
  ollama: { baseUrl: 'http://ollama:11434/v1', model: 'llama3.2:3b' },
  groq: { baseUrl: 'https://api.groq.com/openai/v1', model: 'openai/gpt-oss-120b' },
  openai: { baseUrl: 'https://api.openai.com/v1', model: 'gpt-4o-mini' },
}

const OLLAMA_SUGGESTIONS = ['llama3.2:3b', 'gemma4:e4b', 'phi4-mini']

const llmSchema = z
  .object({
    provider: z.enum(['env', 'ollama', 'groq', 'openai', 'custom', 'none']),
    model: z.string().trim().max(200, 'Model name is too long'),
    baseUrl: z
      .string()
      .trim()
      .refine((v) => v === '' || /^https?:\/\/[^\s/]+/i.test(v), 'Must start with http:// or https://'),
  })
  .superRefine((v, ctx) => {
    if (v.provider === 'custom') {
      if (!v.baseUrl) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['baseUrl'], message: 'Required for a custom endpoint' })
      if (!v.model) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['model'], message: 'Required for a custom endpoint' })
    }
  })

type LlmForm = z.infer<typeof llmSchema>

function formatRuntimeValue(value: unknown): string {
  if (value === true) return 'Yes'
  if (value === false) return 'No'
  if (value === null || value === undefined || value === '') return '—'
  return String(value)
}

// ---------------------------------------------------------------------------
// LLM provider panel
// ---------------------------------------------------------------------------

function ServiceStateCard({ name, state }: { name: string; state: LlmServiceState }) {
  const cloud = state.provider && !['ollama', 'none'].includes(state.provider)
  return (
    <div className="p-2 border border-stone-200 rounded-md bg-stone-50">
      <div className="flex items-center justify-between gap-2 mb-1">
        <span className="text-xs font-semibold text-stone-800">{SERVICE_LABELS[name] ?? name}</span>
        {!state.reachable ? (
          <span className="text-[10px] px-1.5 rounded border bg-rose-100 text-rose-700 border-rose-200">Unreachable</span>
        ) : state.inSync ? (
          <span className="text-[10px] px-1.5 rounded border bg-emerald-100 text-emerald-700 border-emerald-200">In sync</span>
        ) : (
          <span className="text-[10px] px-1.5 rounded border bg-amber-100 text-amber-700 border-amber-200">Syncing</span>
        )}
      </div>
      {state.reachable ? (
        <div className="space-y-0.5 text-[11px] text-stone-600">
          <p>
            <span className="text-stone-400">Running: </span>
            <span className="font-mono">{state.provider === 'none' ? 'no LLM' : `${state.provider} / ${state.model ?? '—'}`}</span>
            {state.provider !== 'none' && (
              <span
                className={cn(
                  'ml-1.5 text-[10px] px-1 rounded border',
                  state.local ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-sky-50 text-sky-700 border-sky-200',
                )}
              >
                {state.local ? 'Local' : 'Cloud API'}
              </span>
            )}
          </p>
          <p>
            <span className="text-stone-400">Source: </span>
            {state.source === 'admin' ? 'set here by admin' : 'server environment'}
          </p>
          {cloud && !state.apiKeySet && (
            <p className="text-rose-600">No API key in the server environment, so this provider can't answer.</p>
          )}
          {state.provider !== 'none' && state.reachable && !state.configured && !cloud && (
            <p className="text-rose-600">Provider selected but the client isn't ready.</p>
          )}
        </div>
      ) : (
        <p className="text-[11px] text-rose-600 break-all">{state.error ?? 'No response from service.'}</p>
      )}
    </div>
  )
}

function LlmProviderPanel({ row }: { row?: Integration }) {
  const { addToast } = useToast()
  const { data: status, isLoading, isError, refetch, isFetching } = useLlmConfig()
  const { data: modelList } = useLlmModels()
  const updateLlm = useUpdateLlmConfig()
  const testLlm = useTestLlm()
  const toggle = useUpdateIntegration()
  const [lastTest, setLastTest] = useState<LlmTestResult | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors, isDirty },
  } = useForm<LlmForm>({
    resolver: zodResolver(llmSchema),
    defaultValues: { provider: 'env', model: '', baseUrl: '' },
  })

  const desired = status?.desired
  useEffect(() => {
    if (desired) {
      reset({
        provider: desired.enabled ? desired.provider : 'none',
        model: desired.model ?? '',
        baseUrl: desired.baseUrl ?? '',
      })
    }
  }, [desired, reset])

  const provider = watch('provider')
  const defaults = PROVIDER_DEFAULTS[provider]
  const showEndpointFields = !['env', 'none'].includes(provider)
  // The live list only describes the provider that's running right now.
  const liveModels = modelList?.provider === provider ? modelList.models : []
  const runningOllama = provider === 'ollama' && liveModels.length > 0
  const suggestions =
    liveModels.length > 0 ? liveModels : provider === 'ollama' ? OLLAMA_SUGGESTIONS : defaults ? [defaults.model] : []

  const onSubmit = async (values: LlmForm) => {
    try {
      // The Off choice is stored as provider "none" but the row stays ACTIVE, so the
      // separate enable switch keeps meaning "LLM integration on/off" only.
      await updateLlm.mutateAsync({ provider: values.provider, model: values.model, baseUrl: values.baseUrl })
      addToast({ type: 'success', title: 'LLM provider saved', description: 'Pushed to the chatbot and proposal analyzer.' })
    } catch (error) {
      addToast({ type: 'error', title: 'Could not save LLM provider', description: getApiErrorMessage(error) })
    }
  }

  const onTest = async () => {
    try {
      const result = await testLlm.mutateAsync()
      setLastTest(result)
    } catch (error) {
      setLastTest({ success: false, message: getApiErrorMessage(error), services: {} })
    }
  }

  const onToggle = async () => {
    if (!row) return
    const next = row.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
    try {
      await toggle.mutateAsync({ integrationId: row.integrationId, data: { status: next } })
      await refetch()
      addToast({ type: 'success', title: next === 'ACTIVE' ? 'LLM enabled' : 'LLM disabled' })
    } catch (error) {
      addToast({ type: 'error', title: 'Could not change LLM status', description: getApiErrorMessage(error) })
    }
  }

  const enabled = row ? row.status === 'ACTIVE' : true

  return (
    <Card padding="sm">
      <div className="flex items-start justify-between gap-2 mb-2 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-amber-100 text-amber-700 border border-amber-200">
            <Cpu className="h-3.5 w-3.5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-stone-900">Language model (LLM)</h3>
            <p className="text-[11px] text-stone-500">
              Writes chatbot answers and proposal feedback text. Scores and retrieval always run locally.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button type="button" variant="ghost" size="sm" className="h-7 px-1.5 text-xs" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={cn('h-3.5 w-3.5 mr-0.5', isFetching && 'animate-spin')} />
            Status
          </Button>
          {row && (
            <Button
              type="button"
              variant={enabled ? 'secondary' : 'primary'}
              size="sm"
              className="h-7 px-1.5 text-xs"
              onClick={onToggle}
              disabled={toggle.isPending}
            >
              <Power className="h-3.5 w-3.5 mr-0.5" />
              {enabled ? 'Disable' : 'Enable'}
            </Button>
          )}
        </div>
      </div>

      {!enabled && (
        <div className="px-2 py-1.5 mb-2 bg-amber-50 border border-amber-200 rounded text-[11px] text-amber-800">
          The LLM integration is disabled, so both services run without an LLM. Enable it to use the provider below.
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-6">
          <Spinner />
        </div>
      ) : isError ? (
        <div className="px-2 py-1.5 bg-rose-50 border border-rose-200 rounded text-[11px] text-rose-700">
          Could not load LLM status from the backend.
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3" noValidate>
          <fieldset disabled={!enabled}>
            <legend className="text-xs font-medium text-stone-700 mb-1.5">Provider</legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5">
              {PROVIDERS.map((p) => (
                <label
                  key={p.value}
                  className={cn(
                    'flex items-start gap-2 p-2 rounded-md border cursor-pointer transition-colors',
                    provider === p.value ? 'border-amber-500 bg-amber-50' : 'border-stone-200 hover:border-stone-300',
                    !enabled && 'opacity-60 cursor-not-allowed',
                  )}
                >
                  <input
                    type="radio"
                    value={p.value}
                    {...register('provider', {
                      onChange: () => {
                        setValue('model', '', { shouldDirty: true })
                        setValue('baseUrl', '', { shouldDirty: true })
                      },
                    })}
                    className="mt-0.5 accent-amber-600"
                  />
                  <span>
                    <span className="flex items-center gap-1 text-xs font-medium text-stone-900">
                      {p.label}
                      {p.local && (
                        <span className="text-[10px] px-1 rounded border bg-emerald-50 text-emerald-700 border-emerald-200">
                          Offline
                        </span>
                      )}
                    </span>
                    <span className="block text-[11px] text-stone-500 leading-snug">{p.hint}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          {showEndpointFields && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div>
                <Input
                  label="Model"
                  list="llm-model-suggestions"
                  placeholder={defaults?.model ?? 'model-name'}
                  error={errors.model?.message}
                  helperText={
                    provider === 'ollama'
                      ? runningOllama
                        ? 'Suggestions are the models pulled on the Ollama server.'
                        : 'Leave blank for llama3.2:3b. The model must already be pulled in Ollama.'
                      : liveModels.length > 0
                        ? 'Suggestions come from the provider. Leave blank for the default.'
                        : 'Leave blank for the provider default.'
                  }
                  className="font-mono text-sm"
                  disabled={!enabled}
                  {...register('model')}
                />
                <datalist id="llm-model-suggestions">
                  {suggestions.map((m) => (
                    <option key={m} value={m} />
                  ))}
                </datalist>
              </div>
              <Input
                label="Base URL"
                placeholder={defaults?.baseUrl ?? 'http://host:port/v1'}
                error={errors.baseUrl?.message}
                helperText={
                  provider === 'ollama'
                    ? 'Blank uses the ollama container. Use http://host.docker.internal:11434/v1 for Ollama on the host.'
                    : 'OpenAI-compatible /v1 endpoint. API keys stay in the server environment.'
                }
                className="font-mono text-sm"
                disabled={!enabled}
                {...register('baseUrl')}
              />
            </div>
          )}

          <div className="flex items-center gap-2 flex-wrap">
            <Button type="submit" size="sm" disabled={!enabled || updateLlm.isPending || !isDirty}>
              {updateLlm.isPending ? <Spinner size="sm" /> : 'Save and apply'}
            </Button>
            <Button type="button" variant="secondary" size="sm" onClick={onTest} disabled={testLlm.isPending}>
              {testLlm.isPending ? (
                <>
                  <Spinner size="sm" />
                  <span className="ml-1">Testing… local models can take a minute</span>
                </>
              ) : (
                <>
                  <RotateCw className="h-3.5 w-3.5 mr-1" />
                  Send test prompt
                </>
              )}
            </Button>
            {row?.lastTestedAt && (
              <span className="text-[10px] text-stone-400">
                Last tested {new Date(row.lastTestedAt).toLocaleString()} ({row.lastTestResult === 'SUCCESS' ? 'passed' : 'failed'})
              </span>
            )}
          </div>

          {lastTest && (
            <div
              role="status"
              className={cn(
                'px-2 py-1.5 rounded border text-[11px] space-y-0.5',
                lastTest.success ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-rose-50 border-rose-200 text-rose-700',
              )}
            >
              {Object.keys(lastTest.services).length > 0 ? (
                Object.entries(lastTest.services).map(([name, r]) => (
                  <p key={name}>
                    <span className="font-medium">{SERVICE_LABELS[name] ?? name}:</span> {r.message}
                  </p>
                ))
              ) : (
                <p>{lastTest.message}</p>
              )}
            </div>
          )}

          {status && (
            <div>
              <p className="text-xs font-medium text-stone-700 mb-1.5">What each service is running</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                {Object.entries(status.services).map(([name, state]) => (
                  <ServiceStateCard key={name} name={name} state={state} />
                ))}
              </div>
            </div>
          )}
        </form>
      )}
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Generic integration row
// ---------------------------------------------------------------------------

function IntegrationRow({ integration }: { integration: Integration }) {
  const { addToast } = useToast()
  const testMutation = useTestIntegration()
  const updateMutation = useUpdateIntegration()
  const [expanded, setExpanded] = useState(false)
  const [result, setResult] = useState<TestIntegrationResult | null>(null)

  const active = integration.status === 'ACTIVE'
  const runtime = integration.runtime ?? {}

  const onTest = async () => {
    try {
      setResult(await testMutation.mutateAsync(integration.integrationId))
    } catch (error) {
      setResult({ success: false, message: getApiErrorMessage(error) })
    }
  }

  const onToggle = async () => {
    const next = active ? 'INACTIVE' : 'ACTIVE'
    try {
      await updateMutation.mutateAsync({ integrationId: integration.integrationId, data: { status: next } })
      addToast({ type: 'success', title: `${integration.name} ${next === 'ACTIVE' ? 'enabled' : 'disabled'}` })
    } catch (error) {
      addToast({ type: 'error', title: `Could not update ${integration.name}`, description: getApiErrorMessage(error) })
    }
  }

  return (
    <div className="p-2 border border-stone-200 rounded-md hover:border-stone-300 transition-colors">
      <div className="flex items-center justify-between mb-1 flex-wrap gap-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <h4 className="text-sm font-medium text-stone-900">{integration.name}</h4>
          <span
            className={cn(
              'px-1.5 rounded text-[10px] font-medium flex items-center gap-0.5 border',
              active ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-stone-100 text-stone-600 border-stone-200',
            )}
          >
            {active ? <CheckCircle className="h-2.5 w-2.5" /> : <XCircle className="h-2.5 w-2.5" />}
            {active ? 'Enabled' : 'Disabled'}
          </span>
          {integration.provider && (
            <span className="px-1.5 rounded text-[10px] border bg-stone-50 text-stone-600 border-stone-200">{integration.provider}</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button type="button" variant="ghost" size="sm" onClick={onTest} disabled={testMutation.isPending} className="h-7 px-1.5 text-xs">
            {testMutation.isPending ? (
              <Spinner size="sm" />
            ) : (
              <>
                <RotateCw className="h-3.5 w-3.5 mr-0.5" />
                Test
              </>
            )}
          </Button>
          <Button
            type="button"
            variant={active ? 'secondary' : 'primary'}
            size="sm"
            onClick={onToggle}
            disabled={updateMutation.isPending}
            className="h-7 px-1.5 text-xs"
          >
            <Power className="h-3.5 w-3.5 mr-0.5" />
            {active ? 'Disable' : 'Enable'}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setExpanded((v) => !v)}
            className="h-7 px-1.5 text-xs"
            aria-expanded={expanded}
            aria-label={expanded ? 'Hide details' : 'Show details'}
          >
            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </div>

      {integration.description && <p className="text-[11px] text-stone-500 mb-1">{integration.description}</p>}

      {!active && (
        <p className="text-[11px] text-amber-700 mb-1">
          Disabled: {integration.type === 'EMAIL' ? 'no emails are sent.' : integration.type === 'AI' ? 'students see this feature as unavailable.' : 'this integration is off.'}
        </p>
      )}

      {result ? (
        <div
          role="status"
          className={cn(
            'px-2 py-1 rounded border text-[11px] mb-1 break-all',
            result.success ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-rose-50 border-rose-200 text-rose-700',
          )}
        >
          {result.message}
          {typeof result.responseTime === 'number' && ` (${result.responseTime} ms)`}
        </div>
      ) : (
        integration.lastTestResult === 'FAILED' && (
          <div className="px-2 py-1 bg-rose-50 border border-rose-200 rounded mb-1">
            <p className="text-[11px] text-rose-700">Last connection test failed.</p>
          </div>
        )
      )}

      {integration.lastTestedAt && (
        <p className="text-[10px] text-stone-400">
          Last tested: {new Date(integration.lastTestedAt).toLocaleString()}
          {integration.lastTestResult && ` (${integration.lastTestResult === 'SUCCESS' ? 'passed' : 'failed'})`}
        </p>
      )}

      {expanded && (
        <div className="mt-2 pt-2 border-t border-stone-200">
          <h5 className="text-xs font-medium text-stone-900 mb-1 flex items-center gap-1">
            <Server className="h-3 w-3" /> Current configuration
          </h5>
          {Object.keys(runtime).length > 0 ? (
            <dl className="grid grid-cols-[max-content_1fr] gap-x-3 gap-y-0.5 text-[11px]">
              {Object.entries(runtime).map(([key, value]) => (
                <div key={key} className="contents">
                  <dt className="text-stone-500">{RUNTIME_LABELS[key] ?? key}</dt>
                  <dd className="font-mono text-stone-800 break-all">{formatRuntimeValue(value)}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="text-[11px] text-stone-500">No runtime details for this integration.</p>
          )}
          <p className="mt-1.5 text-[10px] text-stone-400">
            Hosts, ports and secrets come from the server environment and are not editable here.
          </p>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export function IntegrationSettings() {
  const { data, isLoading, isError, refetch, isFetching } = useIntegrations()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    )
  }

  const integrations: Integration[] = data?.integrations ?? []
  const llmRow = integrations.find((i) => i.type === 'LLM')
  const byType = (type: IntegrationType) => integrations.filter((i) => i.type === type)

  return (
    <div className="space-y-3 lg:space-y-4">
      <div className="relative bg-gradient-to-br from-stone-800 via-stone-800 to-stone-900 rounded-xl p-3 sm:p-4 text-white shadow-md overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="relative flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex-shrink-0 w-9 h-9 bg-amber-500/20 rounded-lg flex items-center justify-center ring-1 ring-amber-500/30">
              <Puzzle className="h-5 w-5 text-amber-400" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold text-white leading-tight">Integration Settings</h1>
              <p className="text-stone-300 text-xs">Turn services on or off, test them, and choose the language model</p>
            </div>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="border-stone-600 text-white hover:bg-stone-700"
          >
            <RefreshCw className={cn('h-3.5 w-3.5 mr-1', isFetching && 'animate-spin')} />
            Refresh
          </Button>
        </div>

        <div className="relative mt-3 grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          {[
            { label: 'Total', value: integrations.length, color: 'text-stone-200' },
            { label: 'Enabled', value: integrations.filter((i) => i.status === 'ACTIVE').length, color: 'text-emerald-300' },
            { label: 'Disabled', value: integrations.filter((i) => i.status !== 'ACTIVE').length, color: 'text-amber-300' },
            { label: 'Failed tests', value: integrations.filter((i) => i.lastTestResult === 'FAILED').length, color: 'text-rose-300' },
          ].map((chip) => (
            <div key={chip.label} className="bg-stone-700/40 ring-1 ring-stone-600/40 rounded-md px-2 py-1.5">
              <div className={cn('text-base font-bold leading-none', chip.color)}>{chip.value}</div>
              <p className="text-[10px] text-stone-300 truncate uppercase tracking-wide">{chip.label}</p>
            </div>
          ))}
        </div>
      </div>

      {isError && (
        <div className="px-3 py-2 bg-rose-50 border border-rose-200 rounded-md text-sm text-rose-700 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" /> Could not load integrations. Try Refresh.
        </div>
      )}

      <LlmProviderPanel row={llmRow} />

      <div className="space-y-2.5">
        {SECTIONS.map((section) => {
          const rows = byType(section.type)
          const Icon = section.icon
          return (
            <Card key={section.type} padding="sm">
              <div className="flex items-center gap-2 mb-2">
                <div className={cn('p-1.5 rounded-md', section.color)}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-stone-900">{section.label}</h3>
                  <p className="text-[11px] text-stone-500">{section.description}</p>
                </div>
              </div>
              {rows.length > 0 ? (
                <div className="space-y-1.5">
                  {rows.map((integration) => (
                    <IntegrationRow key={integration.integrationId} integration={integration} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-xs text-stone-500">
                  <Icon className="h-8 w-8 mx-auto mb-2 text-stone-300" />
                  <p className="text-sm">No {section.label.toLowerCase()} rows found</p>
                </div>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}
