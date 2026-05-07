import { useState, useRef, useEffect, Fragment } from 'react'
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
} from 'lucide-react'
import { Button } from '@/components/ui'
import { useChatbot } from '@/lib/hooks/useStudent'
import { cn } from '@/lib/utils/cn'
import type { ChatMessage } from '@/types'

// Suggested questions
const SUGGESTED_QUESTIONS = [
  { icon: FileText, text: 'How do I write a good problem statement?', color: 'from-sky-500 to-blue-600' },
  { icon: Calendar, text: 'What are the upcoming deadlines?', color: 'from-amber-500 to-orange-600' },
  { icon: Lightbulb, text: 'How do I choose a methodology?', color: 'from-violet-500 to-purple-600' },
  { icon: Clock, text: 'What should I include in my weekly log?', color: 'from-emerald-500 to-green-600' },
]

// Quick capability chips for the welcome view
const CAPABILITIES = [
  { icon: BookOpen, label: 'FYP Guidelines' },
  { icon: Calendar, label: 'Deadlines' },
  { icon: GraduationCap, label: 'Proposal Help' },
  { icon: MessageSquare, label: 'Supervision Tips' },
]

// Simple markdown-like renderer for bold, lists, and code
function FormattedContent({ text }: { text: string }) {
  const lines = text.split('\n')

  return (
    <div className="space-y-1 text-sm leading-relaxed">
      {lines.map((line, i) => {
        if (line.trim() === '') return <div key={i} className="h-2" />

        // Render bold text with **text**
        const parts = line.split(/(\*\*[^*]+\*\*)/)
        const rendered = parts.map((part, j) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return (
              <strong key={j} className="font-semibold">
                {part.slice(2, -2)}
              </strong>
            )
          }
          return <Fragment key={j}>{part}</Fragment>
        })

        // Numbered list items
        if (/^\d+\.\s/.test(line.trim())) {
          return (
            <div key={i} className="flex gap-2 pl-1">
              <span className="text-neutral-400 flex-shrink-0 font-medium">{line.trim().match(/^\d+/)?.[0]}.</span>
              <span>{rendered.slice(0).map((r, idx) => typeof r === 'string' ? r.replace(/^\d+\.\s*/, '') : r)}</span>
            </div>
          )
        }

        // Bullet items (- or •  or ✅ or 📅)
        if (/^[-•✅📅]\s/u.test(line.trim())) {
          return (
            <div key={i} className="flex gap-2 pl-1">
              <span className="flex-shrink-0">{line.trim()[0] === '-' ? '•' : line.trim().match(/^[^\s]+/)?.[0]}</span>
              <span>{parts.map((part, j) => {
                const cleaned = j === 0 ? part.replace(/^[-•✅📅]\s*/u, '') : part
                if (cleaned.startsWith('**') && cleaned.endsWith('**')) {
                  return <strong key={j} className="font-semibold">{cleaned.slice(2, -2)}</strong>
                }
                return <Fragment key={j}>{cleaned}</Fragment>
              })}</span>
            </div>
          )
        }

        return <p key={i}>{rendered}</p>
      })}
    </div>
  )
}

// Animated typing dots
function TypingIndicator() {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center flex-shrink-0 shadow-sm">
        <Bot className="h-4 w-4 text-white" />
      </div>
      <div className="bg-white border border-neutral-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  )
}

// Welcome hero shown before conversation starts
function WelcomeView({ onSuggestionClick }: { onSuggestionClick: (text: string) => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-10">
      {/* Bot avatar */}
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-800 flex items-center justify-center shadow-xl shadow-primary-500/20">
          <Sparkles className="h-10 w-10 text-white" />
        </div>
        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-success-500 rounded-full border-2 border-white" />
      </div>

      <h2 className="text-xl font-bold text-neutral-900 mb-1">FYP Assistant</h2>
      <p className="text-neutral-500 text-sm mb-6 text-center max-w-sm">
        I can help you with guidelines, deadlines, proposal writing, and everything about your Final Year Project.
      </p>

      {/* Capability chips */}
      <div className="flex flex-wrap justify-center gap-2 mb-8">
        {CAPABILITIES.map((cap) => {
          const Icon = cap.icon
          return (
            <span
              key={cap.label}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-100 text-neutral-600 rounded-full text-xs font-medium"
            >
              <Icon className="h-3.5 w-3.5" />
              {cap.label}
            </span>
          )
        })}
      </div>

      {/* Suggested questions grid */}
      <div className="w-full max-w-lg grid grid-cols-1 sm:grid-cols-2 gap-3">
        {SUGGESTED_QUESTIONS.map((q) => {
          const Icon = q.icon
          return (
            <button
              key={q.text}
              onClick={() => onSuggestionClick(q.text)}
              className="group flex items-start gap-3 p-4 bg-white border border-neutral-200 rounded-xl text-left hover:border-primary-300 hover:shadow-md hover:shadow-primary-500/5 transition-all duration-200"
            >
              <div className={cn(
                'w-9 h-9 rounded-lg bg-gradient-to-br flex items-center justify-center flex-shrink-0 shadow-sm',
                q.color
              )}>
                <Icon className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm text-neutral-700 group-hover:text-neutral-900 leading-snug pt-1">
                {q.text}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

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
      {/* Avatar */}
      {isUser ? (
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-700 to-primary-900 flex items-center justify-center flex-shrink-0 shadow-sm">
          <User className="h-4 w-4 text-white" />
        </div>
      ) : (
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center flex-shrink-0 shadow-sm">
          <Bot className="h-4 w-4 text-white" />
        </div>
      )}

      {/* Message content */}
      <div className={cn('max-w-[78%] group', isUser && 'text-right')}>
        <div
          className={cn(
            'rounded-2xl px-4 py-3 inline-block text-left',
            isUser
              ? 'bg-gradient-to-br from-primary-700 to-primary-900 text-white rounded-tr-sm shadow-md shadow-primary-900/10'
              : 'bg-white border border-neutral-200 text-neutral-800 rounded-tl-sm shadow-sm'
          )}
        >
          {isUser ? (
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
          ) : (
            <FormattedContent text={message.content} />
          )}
        </div>

        {/* Actions & Timestamp */}
        <div
          className={cn(
            'flex items-center gap-2 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200',
            isUser ? 'justify-end' : 'justify-start'
          )}
        >
          <span className="text-[11px] text-neutral-400">
            {new Date(message.timestamp).toLocaleTimeString('en-MY', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>

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
                    : 'text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100'
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
                    : 'text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100'
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

export function Chatbot() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [showScrollBtn, setShowScrollBtn] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const chatbot = useChatbot()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping])

  // Detect when user has scrolled away from the bottom
  const handleScroll = () => {
    const el = scrollContainerRef.current
    if (!el) return
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    setShowScrollBtn(distFromBottom > 100)
  }

  // Auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
  }

  const handleSubmit = async (question?: string) => {
    const messageText = question || inputValue.trim()
    if (!messageText || isTyping) return

    // Add user message
    const userMessage: ChatMessage = {
      messageId: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, userMessage])
    setInputValue('')
    setIsTyping(true)

    // Reset textarea height
    if (inputRef.current) {
      inputRef.current.style.height = 'auto'
    }

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Simulated response based on question
      let response = 'I understand your question. Let me help you with that. Could you provide more details about what specific aspect of your FYP you need guidance on?'

      if (messageText.toLowerCase().includes('problem statement')) {
        response = `A good problem statement should:\n\n1. **Clearly identify the problem** — What issue are you addressing?\n2. **Explain the significance** — Why does this problem matter?\n3. **Define the scope** — What are the boundaries of your research?\n4. **Present the gap** — What's missing in current solutions?\n\nTip: Keep it concise (usually 1-2 paragraphs) and avoid jargon. Would you like me to review your draft problem statement?`
      } else if (messageText.toLowerCase().includes('deadline')) {
        response = `Here are your upcoming deadlines:\n\n📅 **Proposal Submission** — 15 Feb 2025\n📅 **Mid-Semester Presentation** — 15 Mar 2025\n📅 **Final Report** — 31 May 2025\n📅 **Final Presentation** — 15 Jun 2025\n\nYou can view all deadlines in the Deadlines section. Would you like me to set up reminders?`
      } else if (messageText.toLowerCase().includes('methodology')) {
        response = `Choosing a methodology depends on your project type:\n\n**For Software Development:**\n- Agile/Scrum — Good for iterative development\n- Waterfall — Suitable for well-defined requirements\n- RAD — When you need rapid prototyping\n\n**For Research:**\n- Quantitative — Data-driven analysis\n- Qualitative — Exploratory research\n- Mixed Methods — Combining both approaches\n\nWhat type of project are you working on? I can give more specific recommendations.`
      } else if (messageText.toLowerCase().includes('weekly log') || messageText.toLowerCase().includes('supervision log')) {
        response = `Your weekly supervision log should include:\n\n✅ **Activities Completed** — What you worked on\n✅ **Progress Made** — Percentage completion\n✅ **Challenges Faced** — Any obstacles\n✅ **Planned Activities** — Next week's tasks\n\nTips:\n- Be specific and measurable\n- Include evidence of work (screenshots, code commits)\n- Mention any help needed from supervisor\n\nWould you like help drafting your current week's log?`
      }

      const botMessage: ChatMessage = {
        messageId: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, botMessage])
    } catch {
      const errorMessage: ChatMessage = {
        messageId: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsTyping(false)
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

  const clearChat = () => {
    setMessages([])
    setInputValue('')
  }

  const hasMessages = messages.length > 0

  return (
    <div className="h-[calc(100vh-180px)] flex flex-col">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-800 via-primary-900 to-primary-950 p-5 text-white shadow-xl mb-4">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-400/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary-500/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />

        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center ring-1 ring-white/20">
              <Sparkles className="h-6 w-6 text-primary-200" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                FYP Assistant
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-success-500/20 text-success-300 rounded-full text-[11px] font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-success-400 animate-pulse" />
                  Online
                </span>
              </h1>
              <p className="text-primary-200 text-sm mt-0.5">
                Ask anything about your Final Year Project
              </p>
            </div>
          </div>

          {hasMessages && (
            <button
              onClick={clearChat}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-primary-200 text-sm transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              New Chat
            </button>
          )}
        </div>
      </div>

      {/* Chat body */}
      <div className="flex-1 flex flex-col bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
        {!hasMessages ? (
          <WelcomeView onSuggestionClick={handleSubmit} />
        ) : (
          <>
            {/* Messages */}
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

            {/* Scroll-to-bottom FAB */}
            {showScrollBtn && (
              <div className="relative">
                <button
                  onClick={scrollToBottom}
                  className="absolute -top-12 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white border border-neutral-200 shadow-md flex items-center justify-center text-neutral-500 hover:text-neutral-700 hover:shadow-lg transition-all z-10"
                >
                  <ArrowDown className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Inline suggestions when conversation is short */}
            {messages.length <= 2 && !isTyping && (
              <div className="px-5 pb-3">
                <p className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider mb-2">Try asking</p>
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

        {/* Input area */}
        <div className="border-t border-neutral-200 bg-white p-4">
          <div className="flex items-end gap-3">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Ask a question about your FYP..."
                rows={1}
                className="w-full px-4 py-3 rounded-xl border border-neutral-200 bg-neutral-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 resize-none text-sm placeholder:text-neutral-400 transition-all"
                style={{ minHeight: '48px', maxHeight: '120px' }}
              />
            </div>
            <Button
              variant="primary"
              onClick={() => handleSubmit()}
              disabled={!inputValue.trim() || isTyping}
              className="rounded-xl h-12 w-12 p-0 flex-shrink-0 shadow-md shadow-primary-500/20"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-[11px] text-neutral-400 mt-2 text-center">
            Press <kbd className="px-1.5 py-0.5 bg-neutral-100 rounded text-[10px] font-mono border border-neutral-200">Enter</kbd> to send · <kbd className="px-1.5 py-0.5 bg-neutral-100 rounded text-[10px] font-mono border border-neutral-200">Shift + Enter</kbd> for new line
          </p>
        </div>
      </div>
    </div>
  )
}
