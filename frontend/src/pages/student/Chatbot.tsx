import { useState, useRef, useEffect } from 'react'
import {
  Bot,
  Send,
  User,
  Loader2,
  ThumbsUp,
  ThumbsDown,
  Copy,
  RefreshCw,
  Lightbulb,
  Clock,
  FileText,
  Calendar,
} from 'lucide-react'
import { Card, Button, Badge } from '@/components/ui'
import { useChatbot } from '@/lib/hooks/useStudent'
import { cn } from '@/lib/utils/cn'
import type { ChatMessage } from '@/types'

// Sample conversation
const SAMPLE_MESSAGES: ChatMessage[] = [
  {
    messageId: '1',
    role: 'assistant',
    content: 'Hello! I\'m your FYP Assistant. I can help you with questions about your Final Year Project, guidelines, deadlines, and more. How can I assist you today?',
    timestamp: '2025-01-20T10:00:00Z',
  },
]

// Suggested questions
const SUGGESTED_QUESTIONS = [
  { icon: FileText, text: 'How do I write a good problem statement?' },
  { icon: Calendar, text: 'What are the upcoming deadlines?' },
  { icon: Lightbulb, text: 'How do I choose a methodology?' },
  { icon: Clock, text: 'What should I include in my weekly log?' },
]

export function Chatbot() {
  const [messages, setMessages] = useState<ChatMessage[]>(SAMPLE_MESSAGES)
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const chatbot = useChatbot()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = async (question?: string) => {
    const messageText = question || inputValue.trim()
    if (!messageText) return

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

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Simulated response based on question
      let response = 'I understand your question. Let me help you with that.'

      if (messageText.toLowerCase().includes('problem statement')) {
        response = `A good problem statement should:\n\n1. **Clearly identify the problem** - What issue are you addressing?\n2. **Explain the significance** - Why does this problem matter?\n3. **Define the scope** - What are the boundaries of your research?\n4. **Present the gap** - What's missing in current solutions?\n\nTip: Keep it concise (usually 1-2 paragraphs) and avoid jargon. Would you like me to review your draft problem statement?`
      } else if (messageText.toLowerCase().includes('deadline')) {
        response = `Here are your upcoming deadlines:\n\n📅 **Proposal Submission** - 15 Feb 2025\n📅 **Mid-Semester Presentation** - 15 Mar 2025\n📅 **Final Report** - 31 May 2025\n📅 **Final Presentation** - 15 Jun 2025\n\nYou can view all deadlines in the Deadlines section. Would you like me to set up reminders?`
      } else if (messageText.toLowerCase().includes('methodology')) {
        response = `Choosing a methodology depends on your project type:\n\n**For Software Development:**\n- Agile/Scrum - Good for iterative development\n- Waterfall - Suitable for well-defined requirements\n- RAD - When you need rapid prototyping\n\n**For Research:**\n- Quantitative - Data-driven analysis\n- Qualitative - Exploratory research\n- Mixed Methods - Combining both approaches\n\nWhat type of project are you working on? I can give more specific recommendations.`
      } else if (messageText.toLowerCase().includes('weekly log') || messageText.toLowerCase().includes('supervision log')) {
        response = `Your weekly supervision log should include:\n\n✅ **Activities Completed** - What you worked on\n✅ **Progress Made** - Percentage completion\n✅ **Challenges Faced** - Any obstacles\n✅ **Planned Activities** - Next week's tasks\n\nTips:\n- Be specific and measurable\n- Include evidence of work (screenshots, code commits)\n- Mention any help needed from supervisor\n\nWould you like help drafting your current week's log?`
      }

      const botMessage: ChatMessage = {
        messageId: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, botMessage])
    } catch (err) {
      // Handle error
      const errorMessage: ChatMessage = {
        messageId: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsTyping(false)
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

  const regenerateResponse = () => {
    // Remove last bot message and regenerate
    setMessages((prev) => {
      const lastUserMsgIndex = prev.map(m => m.role).lastIndexOf('user')
      if (lastUserMsgIndex >= 0) {
        const userMessage = prev[lastUserMsgIndex].content
        const newMessages = prev.slice(0, -1)
        setInputValue(userMessage)
        return newMessages
      }
      return prev
    })
  }

  return (
    <div className="h-[calc(100vh-200px)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">FYP Assistant</h1>
          <p className="text-neutral-600 mt-1">Ask me anything about your Final Year Project</p>
        </div>
        <Badge variant="success" className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-success-500 animate-pulse" />
          Online
        </Badge>
      </div>

      {/* Chat Container */}
      <Card className="flex-1 flex flex-col overflow-hidden">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <MessageBubble
              key={message.messageId}
              message={message}
              onCopy={() => copyToClipboard(message.content)}
            />
          ))}

          {isTyping && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                <Bot className="h-4 w-4 text-primary-600" />
              </div>
              <div className="bg-neutral-100 rounded-2xl rounded-tl-none px-4 py-3">
                <div className="flex items-center gap-1">
                  <Loader2 className="h-4 w-4 animate-spin text-neutral-500" />
                  <span className="text-sm text-neutral-500">Thinking...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Questions (show when few messages) */}
        {messages.length <= 2 && (
          <div className="px-4 pb-4">
            <p className="text-xs text-neutral-500 mb-2">Suggested questions:</p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_QUESTIONS.map((q, index) => {
                const Icon = q.icon
                return (
                  <button
                    key={index}
                    onClick={() => handleSubmit(q.text)}
                    className="flex items-center gap-2 px-3 py-2 bg-neutral-50 hover:bg-neutral-100 rounded-full text-sm text-neutral-700 transition-colors"
                  >
                    <Icon className="h-4 w-4 text-neutral-400" />
                    {q.text}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="border-t border-neutral-200 p-4">
          <div className="flex items-end gap-3">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your question..."
                rows={1}
                className="w-full px-4 py-3 pr-12 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                style={{ minHeight: '48px', maxHeight: '120px' }}
              />
            </div>
            <Button
              variant="primary"
              onClick={() => handleSubmit()}
              disabled={!inputValue.trim() || isTyping}
              className="rounded-xl h-12 w-12 p-0"
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
          <p className="text-xs text-neutral-400 mt-2 text-center">
            Press Enter to send • Shift + Enter for new line
          </p>
        </div>
      </Card>

      {/* Quick Actions */}
      <div className="mt-4 flex items-center justify-center gap-4">
        <button
          onClick={() => setMessages(SAMPLE_MESSAGES)}
          className="text-sm text-neutral-500 hover:text-neutral-700 flex items-center gap-1"
        >
          <RefreshCw className="h-4 w-4" />
          Clear Chat
        </button>
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

  return (
    <div className={cn('flex items-start gap-3', isUser && 'flex-row-reverse')}>
      {/* Avatar */}
      <div
        className={cn(
          'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
          isUser ? 'bg-primary-600' : 'bg-primary-100'
        )}
      >
        {isUser ? (
          <User className="h-4 w-4 text-white" />
        ) : (
          <Bot className="h-4 w-4 text-primary-600" />
        )}
      </div>

      {/* Message */}
      <div className={cn('max-w-[75%]', isUser && 'text-right')}>
        <div
          className={cn(
            'rounded-2xl px-4 py-3',
            isUser
              ? 'bg-primary-600 text-white rounded-tr-none'
              : 'bg-neutral-100 text-neutral-900 rounded-tl-none'
          )}
        >
          <div className="text-sm whitespace-pre-wrap">{message.content}</div>
        </div>

        {/* Actions & Timestamp */}
        <div
          className={cn(
            'flex items-center gap-2 mt-1',
            isUser ? 'justify-end' : 'justify-start'
          )}
        >
          <span className="text-xs text-neutral-400">
            {new Date(message.timestamp).toLocaleTimeString('en-MY', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>

          {!isUser && (
            <div className="flex items-center gap-1">
              <button
                onClick={onCopy}
                className="p-1 rounded hover:bg-neutral-200 text-neutral-400 hover:text-neutral-600"
                title="Copy"
              >
                <Copy className="h-3 w-3" />
              </button>
              <button
                onClick={() => setFeedback(feedback === 'up' ? null : 'up')}
                className={cn(
                  'p-1 rounded hover:bg-neutral-200',
                  feedback === 'up' ? 'text-success-600' : 'text-neutral-400 hover:text-neutral-600'
                )}
                title="Helpful"
              >
                <ThumbsUp className="h-3 w-3" />
              </button>
              <button
                onClick={() => setFeedback(feedback === 'down' ? null : 'down')}
                className={cn(
                  'p-1 rounded hover:bg-neutral-200',
                  feedback === 'down' ? 'text-error-600' : 'text-neutral-400 hover:text-neutral-600'
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
