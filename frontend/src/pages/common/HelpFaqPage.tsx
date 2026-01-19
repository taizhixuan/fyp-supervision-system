import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Search,
  Book,
  FileText,
  Calendar,
  ChevronDown,
  ChevronUp,
  Download,
  Mail,
  ExternalLink,
  ArrowLeft,
} from 'lucide-react'
import { Card, Button, Input, Badge, Spinner } from '@/components/ui'
import { useResources } from '@/lib/hooks/useResources'
import { useAuth } from '@/lib/auth/useAuth'
import { cn } from '@/lib/utils/cn'
import { ROUTES } from '@/lib/constants/routes'

// Mock FAQ data - in production, this would come from an API
const FAQ_CATEGORIES = ['All', 'Account', 'Proposal', 'Meetings', 'Logs', 'Documents', 'AI Features']

const FAQS = [
  {
    id: 1,
    category: 'Account',
    question: 'How do I find a supervisor?',
    answer:
      'Use the Supervisor Directory in your dashboard. You can browse supervisors by research area, view their availability, and see AI-powered recommendations based on your project interests. Once you find a suitable supervisor, you can send them a supervision request directly from the platform.',
  },
  {
    id: 2,
    category: 'Proposal',
    question: 'What are the proposal submission requirements?',
    answer:
      'Your proposal must include: (1) Project title, (2) Problem statement, (3) Objectives, (4) Scope, (5) Methodology, (6) Timeline, and (7) Expected outcomes. The system will automatically check your proposal for completeness before submission. You can also use our AI-powered proposal analyzer to get feedback.',
  },
  {
    id: 3,
    category: 'Meetings',
    question: 'How do I schedule a meeting with my supervisor?',
    answer:
      'Navigate to the Meetings section in your dashboard. Click "Request Meeting" and select your preferred date, time, and platform (online/in-person). Your supervisor will receive a notification and can confirm or suggest alternative times.',
  },
  {
    id: 4,
    category: 'Logs',
    question: 'How do supervision logs work?',
    answer:
      'After each meeting, you should create a supervision log documenting what was discussed, action items, and the planned next steps. Your supervisor will review and sign the log. These logs are important for tracking your progress and are required for FYP assessment.',
  },
  {
    id: 5,
    category: 'Documents',
    question: 'What file formats are accepted for document uploads?',
    answer:
      'The system accepts PDF, DOC, DOCX, and PPT/PPTX files. Maximum file size is 10MB per document. For images, JPG, PNG, and GIF formats are supported up to 5MB.',
  },
  {
    id: 6,
    category: 'AI Features',
    question: 'How does the AI supervisor recommendation work?',
    answer:
      'Our AI analyzes your project interests, skills, and preferences, then matches them with supervisor research areas and expertise using advanced algorithms. The recommendations are based on research area compatibility, supervision load, and historical pairing success.',
  },
  {
    id: 7,
    category: 'Account',
    question: 'How long does account verification take?',
    answer:
      'Account verification typically takes 1-2 business days. The FYP Committee reviews all new registrations to ensure they are genuine students or staff members. You will receive an email notification once your account is approved.',
  },
  {
    id: 8,
    category: 'Proposal',
    question: 'Can I revise my proposal after submission?',
    answer:
      'Yes, you can submit revised versions of your proposal. Each revision creates a new version while preserving the history. Your supervisor and the FYP Committee can see all versions and provide feedback on each.',
  },
]

export function HelpFaqPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null)

  const { isAuthenticated } = useAuth()
  const { data: resourcesData, isLoading: isLoadingResources } = useResources()

  const filteredFaqs = FAQS.filter((faq) => {
    const matchesCategory =
      selectedCategory === 'All' || faq.category === selectedCategory
    const matchesSearch =
      searchQuery === '' ||
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const toggleFaq = (id: number) => {
    setExpandedFaq(expandedFaq === id ? null : id)
  }

  // Content component to avoid duplication
  const content = (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-neutral-900 mb-6">Help & Resources</h1>

      {/* Search */}
      <div className="mb-8">
        <Input
          placeholder="Search FAQs..."
          leftIcon={<Search className="h-5 w-5" />}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Quick Links */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-neutral-900 mb-4">Quick Links</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card hover className="cursor-pointer">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center mb-3">
                <Book className="h-6 w-6 text-primary-600" />
              </div>
              <h3 className="font-medium text-neutral-900 mb-1">FYP Handbook</h3>
              <p className="text-sm text-neutral-500 mb-3">
                Complete guide for FYP students
              </p>
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<Download className="h-4 w-4" />}
              >
                Download
              </Button>
            </div>
          </Card>

          <Card hover className="cursor-pointer">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-success-100 flex items-center justify-center mb-3">
                <FileText className="h-6 w-6 text-success-600" />
              </div>
              <h3 className="font-medium text-neutral-900 mb-1">Templates</h3>
              <p className="text-sm text-neutral-500 mb-3">
                Proposal and report templates
              </p>
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<ExternalLink className="h-4 w-4" />}
              >
                View All
              </Button>
            </div>
          </Card>

          <Card hover className="cursor-pointer">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-warning-100 flex items-center justify-center mb-3">
                <Calendar className="h-6 w-6 text-warning-600" />
              </div>
              <h3 className="font-medium text-neutral-900 mb-1">Deadlines</h3>
              <p className="text-sm text-neutral-500 mb-3">
                Important dates and milestones
              </p>
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<ExternalLink className="h-4 w-4" />}
              >
                View
              </Button>
            </div>
          </Card>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-neutral-900 mb-4">
          Frequently Asked Questions
        </h2>

        {/* Category filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          {FAQ_CATEGORIES.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={cn(
                'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                selectedCategory === category
                  ? 'bg-primary-100 text-primary-700'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              )}
            >
              {category}
            </button>
          ))}
        </div>

        {/* FAQ list */}
        <div className="space-y-3">
          {filteredFaqs.length === 0 ? (
            <Card className="text-center py-12">
              <p className="text-neutral-500">
                No FAQs found matching your search.
              </p>
            </Card>
          ) : (
            filteredFaqs.map((faq) => (
              <Card key={faq.id} padding="none" className="overflow-hidden">
                <button
                  onClick={() => toggleFaq(faq.id)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-neutral-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Badge variant="default" size="sm">
                      {faq.category}
                    </Badge>
                    <span className="font-medium text-neutral-900">
                      {faq.question}
                    </span>
                  </div>
                  {expandedFaq === faq.id ? (
                    <ChevronUp className="h-5 w-5 text-neutral-400 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-neutral-400 flex-shrink-0" />
                  )}
                </button>
                {expandedFaq === faq.id && (
                  <div className="px-4 pb-4 pt-0">
                    <p className="text-neutral-600 text-sm leading-relaxed pl-[76px]">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </Card>
            ))
          )}
        </div>
      </section>

      {/* Contact Section */}
      <section>
        <Card className="bg-primary-50 border-primary-100">
          <div className="text-center">
            <h3 className="font-semibold text-neutral-900 mb-2">Need More Help?</h3>
            <p className="text-neutral-600 mb-4">
              Contact the FYP Committee for further assistance
            </p>
            <a
              href="mailto:fyp-committee@mmu.edu.my"
              className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium"
            >
              <Mail className="h-5 w-5" />
              fyp-committee@mmu.edu.my
            </a>
          </div>
        </Card>
      </section>
    </div>
  )

  // If user is authenticated, they're viewing through AppShell, just return content
  if (isAuthenticated) {
    return content
  }

  // Public view - add header and footer
  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link
            to={ROUTES.HOME}
            className="flex items-center gap-2 text-sm text-neutral-600 hover:text-primary-600 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
          <Link to={ROUTES.LOGIN}>
            <Button variant="primary" size="sm">
              Sign In
            </Button>
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 px-4 py-8">
        {content}
      </main>

      {/* Footer */}
      <footer className="bg-neutral-900 text-white py-6 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-neutral-400">
            &copy; {new Date().getFullYear()} MMU FYP Committee. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
