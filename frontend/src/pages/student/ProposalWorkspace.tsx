import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Save,
  Send,
  Upload,
  FileText,
  Plus,
  Trash2,
  Sparkles,
  History,
  CheckCircle,
  AlertCircle,
  Eye,
} from 'lucide-react'
import { Card, Button, Input, Badge, Spinner, AlertBanner, Modal } from '@/components/ui'
import {
  useCurrentProposal,
  useCreateProposal,
  useUpdateProposal,
  useSubmitProposal,
  useUploadProposalFile,
} from '@/lib/hooks/useStudent'
import { ROUTES } from '@/lib/constants/routes'
import { cn } from '@/lib/utils/cn'
import type { ProposalStatus } from '@/types'

// Validation schema
const proposalSchema = z.object({
  title: z.string().min(10, 'Title must be at least 10 characters').max(200, 'Title too long'),
  problemStatement: z.string().min(100, 'Problem statement must be at least 100 characters'),
  objectives: z.array(z.object({ value: z.string().min(10, 'Objective too short') })).min(2, 'At least 2 objectives required'),
  scope: z.string().min(50, 'Scope must be at least 50 characters'),
  methodology: z.string().min(100, 'Methodology must be at least 100 characters'),
  expectedOutcomes: z.array(z.object({ value: z.string().min(10, 'Outcome too short') })).min(1, 'At least 1 outcome required'),
  timeline: z.string().optional(),
  references: z.array(z.object({ value: z.string() })).optional(),
})

type ProposalFormData = z.infer<typeof proposalSchema>

const statusColors: Record<ProposalStatus, string> = {
  DRAFT: 'bg-neutral-100 text-neutral-700',
  SUBMITTED: 'bg-primary-100 text-primary-700',
  UNDER_REVIEW: 'bg-warning-100 text-warning-700',
  REVISION_REQUIRED: 'bg-error-100 text-error-700',
  APPROVED: 'bg-success-100 text-success-700',
  REJECTED: 'bg-error-100 text-error-700',
}

// Sample proposal data
const SAMPLE_PROPOSAL = {
  proposalId: '1',
  studentId: '1',
  supervisorId: '1',
  title: 'AI-Powered Student Supervision System',
  problemStatement: 'The current FYP supervision process at MMU relies heavily on manual coordination between students and supervisors. This leads to inefficiencies in scheduling meetings, tracking progress, and managing documentation. Students often face difficulties finding suitable supervisors, and the matching process does not consider compatibility factors effectively.',
  objectives: [
    'To develop an automated system for matching students with suitable supervisors using AI',
    'To implement a comprehensive project tracking and documentation management module',
    'To create an intelligent chatbot for answering student queries about FYP processes',
  ],
  scope: 'The system will be developed as a web application targeting MMU undergraduate students and supervisors. It will cover the supervision matching, meeting scheduling, progress tracking, and document management aspects of the FYP process.',
  methodology: 'The project will follow Agile development methodology with 2-week sprints. The frontend will be built using React with TypeScript, while the backend will use Node.js with Express. Machine learning models will be implemented using Python and TensorFlow for the recommendation system.',
  expectedOutcomes: [
    'A fully functional web-based FYP supervision system',
    'AI-powered supervisor recommendation module',
    'Comprehensive project documentation',
  ],
  timeline: 'Phase 1 (Week 1-4): Requirements and Design\nPhase 2 (Week 5-10): Core Development\nPhase 3 (Week 11-12): Testing and Documentation',
  references: [
    'Smith, J. (2023). AI in Education: A Comprehensive Review. IEEE Access.',
    'Johnson, M. et al. (2022). Intelligent Tutoring Systems. ACM Computing Surveys.',
  ],
  status: 'DRAFT' as ProposalStatus,
  version: 1,
  fileUrl: undefined,
  fileName: undefined,
  createdAt: '2025-01-01',
  updatedAt: '2025-01-15',
}

export function ProposalWorkspace() {
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const [uploadingFile, setUploadingFile] = useState(false)

  const { data: proposal, isLoading } = useCurrentProposal()
  const createProposal = useCreateProposal()
  const updateProposal = useUpdateProposal()
  const submitProposal = useSubmitProposal()
  const uploadFile = useUploadProposalFile()

  // Use sample data if no API data
  const currentProposal = proposal || SAMPLE_PROPOSAL
  const isNewProposal = !proposal

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isDirty },
    watch,
  } = useForm<ProposalFormData>({
    resolver: zodResolver(proposalSchema),
    defaultValues: {
      title: currentProposal.title || '',
      problemStatement: currentProposal.problemStatement || '',
      objectives: currentProposal.objectives?.map((o) => ({ value: o })) || [{ value: '' }, { value: '' }],
      scope: currentProposal.scope || '',
      methodology: currentProposal.methodology || '',
      expectedOutcomes: currentProposal.expectedOutcomes?.map((o) => ({ value: o })) || [{ value: '' }],
      timeline: currentProposal.timeline || '',
      references: currentProposal.references?.map((r) => ({ value: r })) || [],
    },
  })

  const { fields: objectiveFields, append: appendObjective, remove: removeObjective } = useFieldArray({
    control,
    name: 'objectives',
  })

  const { fields: outcomeFields, append: appendOutcome, remove: removeOutcome } = useFieldArray({
    control,
    name: 'expectedOutcomes',
  })

  const { fields: referenceFields, append: appendReference, remove: removeReference } = useFieldArray({
    control,
    name: 'references',
  })

  const onSave = async (data: ProposalFormData) => {
    const formattedData = {
      ...data,
      objectives: data.objectives.map((o) => o.value),
      expectedOutcomes: data.expectedOutcomes.map((o) => o.value),
      references: data.references?.map((r) => r.value).filter(Boolean),
    }

    try {
      if (isNewProposal) {
        await createProposal.mutateAsync(formattedData)
      } else {
        await updateProposal.mutateAsync(formattedData)
      }
    } catch (err) {
      // Error handled by mutation
    }
  }

  const onSubmit = async () => {
    try {
      await submitProposal.mutateAsync()
      setShowSubmitModal(false)
    } catch (err) {
      // Error handled by mutation
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setUploadingFile(true)
      try {
        await uploadFile.mutateAsync(file)
      } catch (err) {
        // Error handled by mutation
      } finally {
        setUploadingFile(false)
      }
    }
  }

  const canEdit = ['DRAFT', 'REVISION_REQUIRED'].includes(currentProposal.status)
  const canSubmit = currentProposal.status === 'DRAFT' || currentProposal.status === 'REVISION_REQUIRED'

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" label="Loading proposal..." />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Proposal Workspace</h1>
          <p className="text-neutral-600 mt-1">
            Create and edit your FYP proposal
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={statusColors[currentProposal.status]} size="lg">
            {currentProposal.status.replace(/_/g, ' ')}
          </Badge>
          <span className="text-sm text-neutral-500">v{currentProposal.version}</span>
        </div>
      </div>

      {/* Action Bar */}
      <Card className="bg-neutral-50">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Link to={ROUTES.STUDENT.PROPOSAL_HISTORY}>
              <Button variant="ghost" size="sm" leftIcon={<History className="h-4 w-4" />}>
                Version History
              </Button>
            </Link>
            <Link to={ROUTES.STUDENT.PROPOSAL_ANALYSIS}>
              <Button variant="ghost" size="sm" leftIcon={<Sparkles className="h-4 w-4" />}>
                AI Analysis
              </Button>
            </Link>
            <Link to={ROUTES.STUDENT.PROPOSAL_STATUS}>
              <Button variant="ghost" size="sm" leftIcon={<Eye className="h-4 w-4" />}>
                Status Timeline
              </Button>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            {canEdit && (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={<Save className="h-4 w-4" />}
                  onClick={handleSubmit(onSave)}
                  isLoading={createProposal.isPending || updateProposal.isPending}
                  disabled={!isDirty}
                >
                  Save Draft
                </Button>
                {canSubmit && (
                  <Button
                    variant="primary"
                    size="sm"
                    leftIcon={<Send className="h-4 w-4" />}
                    onClick={() => setShowSubmitModal(true)}
                  >
                    Submit Proposal
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </Card>

      {/* Revision Required Alert */}
      {currentProposal.status === 'REVISION_REQUIRED' && (
        <AlertBanner
          variant="warning"
          title="Revision Required"
          description="Your proposal requires revision based on feedback. Please review the comments and make necessary changes before resubmitting."
          action={
            <Link to={ROUTES.STUDENT.PROPOSAL_STATUS}>
              <Button variant="warning" size="sm">View Feedback</Button>
            </Link>
          }
        />
      )}

      {/* Success Messages */}
      {(createProposal.isSuccess || updateProposal.isSuccess) && (
        <AlertBanner
          variant="success"
          title="Proposal saved"
          description="Your changes have been saved successfully."
          dismissible
        />
      )}

      {/* Form */}
      <form onSubmit={handleSubmit(onSave)} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">Basic Information</h2>

          <div className="space-y-4">
            <Input
              label="Project Title"
              placeholder="Enter your project title"
              error={errors.title?.message}
              disabled={!canEdit}
              required
              {...register('title')}
            />
          </div>
        </Card>

        {/* Problem Statement */}
        <Card>
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">Problem Statement</h2>
          <p className="text-sm text-neutral-500 mb-4">
            Describe the problem you are trying to solve and why it is important.
          </p>
          <textarea
            className={cn(
              'w-full px-4 py-3 rounded-lg border transition-colors resize-none',
              'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
              errors.problemStatement ? 'border-error-500' : 'border-neutral-300',
              !canEdit && 'bg-neutral-50'
            )}
            rows={6}
            placeholder="Describe the problem..."
            disabled={!canEdit}
            {...register('problemStatement')}
          />
          {errors.problemStatement && (
            <p className="mt-1 text-sm text-error-600">{errors.problemStatement.message}</p>
          )}
        </Card>

        {/* Objectives */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-neutral-900">Objectives</h2>
              <p className="text-sm text-neutral-500">List the specific objectives of your project</p>
            </div>
            {canEdit && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                leftIcon={<Plus className="h-4 w-4" />}
                onClick={() => appendObjective({ value: '' })}
              >
                Add Objective
              </Button>
            )}
          </div>
          <div className="space-y-3">
            {objectiveFields.map((field, index) => (
              <div key={field.id} className="flex gap-2">
                <span className="w-8 h-10 flex items-center justify-center text-sm font-medium text-neutral-500">
                  {index + 1}.
                </span>
                <Input
                  placeholder={`Objective ${index + 1}`}
                  className="flex-1"
                  disabled={!canEdit}
                  error={errors.objectives?.[index]?.value?.message}
                  {...register(`objectives.${index}.value`)}
                />
                {canEdit && objectiveFields.length > 2 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeObjective(index)}
                  >
                    <Trash2 className="h-4 w-4 text-error-500" />
                  </Button>
                )}
              </div>
            ))}
          </div>
          {errors.objectives?.message && (
            <p className="mt-2 text-sm text-error-600">{errors.objectives.message}</p>
          )}
        </Card>

        {/* Scope */}
        <Card>
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">Scope</h2>
          <p className="text-sm text-neutral-500 mb-4">
            Define the boundaries and extent of your project.
          </p>
          <textarea
            className={cn(
              'w-full px-4 py-3 rounded-lg border transition-colors resize-none',
              'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
              errors.scope ? 'border-error-500' : 'border-neutral-300',
              !canEdit && 'bg-neutral-50'
            )}
            rows={4}
            placeholder="Describe the scope..."
            disabled={!canEdit}
            {...register('scope')}
          />
          {errors.scope && (
            <p className="mt-1 text-sm text-error-600">{errors.scope.message}</p>
          )}
        </Card>

        {/* Methodology */}
        <Card>
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">Methodology</h2>
          <p className="text-sm text-neutral-500 mb-4">
            Describe your approach, methods, and technologies you plan to use.
          </p>
          <textarea
            className={cn(
              'w-full px-4 py-3 rounded-lg border transition-colors resize-none',
              'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
              errors.methodology ? 'border-error-500' : 'border-neutral-300',
              !canEdit && 'bg-neutral-50'
            )}
            rows={6}
            placeholder="Describe your methodology..."
            disabled={!canEdit}
            {...register('methodology')}
          />
          {errors.methodology && (
            <p className="mt-1 text-sm text-error-600">{errors.methodology.message}</p>
          )}
        </Card>

        {/* Expected Outcomes */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-neutral-900">Expected Outcomes</h2>
              <p className="text-sm text-neutral-500">List the deliverables and outcomes</p>
            </div>
            {canEdit && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                leftIcon={<Plus className="h-4 w-4" />}
                onClick={() => appendOutcome({ value: '' })}
              >
                Add Outcome
              </Button>
            )}
          </div>
          <div className="space-y-3">
            {outcomeFields.map((field, index) => (
              <div key={field.id} className="flex gap-2">
                <span className="w-8 h-10 flex items-center justify-center text-sm font-medium text-neutral-500">
                  {index + 1}.
                </span>
                <Input
                  placeholder={`Outcome ${index + 1}`}
                  className="flex-1"
                  disabled={!canEdit}
                  error={errors.expectedOutcomes?.[index]?.value?.message}
                  {...register(`expectedOutcomes.${index}.value`)}
                />
                {canEdit && outcomeFields.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeOutcome(index)}
                  >
                    <Trash2 className="h-4 w-4 text-error-500" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Timeline */}
        <Card>
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">Timeline (Optional)</h2>
          <p className="text-sm text-neutral-500 mb-4">
            Outline your project timeline and milestones.
          </p>
          <textarea
            className={cn(
              'w-full px-4 py-3 rounded-lg border transition-colors resize-none',
              'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
              'border-neutral-300',
              !canEdit && 'bg-neutral-50'
            )}
            rows={4}
            placeholder="Phase 1: ...\nPhase 2: ..."
            disabled={!canEdit}
            {...register('timeline')}
          />
        </Card>

        {/* File Upload */}
        <Card>
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">Proposal Document</h2>
          <p className="text-sm text-neutral-500 mb-4">
            Upload your proposal document (PDF, DOC, DOCX - Max 10MB)
          </p>

          {currentProposal.fileUrl ? (
            <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-primary-600" />
                <div>
                  <p className="font-medium text-neutral-900">{currentProposal.fileName}</p>
                  <p className="text-sm text-neutral-500">Uploaded document</p>
                </div>
              </div>
              <div className="flex gap-2">
                <a href={currentProposal.fileUrl} target="_blank" rel="noopener noreferrer">
                  <Button variant="secondary" size="sm">Download</Button>
                </a>
                {canEdit && (
                  <label>
                    <Button variant="ghost" size="sm" as="span">Replace</Button>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                  </label>
                )}
              </div>
            </div>
          ) : canEdit ? (
            <label className="block">
              <div className="border-2 border-dashed border-neutral-300 rounded-lg p-8 text-center hover:border-primary-500 transition-colors cursor-pointer">
                <Upload className="h-10 w-10 text-neutral-400 mx-auto mb-3" />
                <p className="font-medium text-neutral-700">
                  {uploadingFile ? 'Uploading...' : 'Click to upload proposal document'}
                </p>
                <p className="text-sm text-neutral-500 mt-1">PDF, DOC, or DOCX up to 10MB</p>
              </div>
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                className="hidden"
                onChange={handleFileUpload}
                disabled={uploadingFile}
              />
            </label>
          ) : (
            <p className="text-neutral-500">No document uploaded</p>
          )}
        </Card>
      </form>

      {/* Submit Modal */}
      <Modal
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        title="Submit Proposal"
        size="md"
      >
        <div className="space-y-4">
          <AlertBanner
            variant="warning"
            description="Once submitted, you cannot edit your proposal until feedback is received."
          />

          <div className="space-y-2">
            <h4 className="font-medium text-neutral-900">Submission Checklist</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-success-600" />
                <span>Project title is clear and descriptive</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-success-600" />
                <span>Problem statement explains the issue and importance</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-success-600" />
                <span>At least 2 clear objectives defined</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-success-600" />
                <span>Scope and methodology described</span>
              </div>
            </div>
          </div>

          <p className="text-neutral-600">
            Your proposal will be reviewed by your supervisor and the FYP committee.
            You will be notified of the outcome.
          </p>

          <div className="flex gap-3 justify-end pt-4 border-t border-neutral-200">
            <Button variant="ghost" onClick={() => setShowSubmitModal(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              leftIcon={<Send className="h-4 w-4" />}
              onClick={onSubmit}
              isLoading={submitProposal.isPending}
            >
              Submit Proposal
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
