import { useState, useRef, useEffect, Fragment, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Bot,
  Send,
  ThumbsUp,
  ThumbsDown,
  Copy,
  Check,
  RefreshCw,
  Lightbulb,
  FileText,
  Sparkles,
  GraduationCap,
  BookOpen,
  MessageSquare,
  ArrowDown,
  AlertCircle,
  Square,
  ExternalLink,
  HelpCircle,
  Wand2,
  ArrowRight,
  Settings,
  ShieldCheck,
} from 'lucide-react'
import { Button, Spinner, useErrorToast } from '@/components/ui'
import {
  useChatSession,
  useSendChatMessage,
  useClearChatSession,
  useSetChatFeedback,
  useChatPreferences,
  useUpdateChatPreferences,
  type ChatPreferences,
  type ChatResponseLength,
  type ChatTone,
  type ChatLanguage,
} from '@/lib/hooks/useStudent'
import { cn } from '@/lib/utils/cn'
import type { ChatMessage, ChatReference } from '@/types'

// ---------------------------------------------------------------------------
// Welcome view content
// ---------------------------------------------------------------------------

const PROMPT_DECKS: {
  key: string
  label: string
  icon: typeof BookOpen
  accent: string
  prompts: string[]
}[] = [
  {
    key: 'proposal',
    label: 'Proposal',
    icon: GraduationCap,
    accent: 'from-sky-500 to-blue-600',
    prompts: [
      'How do I write a strong problem statement for my proposal?',
      'What sections does an MMU FCI FYP proposal need?',
    ],
  },
  {
    key: 'methodology',
    label: 'Methodology',
    icon: Lightbulb,
    accent: 'from-violet-500 to-purple-600',
    prompts: [
      'When should I use Agile vs Waterfall for my FYP?',
      'How do I justify my chosen methodology in chapter 3?',
    ],
  },
  {
    key: 'writing',
    label: 'Writing',
    icon: BookOpen,
    accent: 'from-amber-500 to-orange-600',
    prompts: [
      'How do I structure my literature review chapter?',
      'What citation style does FCI expect?',
    ],
  },
  {
    key: 'supervision',
    label: 'Supervision',
    icon: MessageSquare,
    accent: 'from-emerald-500 to-green-600',
    prompts: [
      'What should I include in my weekly supervision log?',
      'How often should I meet my supervisor in FYP1?',
    ],
  },
]

// ---------------------------------------------------------------------------
// Reference chips
// ---------------------------------------------------------------------------

const REFERENCE_STYLES: Record<
  ChatReference['type'],
  { label: string; classes: string; icon: typeof BookOpen }
> = {
  HANDBOOK: { label: 'Handbook', classes: 'bg-primary-50 text-primary-700 border-primary-200', icon: BookOpen },
  FAQ: { label: 'FAQ', classes: 'bg-violet-50 text-violet-700 border-violet-200', icon: HelpCircle },
  RESOURCE: { label: 'Resource', classes: 'bg-neutral-50 text-neutral-700 border-neutral-200', icon: FileText },
  DEADLINE: { label: 'Deadline', classes: 'bg-amber-50 text-amber-700 border-amber-200', icon: FileText },
}

function ReferenceList({ references }: { references: ChatReference[] }) {
  if (!references.length) return null
  return (
    <div className="mt-3 flex flex-wrap gap-1.5">
      {references.map((ref, i) => {
        const style = REFERENCE_STYLES[ref.type] ?? REFERENCE_STYLES.RESOURCE
        const Icon = style.icon
        const inner = (
          <span
            className={cn(
              'inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-medium border',
              style.classes,
            )}
          >
            <Icon className="h-3 w-3" />
            <span className="text-[10px] uppercase tracking-wide opacity-70">{style.label}</span>
            <span className="truncate max-w-[180px]">{ref.title}</span>
            {ref.url && <ExternalLink className="h-3 w-3 opacity-60" />}
          </span>
        )
        return ref.url ? (
          <a key={i} href={ref.url} target="_blank" rel="noreferrer" className="hover:opacity-90 transition-opacity">
            {inner}
          </a>
        ) : (
          <Fragment key={i}>{inner}</Fragment>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Markdown-lite renderer
// ---------------------------------------------------------------------------

function FormattedContent({ text }: { text: string }) {
  const lines = text.split('\n')
  return (
    <div className="space-y-2 text-[15px] leading-relaxed text-neutral-800">
      {lines.map((line, i) => {
        if (line.trim() === '') return <div key={i} className="h-1" />

        const parts = line.split(/(\*\*[^*]+\*\*)/)
        const renderInline = (segments: string[]) =>
          segments.map((part, j) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return (
                <strong key={j} className="font-semibold text-neutral-900">
                  {part.slice(2, -2)}
                </strong>
              )
            }
            return <Fragment key={j}>{part}</Fragment>
          })

        if (/^\d+\.\s/.test(line.trim())) {
          const num = line.trim().match(/^\d+/)?.[0]
          const rest = line.trim().replace(/^\d+\.\s*/, '')
          return (
            <div key={i} className="flex gap-2 pl-1">
              <span className="text-primary-600 flex-shrink-0 font-semibold tabular-nums">{num}.</span>
              <span>{renderInline(rest.split(/(\*\*[^*]+\*\*)/))}</span>
            </div>
          )
        }

        if (/^[-•✅📅]\s/u.test(line.trim())) {
          const bulletChar = line.trim()[0] === '-' ? '•' : line.trim().match(/^[^\s]+/)?.[0]
          const rest = line.trim().replace(/^[-•✅📅]\s*/u, '')
          return (
            <div key={i} className="flex gap-2 pl-1">
              <span className="flex-shrink-0 text-primary-500">{bulletChar}</span>
              <span>{renderInline(rest.split(/(\*\*[^*]+\*\*)/))}</span>
            </div>
          )
        }

        return <p key={i}>{renderInline(parts)}</p>
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Typing indicator (assistant-aligned, no bubble)
// ---------------------------------------------------------------------------

function TypingIndicator() {
  return (
    <div className="group">
      <AssistantHeader />
      <div className="flex items-center gap-1.5 pl-8 mt-1">
        <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  )
}

function AssistantHeader() {
  return (
    <div className="flex items-center gap-2 mb-1">
      <div className="w-6 h-6 rounded-md bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center flex-shrink-0">
        <Bot className="h-3 w-3 text-white" />
      </div>
      <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">FYP Assistant</span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Welcome view
// ---------------------------------------------------------------------------

function WelcomeView({ onSuggestionClick }: { onSuggestionClick: (text: string) => void }) {
  const [activeDeck, setActiveDeck] = useState(PROMPT_DECKS[0].key)
  const deck = PROMPT_DECKS.find((d) => d.key === activeDeck) ?? PROMPT_DECKS[0]
  const ActiveIcon = deck.icon

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin">
      <div className="max-w-2xl mx-auto px-4 py-10">
        {/* Hero */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="relative mb-4">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 opacity-40 blur-xl" />
            <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 via-primary-600 to-primary-800 flex items-center justify-center shadow-lg shadow-primary-500/20 ring-1 ring-white/20">
              <Sparkles className="h-7 w-7 text-white" />
            </div>
          </div>

          <h2 className="text-2xl font-bold text-neutral-900 tracking-tight mb-1.5">
            How can I help with your FYP?
          </h2>
          <p className="text-neutral-500 text-sm max-w-md">
            Ask about guidelines, proposal writing, methodology, supervision, or report structure.
          </p>
        </div>

        {/* Deck tabs */}
        <div className="mb-3 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-1.5 text-neutral-500">
            <Wand2 className="h-3.5 w-3.5" />
            <p className="text-[11px] font-semibold uppercase tracking-wider">Example prompts</p>
          </div>
          <div className="flex items-center gap-1 p-0.5 bg-neutral-100 rounded-lg">
            {PROMPT_DECKS.map((d) => {
              const Icon = d.icon
              const active = d.key === activeDeck
              return (
                <button
                  key={d.key}
                  type="button"
                  onClick={() => setActiveDeck(d.key)}
                  className={cn(
                    'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all',
                    active
                      ? 'bg-white text-primary-700 shadow-sm'
                      : 'text-neutral-500 hover:text-neutral-700',
                  )}
                >
                  <Icon className="h-3 w-3" />
                  {d.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Active deck prompts */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-5">
          {deck.prompts.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => onSuggestionClick(prompt)}
              className="group flex items-start gap-3 p-3.5 bg-white border border-neutral-200 rounded-xl text-left hover:border-primary-300 hover:bg-primary-50/30 transition-all"
            >
              <div
                className={cn(
                  'w-8 h-8 rounded-lg bg-gradient-to-br flex items-center justify-center flex-shrink-0',
                  deck.accent,
                )}
              >
                <ActiveIcon className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-neutral-800 leading-snug">{prompt}</p>
                <span className="inline-flex items-center gap-1 mt-1.5 text-[11px] text-primary-600 opacity-0 group-hover:opacity-100 transition-opacity">
                  Send <ArrowRight className="h-3 w-3" />
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* Pro tip */}
        <div className="rounded-xl bg-neutral-50 border border-neutral-200 p-3.5 flex items-start gap-3">
          <Lightbulb className="h-4 w-4 text-primary-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-neutral-700 mb-0.5">Tip</p>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Be specific. "How do I justify a quantitative methodology for an IoT prototype?" beats
              "Tell me about methodology" — sharper context gets sharper answers.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Confidence badge
// ---------------------------------------------------------------------------

function ConfidenceBadge({ value }: { value: number }) {
  const pct = Math.round(value * 100)
  const tone =
    value >= 0.75
      ? 'text-success-600'
      : value >= 0.5
        ? 'text-amber-600'
        : 'text-neutral-500'
  return (
    <span className={cn('text-[11px] font-medium tabular-nums', tone)} title="Model confidence">
      {pct}%
    </span>
  )
}

// ---------------------------------------------------------------------------
// Conversation turn — AI = full-width prose; User = pill aligned right
// ---------------------------------------------------------------------------

function Turn({
  message,
  onCopy,
  onFeedback,
  feedbackPending,
}: {
  message: ChatMessage
  onCopy: () => void
  onFeedback: (next: 'UP' | 'DOWN' | null) => void
  feedbackPending: boolean
}) {
  const isUser = message.role === 'user'
  const feedback = message.feedback ?? null
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    onCopy()
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleThumb = (next: 'UP' | 'DOWN') => {
    if (feedbackPending) return
    onFeedback(feedback === next ? null : next)
  }

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-primary-600 text-white px-4 py-2.5 text-[15px] leading-relaxed whitespace-pre-wrap shadow-sm">
          {message.content}
        </div>
      </div>
    )
  }

  return (
    <div className="group">
      <AssistantHeader />
      <div className="pl-8">
        <FormattedContent text={message.content} />
        {message.references && message.references.length > 0 && (
          <ReferenceList references={message.references} />
        )}

        {/* Action row */}
        <div className="flex items-center gap-3 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-[11px] text-neutral-400 tabular-nums">
            {new Date(message.timestamp).toLocaleTimeString('en-MY', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>

          {message.confidence !== undefined && message.confidence > 0 && (
            <ConfidenceBadge value={message.confidence} />
          )}

          <div className="flex items-center gap-0.5 ml-auto">
            <button
              onClick={handleCopy}
              className="p-1.5 rounded-md hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700 transition-colors"
              title="Copy"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-success-500" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
            <button
              onClick={() => handleThumb('UP')}
              disabled={feedbackPending}
              className={cn(
                'p-1.5 rounded-md transition-colors',
                feedback === 'UP'
                  ? 'text-success-600 bg-success-50'
                  : 'text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100',
                feedbackPending && 'opacity-50 cursor-not-allowed',
              )}
              title="Helpful"
            >
              <ThumbsUp className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => handleThumb('DOWN')}
              disabled={feedbackPending}
              className={cn(
                'p-1.5 rounded-md transition-colors',
                feedback === 'DOWN'
                  ? 'text-error-600 bg-error-50'
                  : 'text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100',
                feedbackPending && 'opacity-50 cursor-not-allowed',
              )}
              title="Not helpful"
            >
              <ThumbsDown className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export function Chatbot() {
  const [pendingMessages, setPendingMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [showScrollBtn, setShowScrollBtn] = useState(false)
  const [showPreferences, setShowPreferences] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const errorToast = useErrorToast()

  // PDPA gate — if the user hasn't consented to AI processing yet, render the
  // consent prompt instead of the chat shell. Returning early avoids the
  // sessionQuery / sendMutation firing before consent is granted.
  const prefsQuery = useChatPreferences()
  const prefsLoaded = !prefsQuery.isLoading
  const consentGranted = prefsQuery.data?.aiProcessingConsented === true

  const sessionQuery = useChatSession()
  const sendMutation = useSendChatMessage()
  const clearMutation = useClearChatSession()
  const feedbackMutation = useSetChatFeedback()

  const isTyping = sendMutation.isPending

  const handleFeedback = (messageId: string, next: 'UP' | 'DOWN' | null) => {
    if (feedbackMutation.isPending) return
    feedbackMutation.mutate({ messageId, feedback: next }, {
      onError: (err: unknown) => {
        const msg = err instanceof Error ? err.message : 'Could not save feedback.'
        errorToast(msg)
      },
    })
  }

  const serverMessages = useMemo<ChatMessage[]>(
    () => sessionQuery.data?.messages ?? [],
    [sessionQuery.data],
  )

  useEffect(() => {
    if (pendingMessages.length === 0) return
    setPendingMessages((prev) =>
      prev.filter(
        (pm) =>
          !serverMessages.some(
            (sm) => sm.role === pm.role && sm.content === pm.content,
          ),
      ),
    )
  }, [serverMessages, pendingMessages.length])

  const messages = useMemo<ChatMessage[]>(
    () => [...serverMessages, ...pendingMessages],
    [serverMessages, pendingMessages],
  )

  const hasMessages = messages.length > 0

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior })
  }

  useEffect(() => {
    scrollToBottom(messages.length <= 2 ? 'auto' : 'smooth')
  }, [messages.length, isTyping])

  const handleScroll = () => {
    const el = scrollContainerRef.current
    if (!el) return
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    setShowScrollBtn(distFromBottom > 100)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px'
  }

  const handleSubmit = async (question?: string) => {
    const messageText = (question ?? inputValue).trim()
    if (!messageText || isTyping) return

    const userMessage: ChatMessage = {
      messageId: `pending-${Date.now()}`,
      role: 'user',
      content: messageText,
      timestamp: new Date().toISOString(),
    }
    setPendingMessages((prev) => [...prev, userMessage])
    setInputValue('')
    if (inputRef.current) inputRef.current.style.height = 'auto'

    try {
      await sendMutation.mutateAsync(messageText)
    } catch (err: unknown) {
      setPendingMessages((prev) => prev.filter((m) => m.messageId !== userMessage.messageId))
      const msg = err instanceof Error ? err.message : 'Failed to reach the FYP Assistant.'
      errorToast(msg)
    } finally {
      inputRef.current?.focus()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const startNewChat = async () => {
    if (clearMutation.isPending) return
    setPendingMessages([])
    setInputValue('')
    try {
      await clearMutation.mutateAsync()
    } catch {
      errorToast('Could not end the previous chat. Starting fresh anyway.')
    }
  }

  // PDPA gate — placed after all hooks to satisfy rules-of-hooks. The chat
  // shell only renders when consent has been explicitly granted.
  if (prefsLoaded && !consentGranted) {
    return <AiConsentPrompt />
  }

  return (
    <div className="h-[calc(100dvh-7rem)] min-h-0 flex flex-col bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
      {/* Slim header — always visible */}
      <header className="flex items-center justify-between gap-3 px-4 py-3 border-b border-neutral-200 bg-white">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center flex-shrink-0 shadow-sm">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div className="flex items-center gap-2 min-w-0">
            <h1 className="text-sm font-semibold text-neutral-900 truncate">FYP Assistant</h1>
            <StatusPill loading={sessionQuery.isLoading} />
          </div>
        </div>

        <div className="relative flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => setShowPreferences((v) => !v)}
            aria-label="Response style"
            title="Response style"
            aria-expanded={showPreferences}
            className={cn(
              'inline-flex items-center justify-center w-8 h-8 rounded-lg transition-colors',
              showPreferences
                ? 'text-primary-700 bg-primary-50'
                : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100',
            )}
            type="button"
          >
            <Settings className="h-3.5 w-3.5" />
          </button>
          {hasMessages && (
            <button
              onClick={startNewChat}
              disabled={clearMutation.isPending}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-medium transition-colors"
              type="button"
            >
              {clearMutation.isPending ? <Spinner size="sm" /> : <RefreshCw className="h-3.5 w-3.5" />}
              New chat
            </button>
          )}
          <PreferencesPopover open={showPreferences} onClose={() => setShowPreferences(false)} />
        </div>
      </header>

      {/* Body */}
      {sessionQuery.isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <Spinner size="lg" />
        </div>
      ) : sessionQuery.isError ? (
        <ErrorState onRetry={() => sessionQuery.refetch()} />
      ) : !hasMessages ? (
        <WelcomeView onSuggestionClick={handleSubmit} />
      ) : (
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto scrollbar-thin"
        >
          <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
            {messages.map((message) => (
              <Turn
                key={message.messageId}
                message={message}
                onCopy={() => copyToClipboard(message.content)}
                onFeedback={(next) => handleFeedback(message.messageId, next)}
                feedbackPending={feedbackMutation.isPending}
              />
            ))}

            {isTyping && <TypingIndicator />}

            <div ref={messagesEndRef} />
          </div>
        </div>
      )}

      {/* Scroll-to-bottom */}
      {hasMessages && showScrollBtn && (
        <div className="relative">
          <button
            onClick={() => scrollToBottom()}
            className="absolute -top-12 left-1/2 -translate-x-1/2 w-9 h-9 rounded-full bg-white border border-neutral-200 shadow-md flex items-center justify-center text-neutral-500 hover:text-neutral-700 hover:shadow-lg transition-all z-10"
            title="Scroll to bottom"
          >
            <ArrowDown className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Composer — sticky bottom */}
      <div className="border-t border-neutral-200 bg-white px-4 py-3">
        <div className="max-w-3xl mx-auto">
          <div className="relative flex items-end gap-2 rounded-2xl border border-neutral-200 bg-neutral-50 focus-within:bg-white focus-within:border-primary-400 focus-within:ring-2 focus-within:ring-primary-500/20 transition-all">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              disabled={sessionQuery.isLoading}
              placeholder="Ask anything about your FYP…"
              rows={1}
              className="flex-1 px-4 py-3 bg-transparent focus:outline-none resize-none text-[15px] placeholder:text-neutral-400 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ minHeight: '48px', maxHeight: '160px' }}
            />
            <div className="p-2">
              <Button
                variant="primary"
                onClick={() => (isTyping ? undefined : handleSubmit())}
                disabled={(!inputValue.trim() && !isTyping) || sessionQuery.isLoading}
                className="rounded-xl h-9 w-9 p-0 flex-shrink-0"
                type="button"
              >
                {isTyping ? <Square className="h-3.5 w-3.5 fill-current" /> : <Send className="h-3.5 w-3.5" />}
              </Button>
            </div>
          </div>
          <p className="text-[11px] text-neutral-400 mt-2 text-center">
            <kbd className="px-1.5 py-0.5 bg-neutral-100 rounded text-[10px] font-mono border border-neutral-200">Enter</kbd> to send ·{' '}
            <kbd className="px-1.5 py-0.5 bg-neutral-100 rounded text-[10px] font-mono border border-neutral-200">Shift + Enter</kbd> for new line · Responses may be inaccurate — verify important details.
          </p>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Status pill
// ---------------------------------------------------------------------------

function StatusPill({ loading }: { loading: boolean }) {
  if (loading) {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-neutral-100 text-neutral-600 rounded-full text-[10px] font-medium">
        <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 animate-pulse" />
        Loading
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-success-50 text-success-700 rounded-full text-[10px] font-medium">
      <span className="w-1.5 h-1.5 rounded-full bg-success-500 animate-pulse" />
      Online
    </span>
  )
}

// ---------------------------------------------------------------------------
// Style preferences popover
// ---------------------------------------------------------------------------

const LENGTH_OPTIONS: { value: ChatResponseLength; label: string; hint: string }[] = [
  { value: 'SHORT', label: 'Short', hint: '1-3 sentences or tight bullets' },
  { value: 'BALANCED', label: 'Balanced', hint: '1-2 short paragraphs' },
  { value: 'DETAILED', label: 'Detailed', hint: 'Full explanation with examples' },
]
const TONE_OPTIONS: { value: ChatTone; label: string; hint: string }[] = [
  { value: 'FORMAL', label: 'Formal', hint: 'Academic, third person' },
  { value: 'NEUTRAL', label: 'Neutral', hint: 'Clear and direct' },
  { value: 'CASUAL', label: 'Casual', hint: 'Friendly, conversational' },
]
const LANGUAGE_OPTIONS: { value: ChatLanguage; label: string }[] = [
  { value: 'EN', label: 'English' },
  { value: 'MS', label: 'Bahasa Malaysia' },
  { value: 'ZH', label: '中文' },
  { value: 'MIXED', label: 'Mixed (Manglish)' },
]

function PreferencesPopover({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data, isLoading } = useChatPreferences()
  const update = useUpdateChatPreferences()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  if (!open) return null

  const handleChange = (patch: Partial<ChatPreferences>) => {
    if (!data) return
    update.mutate({ ...data, ...patch })
  }

  return (
    <div
      ref={ref}
      className="absolute right-0 top-12 z-20 w-72 rounded-xl border border-neutral-200 bg-white shadow-xl p-4 space-y-4"
      role="dialog"
      aria-label="Response style"
    >
      <div>
        <h3 className="text-sm font-semibold text-neutral-900">Response style</h3>
        <p className="text-[11px] text-neutral-500">How would you like the assistant to answer?</p>
      </div>

      {isLoading || !data ? (
        <div className="flex items-center justify-center py-4">
          <Spinner size="sm" />
        </div>
      ) : (
        <>
          <Section title="Length">
            <SegmentedGroup<ChatResponseLength>
              value={data.responseLength}
              options={LENGTH_OPTIONS}
              onChange={(v) => handleChange({ responseLength: v })}
            />
          </Section>
          <Section title="Tone">
            <SegmentedGroup<ChatTone>
              value={data.tone}
              options={TONE_OPTIONS}
              onChange={(v) => handleChange({ tone: v })}
            />
          </Section>
          <Section title="Language">
            <select
              value={data.language}
              onChange={(e) => handleChange({ language: e.target.value as ChatLanguage })}
              className="w-full text-sm px-3 py-2 rounded-lg border border-neutral-200 bg-neutral-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 transition-all"
            >
              {LANGUAGE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </Section>
          <p className="text-[10px] text-neutral-400">
            Saved automatically. Applies from the next message.
          </p>
        </>
      )}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">{title}</p>
      {children}
    </div>
  )
}

function SegmentedGroup<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T
  options: { value: T; label: string; hint?: string }[]
  onChange: (v: T) => void
}) {
  return (
    <div className="flex gap-1 p-0.5 bg-neutral-100 rounded-lg" role="radiogroup">
      {options.map((opt) => {
        const active = opt.value === value
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            title={opt.hint}
            onClick={() => onChange(opt.value)}
            className={cn(
              'flex-1 text-xs font-medium py-1.5 rounded-md transition-colors',
              active
                ? 'bg-white text-primary-700 shadow-sm'
                : 'text-neutral-500 hover:text-neutral-700',
            )}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Error state
// ---------------------------------------------------------------------------

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 text-center">
      <div className="w-14 h-14 rounded-2xl bg-error-50 border border-error-200 flex items-center justify-center mb-4">
        <AlertCircle className="h-7 w-7 text-error-500" />
      </div>
      <h2 className="text-lg font-semibold text-neutral-900 mb-1">Couldn't load your chat</h2>
      <p className="text-neutral-500 text-sm max-w-sm mb-4">
        We couldn't reach the FYP Assistant. Check your connection and try again.
      </p>
      <Button variant="primary" onClick={onRetry} type="button">
        Retry
      </Button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// PDPA consent prompt — blocks the chat until the student opts in to having
// messages processed by an overseas LLM provider (Groq / OpenAI).
// ---------------------------------------------------------------------------
function AiConsentPrompt() {
  const update = useUpdateChatPreferences()
  const prefs = useChatPreferences()
  const [agreed, setAgreed] = useState(false)
  const errorToast = useErrorToast()

  const handleConsent = async () => {
    if (!agreed || update.isPending || !prefs.data) return
    try {
      await update.mutateAsync({
        responseLength: prefs.data.responseLength,
        tone: prefs.data.tone,
        language: prefs.data.language,
        aiProcessingConsented: true,
      })
    } catch (err) {
      errorToast(err instanceof Error ? err.message : 'Could not save your consent. Please try again.')
    }
  }

  const explicitlyDenied = prefs.data?.aiProcessingConsented === false

  return (
    <div className="h-[calc(100dvh-7rem)] min-h-0 flex items-center justify-center bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden p-6">
      <div className="max-w-lg w-full">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-11 h-11 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="h-5 w-5 text-primary-700" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-neutral-900">FYP Assistant uses an external AI provider</h1>
            <p className="text-sm text-neutral-500 mt-1">
              {explicitlyDenied
                ? 'AI processing is currently disabled for your account.'
                : 'One-time consent required before the chatbot can be used.'}
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 mb-4 text-sm text-neutral-700 leading-relaxed space-y-2">
          <p>
            Your chat messages and the supporting context the system attaches (your proposal title, recent meeting
            logs, document metadata) are sent to a third-party large language model provider — Groq or OpenAI —
            hosted outside Malaysia.
          </p>
          <p>
            The provider processes the message to produce a reply and does not store your data beyond its stated
            retention policy. Your name, MMU ID, email, phone, and password are never sent.
          </p>
          <p className="text-xs text-neutral-500">
            Full details in the{' '}
            <Link to="/privacy" className="font-medium text-primary-600 hover:text-primary-700 inline-flex items-center gap-0.5">
              Privacy Notice <ExternalLink className="h-3 w-3" />
            </Link>
            . You can revoke this consent at any time in Account Settings → Privacy.
          </p>
        </div>

        <label className="flex items-start gap-2.5 mb-4 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
          />
          <span className="text-sm text-neutral-700">
            I consent to my chat messages being processed by an external AI provider as described above.
          </span>
        </label>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            onClick={handleConsent}
            disabled={!agreed || update.isPending}
            isLoading={update.isPending}
          >
            {explicitlyDenied ? 'Re-enable FYP Assistant' : 'Enable FYP Assistant'}
          </Button>
          <Link to="/student/dashboard" className="text-sm font-medium text-neutral-600 hover:text-neutral-900 ml-2">
            Not now
          </Link>
        </div>
      </div>
    </div>
  )
}
