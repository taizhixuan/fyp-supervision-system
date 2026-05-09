import { useState, useRef, useEffect, Fragment, useMemo } from 'react'
import {
  Bot,
  Send,
  User,
  ThumbsUp,
  ThumbsDown,
  Copy,
  Check,
  RefreshCw,
  Lightbulb,
  Clock,
  FileText,
  Calendar,
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
} from 'lucide-react'
import { Button, Spinner, useErrorToast } from '@/components/ui'
import {
  useChatSession,
  useSendChatMessage,
  useClearChatSession,
} from '@/lib/hooks/useStudent'
import { cn } from '@/lib/utils/cn'
import type { ChatMessage, ChatReference } from '@/types'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SUGGESTED_QUESTIONS = [
  { icon: FileText, text: 'How do I write a good problem statement?', color: 'from-sky-500 to-blue-600' },
  { icon: Lightbulb, text: 'How do I choose a research methodology?', color: 'from-violet-500 to-purple-600' },
  { icon: Clock, text: 'What should I include in my weekly supervision log?', color: 'from-emerald-500 to-green-600' },
  { icon: BookOpen, text: 'How do I structure a literature review?', color: 'from-amber-500 to-orange-600' },
]

// Topic decks for the welcome view — each category surfaces 2 example prompts.
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

const CAPABILITY_HIGHLIGHTS: { icon: typeof BookOpen; label: string; sub: string }[] = [
  { icon: BookOpen, label: '15 topics', sub: 'FYP knowledge base' },
  { icon: Sparkles, label: 'RAG-powered', sub: 'Context-aware answers' },
  { icon: GraduationCap, label: 'MMU FCI', sub: 'Tuned for your faculty' },
]

// ---------------------------------------------------------------------------
// Reference rendering
// ---------------------------------------------------------------------------

const REFERENCE_STYLES: Record<ChatReference['type'], { label: string; classes: string; icon: typeof BookOpen }> = {
  HANDBOOK: { label: 'Handbook', classes: 'bg-primary-50 text-primary-700 border-primary-200', icon: BookOpen },
  FAQ: { label: 'FAQ', classes: 'bg-violet-50 text-violet-700 border-violet-200', icon: HelpCircle },
  RESOURCE: { label: 'Resource', classes: 'bg-neutral-50 text-neutral-700 border-neutral-200', icon: FileText },
  DEADLINE: { label: 'Deadline', classes: 'bg-amber-50 text-amber-700 border-amber-200', icon: Calendar },
}

function ReferenceList({ references }: { references: ChatReference[] }) {
  if (!references.length) return null
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {references.map((ref, i) => {
        const style = REFERENCE_STYLES[ref.type] ?? REFERENCE_STYLES.RESOURCE
        const Icon = style.icon
        const inner = (
          <span
            className={cn(
              'inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium border',
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
    <div className="space-y-1 text-sm leading-relaxed">
      {lines.map((line, i) => {
        if (line.trim() === '') return <div key={i} className="h-2" />

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
// Typing indicator
// ---------------------------------------------------------------------------

function TypingIndicator() {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center flex-shrink-0 shadow-sm">
        <Bot className="h-4 w-4 text-white" />
      </div>
      <div className="bg-white border border-neutral-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
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
      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* Hero */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="relative mb-5">
            {/* Pulsing ring */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary-500 to-primary-700 opacity-40 blur-xl animate-pulse" />
            <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-br from-primary-500 via-primary-600 to-primary-800 flex items-center justify-center shadow-xl shadow-primary-500/30 ring-1 ring-white/20">
              <Sparkles className="h-10 w-10 text-white" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-success-500 rounded-full border-2 border-white shadow-md" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900 tracking-tight mb-2">
            How can I help with your FYP?
          </h2>
          <p className="text-neutral-500 text-sm max-w-md">
            Ask anything about guidelines, proposal writing, methodology, supervision, or report structure.
          </p>
        </div>

        {/* Capability highlight cards */}
        <div className="grid grid-cols-3 gap-3 mb-8 max-w-xl mx-auto">
          {CAPABILITY_HIGHLIGHTS.map((cap) => {
            const Icon = cap.icon
            return (
              <div
                key={cap.label}
                className="bg-white border border-neutral-200 rounded-xl p-3 text-center hover:border-primary-200 hover:shadow-sm transition-all"
              >
                <div className="w-8 h-8 mx-auto mb-1.5 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center">
                  <Icon className="h-4 w-4" />
                </div>
                <p className="text-xs font-semibold text-neutral-900">{cap.label}</p>
                <p className="text-[10px] text-neutral-500 mt-0.5 leading-tight">{cap.sub}</p>
              </div>
            )
          })}
        </div>

        {/* Deck tabs */}
        <div className="mb-3 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Wand2 className="h-4 w-4 text-neutral-500" />
            <p className="text-xs font-semibold text-neutral-700 uppercase tracking-wider">
              Example prompts
            </p>
          </div>
          <div className="flex items-center gap-1 p-1 bg-neutral-100 rounded-lg">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          {deck.prompts.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => onSuggestionClick(prompt)}
              className="group relative overflow-hidden flex items-start gap-3 p-4 bg-white border border-neutral-200 rounded-xl text-left hover:border-primary-300 hover:shadow-lg hover:shadow-primary-500/10 transition-all duration-200"
            >
              <div
                className={cn(
                  'w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-105 transition-transform',
                  deck.accent,
                )}
              >
                <ActiveIcon className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-neutral-800 group-hover:text-neutral-900 leading-snug">
                  {prompt}
                </p>
                <span className="inline-flex items-center gap-1 mt-2 text-[11px] text-primary-600 opacity-0 group-hover:opacity-100 transition-opacity">
                  Send <ArrowRight className="h-3 w-3" />
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* Pro tip */}
        <div className="rounded-xl bg-gradient-to-br from-primary-50 via-white to-violet-50 border border-primary-100 p-4 flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-white border border-primary-200 flex items-center justify-center flex-shrink-0">
            <Lightbulb className="h-4 w-4 text-primary-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-primary-900 mb-0.5">Pro tip</p>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Be specific. "How do I justify a quantitative methodology for an IoT prototype?" beats
              "Tell me about methodology" — the assistant gives sharper answers when you give it more context.
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
      ? 'bg-success-50 text-success-700 border-success-200'
      : value >= 0.5
        ? 'bg-amber-50 text-amber-700 border-amber-200'
        : 'bg-neutral-50 text-neutral-600 border-neutral-200'
  return (
    <span
      className={cn('inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border text-[10px] font-medium', tone)}
      title="Model confidence"
    >
      {pct}%
    </span>
  )
}

// ---------------------------------------------------------------------------
// Message bubble
// ---------------------------------------------------------------------------

function MessageBubble({
  message,
  onCopy,
}: {
  message: ChatMessage
  onCopy: () => void
}) {
  const isUser = message.role === 'user'
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null)
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    onCopy()
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={cn('flex items-start gap-3', isUser && 'flex-row-reverse')}>
      {isUser ? (
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-700 to-primary-900 flex items-center justify-center flex-shrink-0 shadow-sm">
          <User className="h-4 w-4 text-white" />
        </div>
      ) : (
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center flex-shrink-0 shadow-sm">
          <Bot className="h-4 w-4 text-white" />
        </div>
      )}

      <div className={cn('max-w-[78%] group', isUser && 'text-right')}>
        <div
          className={cn(
            'rounded-2xl px-4 py-3 inline-block text-left',
            isUser
              ? 'bg-gradient-to-br from-primary-700 to-primary-900 text-white rounded-tr-sm shadow-md shadow-primary-900/10'
              : 'bg-white border border-neutral-200 text-neutral-800 rounded-tl-sm shadow-sm',
          )}
        >
          {isUser ? (
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
          ) : (
            <>
              <FormattedContent text={message.content} />
              {message.references && message.references.length > 0 && (
                <ReferenceList references={message.references} />
              )}
            </>
          )}
        </div>

        <div
          className={cn(
            'flex items-center gap-2 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200',
            isUser ? 'justify-end' : 'justify-start',
          )}
        >
          <span className="text-[11px] text-neutral-400">
            {new Date(message.timestamp).toLocaleTimeString('en-MY', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>

          {!isUser && message.confidence !== undefined && message.confidence > 0 && (
            <ConfidenceBadge value={message.confidence} />
          )}

          {!isUser && (
            <div className="flex items-center gap-0.5">
              <button
                onClick={handleCopy}
                className="p-1 rounded-md hover:bg-neutral-100 text-neutral-400 hover:text-neutral-600 transition-colors"
                title="Copy"
              >
                {copied ? <Check className="h-3 w-3 text-success-500" /> : <Copy className="h-3 w-3" />}
              </button>
              <button
                onClick={() => setFeedback(feedback === 'up' ? null : 'up')}
                className={cn(
                  'p-1 rounded-md transition-colors',
                  feedback === 'up'
                    ? 'text-success-600 bg-success-50'
                    : 'text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100',
                )}
                title="Helpful"
              >
                <ThumbsUp className="h-3 w-3" />
              </button>
              <button
                onClick={() => setFeedback(feedback === 'down' ? null : 'down')}
                className={cn(
                  'p-1 rounded-md transition-colors',
                  feedback === 'down'
                    ? 'text-error-600 bg-error-50'
                    : 'text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100',
                )}
                title="Not helpful"
              >
                <ThumbsDown className="h-3 w-3" />
              </button>
            </div>
          )}
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
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const errorToast = useErrorToast()

  const sessionQuery = useChatSession()
  const sendMutation = useSendChatMessage()
  const clearMutation = useClearChatSession()

  const isTyping = sendMutation.isPending

  const serverMessages = useMemo<ChatMessage[]>(
    () => sessionQuery.data?.messages ?? [],
    [sessionQuery.data],
  )

  // Drop optimistic messages once the server has persisted them (matched by content)
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
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
  }

  const handleSubmit = async (question?: string) => {
    const messageText = (question ?? inputValue).trim()
    if (!messageText || isTyping) return

    // Optimistic user message
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
      // The effect above drops the optimistic message once the server-side
      // copy appears in the refetched session.
    } catch (err: unknown) {
      // Remove the optimistic message and surface the error
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

  // ------------------------------------------------------------------
  // Render
  // ------------------------------------------------------------------

  return (
    <div className="h-[calc(100vh-180px)] flex flex-col">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-800 via-primary-900 to-primary-950 p-5 text-white shadow-xl mb-4">
        {/* Decorative blobs */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-primary-400/15 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-56 h-56 bg-violet-500/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
        {/* Subtle grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />

        <div className="relative flex items-center justify-between gap-3">
          <div className="flex items-center gap-4 min-w-0">
            <div className="relative flex-shrink-0">
              <div className="absolute inset-0 rounded-xl bg-primary-400/30 blur-md" />
              <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-white/20 to-white/5 backdrop-blur-sm flex items-center justify-center ring-1 ring-white/30">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="truncate">FYP Assistant</span>
                <StatusPill loading={sessionQuery.isLoading} />
              </h1>
              <p className="text-primary-200 text-sm mt-0.5 truncate flex items-center gap-1.5">
                <Sparkles className="h-3 w-3 text-primary-300" />
                Powered by RAG over the FYP knowledge base
              </p>
            </div>
          </div>

          {hasMessages && (
            <button
              onClick={startNewChat}
              disabled={clearMutation.isPending}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors flex-shrink-0 ring-1 ring-white/10"
              type="button"
            >
              {clearMutation.isPending ? (
                <Spinner size="sm" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
              New Chat
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex flex-col bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
        {sessionQuery.isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <Spinner size="lg" />
          </div>
        ) : sessionQuery.isError ? (
          <ErrorState onRetry={() => sessionQuery.refetch()} />
        ) : !hasMessages ? (
          <WelcomeView onSuggestionClick={handleSubmit} />
        ) : (
          <>
            <div
              ref={scrollContainerRef}
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto p-5 space-y-5 scrollbar-thin bg-gradient-to-b from-neutral-50/50 to-white"
            >
              {messages.map((message) => (
                <MessageBubble
                  key={message.messageId}
                  message={message}
                  onCopy={() => copyToClipboard(message.content)}
                />
              ))}

              {isTyping && <TypingIndicator />}

              <div ref={messagesEndRef} />
            </div>

            {showScrollBtn && (
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

            {messages.length <= 2 && !isTyping && (
              <div className="px-5 pb-3">
                <p className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider mb-2">
                  Try asking
                </p>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTED_QUESTIONS.map((q) => (
                    <button
                      key={q.text}
                      onClick={() => handleSubmit(q.text)}
                      className="px-3 py-1.5 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 rounded-lg text-xs text-neutral-600 hover:text-neutral-800 transition-colors"
                    >
                      {q.text}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Input */}
        <div className="border-t border-neutral-200 bg-white p-4">
          <div className="flex items-end gap-3">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                disabled={sessionQuery.isLoading}
                placeholder="Ask a question about your FYP..."
                rows={1}
                className="w-full px-4 py-3 rounded-xl border border-neutral-200 bg-neutral-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 resize-none text-sm placeholder:text-neutral-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ minHeight: '48px', maxHeight: '120px' }}
              />
              <div className="absolute right-3 bottom-2 text-[10px] text-neutral-300 pointer-events-none">
                {inputValue.length > 0 && `${inputValue.length}`}
              </div>
            </div>
            <Button
              variant="primary"
              onClick={() => (isTyping ? undefined : handleSubmit())}
              disabled={(!inputValue.trim() && !isTyping) || sessionQuery.isLoading}
              className="rounded-xl h-12 w-12 p-0 flex-shrink-0 shadow-md shadow-primary-500/20"
              type="button"
            >
              {isTyping ? <Square className="h-4 w-4 fill-current" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-[11px] text-neutral-400 mt-2 text-center">
            Press <kbd className="px-1.5 py-0.5 bg-neutral-100 rounded text-[10px] font-mono border border-neutral-200">Enter</kbd> to send · <kbd className="px-1.5 py-0.5 bg-neutral-100 rounded text-[10px] font-mono border border-neutral-200">Shift + Enter</kbd> for new line · Responses may be inaccurate — verify important details.
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
      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/10 text-primary-100 rounded-full text-[11px] font-medium">
        <span className="w-1.5 h-1.5 rounded-full bg-primary-300 animate-pulse" />
        Loading
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-success-500/20 text-success-300 rounded-full text-[11px] font-medium">
      <span className="w-1.5 h-1.5 rounded-full bg-success-400 animate-pulse" />
      Online
    </span>
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
