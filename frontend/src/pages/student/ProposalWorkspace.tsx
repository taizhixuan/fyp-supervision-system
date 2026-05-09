import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
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
  Rocket,
  PartyPopper,
  ArrowRight,
  Clock,
  User,
  Building2,
  Users,
  Briefcase,
} from 'lucide-react'
import { Card, Button, Input, Badge, Spinner, AlertBanner, Modal } from '@/components/ui'
import {
  useCurrentProposal,
  useCreateProposal,
  useUpdateProposal,
  useSubmitProposal,
  useUploadProposalFile,
  useExportProposalDocx,
} from '@/lib/hooks/useStudent'
import { ROUTES } from '@/lib/constants/routes'
import {
  PROJECT_STATUS_OPTIONS,
  PROJECT_TYPE_OPTIONS,
  NUMBER_OF_STUDENTS_OPTIONS,
  SPECIALISATIONS,
  PROJECT_CATEGORIES_BY_SPEC,
  PROJECT_FOCUS_BY_SPEC,
  categoriesFor,
  focusesFor,
  type Specialisation,
} from '@/lib/constants/proposalTemplate'
import { cn } from '@/lib/utils/cn'
import type { ProposalStatus } from '@/types'

// Validation schema (mirrors MMU FCI FYP Proposal Form template)
const proposalSchema = z
  .object({
    // Project Identity
    title: z
      .string()
      .min(10, 'Title must be at least 10 characters')
      .max(200, 'Title too long'),
    projectStatus: z.enum(PROJECT_STATUS_OPTIONS, {
      required_error: 'Please choose a project status',
    }),
    projectType: z.enum(PROJECT_TYPE_OPTIONS, {
      required_error: 'Please choose a project type',
    }),
    specialisation: z.enum(SPECIALISATIONS, {
      required_error: 'Please choose a specialisation',
    }),
    projectCategory: z.string().min(1, 'Please choose a category'),
    projectFocus: z.string().min(1, 'Please choose a focus / contribution'),
    // Industry Collaboration
    industryCollaboration: z.boolean(),
    industryCompanyName: z.string().optional().or(z.literal('')),
    industryContactName: z.string().optional().or(z.literal('')),
    industryContactPhone: z.string().optional().or(z.literal('')),
    // Description / Free-text
    problemStatement: z
      .string()
      .min(100, 'Problem statement must be at least 100 characters'),
    objectives: z
      .array(z.object({ value: z.string().min(10, 'Objective too short') }))
      .min(2, 'At least 2 objectives required'),
    scope: z.string().min(50, 'Scope must be at least 50 characters'),
    methodology: z
      .string()
      .min(100, 'Methodology must be at least 100 characters'),
    expectedOutcomes: z
      .array(z.object({ value: z.string().min(10, 'Outcome too short') }))
      .min(1, 'At least 1 outcome required'),
    timeline: z.string().optional(),
    references: z.array(z.object({ value: z.string() })).optional(),
    // Co-Supervisor (free text — co-supervisor isn't a system user)
    coSupervisorName: z.string().optional().or(z.literal('')),
    // Number of Students + Student 2 block
    numberOfStudents: z.enum(NUMBER_OF_STUDENTS_OPTIONS),
    student1Subtitle: z.string().optional().or(z.literal('')),
    student1WorkDistribution: z.string().optional().or(z.literal('')),
    student2MmuId: z.string().optional().or(z.literal('')),
    student2Subtitle: z.string().optional().or(z.literal('')),
    student2WorkDistribution: z.string().optional().or(z.literal('')),
  })
  .superRefine((data, ctx) => {
    // Cross-field: category and focus must belong to chosen specialisation.
    if (data.specialisation) {
      const cats = PROJECT_CATEGORIES_BY_SPEC[data.specialisation as Specialisation] ?? []
      const focuses = PROJECT_FOCUS_BY_SPEC[data.specialisation as Specialisation] ?? []
      if (data.projectCategory && !cats.includes(data.projectCategory)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['projectCategory'],
          message: `Not a valid category for ${data.specialisation}`,
        })
      }
      if (data.projectFocus && !focuses.includes(data.projectFocus)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['projectFocus'],
          message: `Not a valid focus for ${data.specialisation}`,
        })
      }
    }
    // Industry collaboration → company name required
    if (data.industryCollaboration && !data.industryCompanyName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['industryCompanyName'],
        message: 'Company name is required when industry collaboration is enabled',
      })
    }
    // Two-student project → required fields
    if (data.numberOfStudents === 'Two') {
      if (!data.student2MmuId || !/^\d{10}$/.test(data.student2MmuId.trim())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['student2MmuId'],
          message: 'Enter a valid 10-digit MMU ID for Student 2',
        })
      }
      if (!data.student1Subtitle) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['student1Subtitle'],
          message: 'Subtitle for Student 1 is required for two-student projects',
        })
      }
      if (!data.student1WorkDistribution) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['student1WorkDistribution'],
          message: 'Work distribution for Student 1 is required for two-student projects',
        })
      }
      if (!data.student2Subtitle) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['student2Subtitle'],
          message: 'Subtitle for Student 2 is required for two-student projects',
        })
      }
      if (!data.student2WorkDistribution) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['student2WorkDistribution'],
          message: 'Work distribution for Student 2 is required for two-student projects',
        })
      }
    }
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

type SubmitModalState = 'confirm' | 'submitting' | 'success'

export function ProposalWorkspace() {
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const [submitModalState, setSubmitModalState] = useState<SubmitModalState>('confirm')
  const [uploadingFile, setUploadingFile] = useState(false)
  const navigate = useNavigate()

  const { data: proposal, isLoading } = useCurrentProposal()
  const createProposal = useCreateProposal()
  const updateProposal = useUpdateProposal()
  const submitProposal = useSubmitProposal()
  const uploadFile = useUploadProposalFile()
  const exportDocx = useExportProposalDocx()

  const isNewProposal = !proposal

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<ProposalFormData>({
    resolver: zodResolver(proposalSchema),
    defaultValues: {
      title: '',
      projectStatus: 'Student-Proposed',
      projectType: 'Application-Based',
      specialisation: undefined as unknown as ProposalFormData['specialisation'],
      projectCategory: '',
      projectFocus: '',
      industryCollaboration: false,
      industryCompanyName: '',
      industryContactName: '',
      industryContactPhone: '',
      problemStatement: '',
      objectives: [{ value: '' }, { value: '' }],
      scope: '',
      methodology: '',
      expectedOutcomes: [{ value: '' }],
      timeline: '',
      references: [],
      coSupervisorName: '',
      numberOfStudents: 'One',
      student1Subtitle: '',
      student1WorkDistribution: '',
      student2MmuId: '',
      student2Subtitle: '',
      student2WorkDistribution: '',
    },
  })

  // Hydrate the form once the existing proposal has been fetched.
  useEffect(() => {
    if (!proposal) return
    const numberOfStudents =
      proposal.numberOfStudents === 'Two' ? 'Two' : 'One'
    reset({
      title: proposal.title || '',
      projectStatus:
        (PROJECT_STATUS_OPTIONS as readonly string[]).includes(
          proposal.projectStatus ?? ''
        )
          ? (proposal.projectStatus as (typeof PROJECT_STATUS_OPTIONS)[number])
          : 'Student-Proposed',
      projectType:
        (PROJECT_TYPE_OPTIONS as readonly string[]).includes(
          proposal.projectType ?? ''
        )
          ? (proposal.projectType as (typeof PROJECT_TYPE_OPTIONS)[number])
          : 'Application-Based',
      specialisation: ((SPECIALISATIONS as readonly string[]).includes(
        proposal.specialisation ?? ''
      )
        ? proposal.specialisation
        : undefined) as ProposalFormData['specialisation'],
      projectCategory: proposal.projectCategory || '',
      projectFocus: proposal.projectFocus || '',
      industryCollaboration: !!proposal.industryCollaboration,
      industryCompanyName: proposal.industryCompanyName || '',
      industryContactName: proposal.industryContactName || '',
      industryContactPhone: proposal.industryContactPhone || '',
      problemStatement: proposal.problemStatement || '',
      objectives: proposal.objectives?.length
        ? proposal.objectives.map((o) => ({ value: o }))
        : [{ value: '' }, { value: '' }],
      scope: proposal.scope || '',
      methodology: proposal.methodology || '',
      expectedOutcomes: proposal.expectedOutcomes?.length
        ? proposal.expectedOutcomes.map((o) => ({ value: o }))
        : [{ value: '' }],
      timeline: proposal.timeline || '',
      references: proposal.references?.map((r) => ({ value: r })) || [],
      coSupervisorName: proposal.coSupervisorName || '',
      numberOfStudents,
      student1Subtitle: proposal.student1Subtitle || '',
      student1WorkDistribution: proposal.student1WorkDistribution || '',
      student2MmuId: proposal.student2MmuId || '',
      student2Subtitle: proposal.student2Subtitle || '',
      student2WorkDistribution: proposal.student2WorkDistribution || '',
    })
  }, [proposal, reset])

  // Watched fields drive the cascading dropdowns + conditional sections.
  const watchedSpec = watch('specialisation')
  const watchedIndustry = watch('industryCollaboration')
  const watchedNumStudents = watch('numberOfStudents')
  const watchedCategory = watch('projectCategory')
  const watchedFocus = watch('projectFocus')

  const categoryOptions = useMemo(() => categoriesFor(watchedSpec), [watchedSpec])
  const focusOptions = useMemo(() => focusesFor(watchedSpec), [watchedSpec])

  // When specialisation changes, clear category/focus if they no longer apply.
  useEffect(() => {
    if (watchedCategory && !categoryOptions.includes(watchedCategory)) {
      setValue('projectCategory', '', { shouldValidate: false })
    }
    if (watchedFocus && !focusOptions.includes(watchedFocus)) {
      setValue('projectFocus', '', { shouldValidate: false })
    }
  }, [categoryOptions, focusOptions, watchedCategory, watchedFocus, setValue])

  const { fields: objectiveFields, append: appendObjective, remove: removeObjective } = useFieldArray({
    control,
    name: 'objectives',
  })

  const { fields: outcomeFields, append: appendOutcome, remove: removeOutcome } = useFieldArray({
    control,
    name: 'expectedOutcomes',
  })

  // References field array - unused for now but kept for future use
  useFieldArray({
    control,
    name: 'references',
  })

  const onSave = async (data: ProposalFormData) => {
    const formattedData = {
      ...data,
      objectives: data.objectives.map((o) => o.value),
      expectedOutcomes: data.expectedOutcomes.map((o) => o.value),
      references: data.references?.map((r) => r.value).filter(Boolean),
      // Industry block — null out collapsed fields so backend stores clean state.
      industryCompanyName: data.industryCollaboration ? data.industryCompanyName || null : null,
      industryContactName: data.industryCollaboration ? data.industryContactName || null : null,
      industryContactPhone: data.industryCollaboration ? data.industryContactPhone || null : null,
      // Student-2 block similarly collapsed when single-student.
      student2MmuId: data.numberOfStudents === 'Two' ? data.student2MmuId || null : null,
      student2Subtitle: data.numberOfStudents === 'Two' ? data.student2Subtitle || null : null,
      student2WorkDistribution:
        data.numberOfStudents === 'Two' ? data.student2WorkDistribution || null : null,
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
    setSubmitModalState('submitting')
    try {
      await submitProposal.mutateAsync()
      setSubmitModalState('success')
    } catch (err) {
      setSubmitModalState('confirm')
    }
  }

  const handleCloseSubmitModal = () => {
    setShowSubmitModal(false)
    // Reset state after animation
    setTimeout(() => setSubmitModalState('confirm'), 300)
  }

  const handleGoToDashboard = () => {
    handleCloseSubmitModal()
    navigate(ROUTES.STUDENT.DASHBOARD)
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

  // Treat a not-yet-saved proposal as a fresh DRAFT for display + edit gating.
  const proposalStatus: ProposalStatus = proposal?.status ?? 'DRAFT'
  const proposalVersion = proposal?.version ?? 1
  const proposalFileUrl = proposal?.fileUrl
  const proposalFileName = proposal?.fileName
  const canEdit = ['DRAFT', 'REVISION_REQUIRED'].includes(proposalStatus)
  const canSubmit = proposalStatus === 'DRAFT' || proposalStatus === 'REVISION_REQUIRED'

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
          <Badge className={cn(statusColors[proposalStatus], 'px-3 py-1.5')}>
            {proposalStatus.replace(/_/g, ' ')}
          </Badge>
          <span className="text-sm text-neutral-500">v{proposalVersion}</span>
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
            {!isNewProposal && (
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<FileText className="h-4 w-4" />}
                onClick={() => exportDocx.mutate()}
                isLoading={exportDocx.isPending}
              >
                Download MMU Form
              </Button>
            )}
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
      {proposalStatus === 'REVISION_REQUIRED' && (
        <div className="bg-warning-50 border border-warning-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-warning-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="h-5 w-5 text-warning-600" />
            </div>
            <div>
              <p className="font-medium text-warning-800">Revision Required</p>
              <p className="text-sm text-warning-600">Your proposal requires revision based on feedback.</p>
            </div>
          </div>
          <Link to={ROUTES.STUDENT.PROPOSAL_STATUS}>
            <Button variant="secondary" size="sm" className="border-warning-300 text-warning-700 hover:bg-warning-100">
              View Feedback
            </Button>
          </Link>
        </div>
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
        {/* Project Identity (template fields) */}
        <Card>
          <h2 className="text-lg font-semibold text-neutral-900 mb-1">Project Identity</h2>
          <p className="text-sm text-neutral-500 mb-4">
            Aligned with the MMU FCI FYP Proposal Form. Specialisation defaults to your profile;
            category and focus options come from the official template.
          </p>

          <div className="space-y-4">
            <Input
              label="Project Title"
              placeholder="Enter your project title"
              error={errors.title?.message}
              disabled={!canEdit}
              required
              {...register('title')}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Project Status <span className="text-error-500">*</span>
                </label>
                <select
                  disabled={!canEdit}
                  className={cn(
                    'w-full px-3 py-2.5 rounded-lg border bg-white text-sm transition-colors',
                    'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
                    errors.projectStatus ? 'border-error-500' : 'border-neutral-300',
                    !canEdit && 'bg-neutral-50'
                  )}
                  {...register('projectStatus')}
                >
                  {PROJECT_STATUS_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
                {errors.projectStatus && (
                  <p className="mt-1 text-xs text-error-600">{errors.projectStatus.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Project Type <span className="text-error-500">*</span>
                </label>
                <select
                  disabled={!canEdit}
                  className={cn(
                    'w-full px-3 py-2.5 rounded-lg border bg-white text-sm transition-colors',
                    'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
                    errors.projectType ? 'border-error-500' : 'border-neutral-300',
                    !canEdit && 'bg-neutral-50'
                  )}
                  {...register('projectType')}
                >
                  {PROJECT_TYPE_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
                {errors.projectType && (
                  <p className="mt-1 text-xs text-error-600">{errors.projectType.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Specialisation <span className="text-error-500">*</span>
                </label>
                <select
                  disabled={!canEdit}
                  className={cn(
                    'w-full px-3 py-2.5 rounded-lg border bg-white text-sm transition-colors',
                    'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
                    errors.specialisation ? 'border-error-500' : 'border-neutral-300',
                    !canEdit && 'bg-neutral-50'
                  )}
                  defaultValue=""
                  {...register('specialisation')}
                >
                  <option value="" disabled>Select specialisation</option>
                  {SPECIALISATIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
                {errors.specialisation && (
                  <p className="mt-1 text-xs text-error-600">{errors.specialisation.message}</p>
                )}
                <p className="mt-1 text-xs text-neutral-500">
                  Should match your student specialisation.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Project Category <span className="text-error-500">*</span>
                </label>
                <select
                  disabled={!canEdit || !watchedSpec}
                  className={cn(
                    'w-full px-3 py-2.5 rounded-lg border bg-white text-sm transition-colors',
                    'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
                    errors.projectCategory ? 'border-error-500' : 'border-neutral-300',
                    (!canEdit || !watchedSpec) && 'bg-neutral-50'
                  )}
                  {...register('projectCategory')}
                >
                  <option value="">{watchedSpec ? 'Select category' : 'Choose specialisation first'}</option>
                  {categoryOptions.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
                {errors.projectCategory && (
                  <p className="mt-1 text-xs text-error-600">{errors.projectCategory.message}</p>
                )}
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Project Focus / Contribution <span className="text-error-500">*</span>
                </label>
                <select
                  disabled={!canEdit || !watchedSpec}
                  className={cn(
                    'w-full px-3 py-2.5 rounded-lg border bg-white text-sm transition-colors',
                    'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
                    errors.projectFocus ? 'border-error-500' : 'border-neutral-300',
                    (!canEdit || !watchedSpec) && 'bg-neutral-50'
                  )}
                  {...register('projectFocus')}
                >
                  <option value="">{watchedSpec ? 'Select focus / contribution' : 'Choose specialisation first'}</option>
                  {focusOptions.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
                {errors.projectFocus && (
                  <p className="mt-1 text-xs text-error-600">{errors.projectFocus.message}</p>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Industry Collaboration */}
        <Card>
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
              <Building2 className="h-5 w-5 text-primary-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-neutral-900">Industry Collaboration</h2>
              <p className="text-sm text-neutral-500">
                Toggle on if your project is sponsored by or in collaboration with an industry partner.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                disabled={!canEdit}
                {...register('industryCollaboration')}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600" />
            </label>
          </div>

          {watchedIndustry && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-neutral-100">
              <Input
                label="Company Name"
                placeholder="Acme Sdn. Bhd."
                disabled={!canEdit}
                error={errors.industryCompanyName?.message}
                {...register('industryCompanyName')}
              />
              <Input
                label="Contact Name"
                placeholder="Industry contact person"
                disabled={!canEdit}
                error={errors.industryContactName?.message}
                {...register('industryContactName')}
              />
              <Input
                label="Contact Phone"
                placeholder="+60 12-345 6789"
                disabled={!canEdit}
                error={errors.industryContactPhone?.message}
                {...register('industryContactPhone')}
              />
            </div>
          )}
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

        {/* Supervisor block (autofilled, read-only) */}
        <Card>
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
              <Briefcase className="h-5 w-5 text-primary-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-neutral-900">Supervisor</h2>
              <p className="text-sm text-neutral-500">
                Filled from your paired supervisor. Add a co-supervisor name if applicable.
              </p>
            </div>
          </div>
          {proposal?.supervisor ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 p-4 rounded-lg bg-neutral-50 border border-neutral-100">
              <div>
                <p className="text-xs uppercase tracking-wide text-neutral-500 mb-0.5">Supervisor Name</p>
                <p className="font-medium text-neutral-900">{proposal.supervisor.fullName}</p>
              </div>
              {proposal.supervisor.position && (
                <div>
                  <p className="text-xs uppercase tracking-wide text-neutral-500 mb-0.5">Position</p>
                  <p className="font-medium text-neutral-900">{proposal.supervisor.position}</p>
                </div>
              )}
              {proposal.supervisor.email && (
                <div>
                  <p className="text-xs uppercase tracking-wide text-neutral-500 mb-0.5">Email</p>
                  <p className="font-medium text-neutral-900">{proposal.supervisor.email}</p>
                </div>
              )}
              {proposal.supervisor.department && (
                <div>
                  <p className="text-xs uppercase tracking-wide text-neutral-500 mb-0.5">Department</p>
                  <p className="font-medium text-neutral-900">{proposal.supervisor.department}</p>
                </div>
              )}
            </div>
          ) : (
            <AlertBanner
              variant="warning"
              description="No supervisor paired yet. Find a supervisor first to enable proposal submission."
              className="mb-4"
            />
          )}
          <Input
            label="Co-Supervisor Name (optional)"
            placeholder="Dr. Co-Supervisor Name"
            disabled={!canEdit}
            {...register('coSupervisorName')}
          />
        </Card>

        {/* Number of Students + work distribution */}
        <Card>
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
              <Users className="h-5 w-5 text-primary-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-neutral-900">Number of Students</h2>
              <p className="text-sm text-neutral-500">
                Select Two if this is a two-student project; you'll fill in subtitles and work distribution.
              </p>
            </div>
          </div>

          <div className="flex bg-neutral-100 rounded-lg p-1 max-w-xs mb-4">
            {NUMBER_OF_STUDENTS_OPTIONS.map((opt) => {
              const checked = watchedNumStudents === opt
              return (
                <label
                  key={opt}
                  className={cn(
                    'flex-1 px-4 py-2 rounded text-sm font-medium text-center transition-colors',
                    canEdit ? 'cursor-pointer' : 'cursor-not-allowed opacity-60',
                    checked ? 'bg-white shadow-sm text-neutral-900' : 'text-neutral-600 hover:bg-neutral-200'
                  )}
                >
                  <input
                    type="radio"
                    value={opt}
                    disabled={!canEdit}
                    {...register('numberOfStudents')}
                    className="sr-only"
                  />
                  {opt}
                </label>
              )
            })}
          </div>

          {/* Student 1 (autofilled) + work distribution if two-student */}
          {proposal?.student1 && (
            <div className="p-4 rounded-lg bg-neutral-50 border border-neutral-100 mb-4">
              <p className="text-xs uppercase tracking-wide text-neutral-500 mb-2">Student 1 — You</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                <div><span className="text-neutral-500">Name:</span> <span className="font-medium text-neutral-900">{proposal.student1.fullName}</span></div>
                <div><span className="text-neutral-500">Student ID:</span> <span className="font-medium text-neutral-900">{proposal.student1.studentId}</span></div>
                <div><span className="text-neutral-500">Specialisation:</span> <span className="font-medium text-neutral-900">{proposal.student1.specialisation || '—'}</span></div>
                <div><span className="text-neutral-500">Email:</span> <span className="font-medium text-neutral-900">{proposal.student1.email}</span></div>
                {proposal.student1.phone && <div><span className="text-neutral-500">Phone:</span> <span className="font-medium text-neutral-900">{proposal.student1.phone}</span></div>}
              </div>
            </div>
          )}

          {watchedNumStudents === 'Two' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Student 1 Subtitle"
                  placeholder="e.g. Front-end module"
                  disabled={!canEdit}
                  error={errors.student1Subtitle?.message}
                  {...register('student1Subtitle')}
                />
                <div className="sm:col-span-1">
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                    Student 1 Work Distribution
                  </label>
                  <textarea
                    rows={3}
                    disabled={!canEdit}
                    placeholder="What this student is responsible for"
                    className={cn(
                      'w-full px-3 py-2 rounded-lg border bg-white text-sm transition-colors resize-none',
                      'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
                      errors.student1WorkDistribution ? 'border-error-500' : 'border-neutral-300',
                      !canEdit && 'bg-neutral-50'
                    )}
                    {...register('student1WorkDistribution')}
                  />
                  {errors.student1WorkDistribution && (
                    <p className="mt-1 text-xs text-error-600">{errors.student1WorkDistribution.message}</p>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-neutral-100 space-y-3">
                <p className="text-sm font-medium text-neutral-700">Student 2</p>
                <Input
                  label="Student 2 MMU ID"
                  placeholder="10-digit MMU ID"
                  disabled={!canEdit}
                  error={errors.student2MmuId?.message}
                  {...register('student2MmuId')}
                />
                {proposal?.student2 ? (
                  <div className="p-3 rounded-lg bg-neutral-50 border border-neutral-100 text-sm">
                    <span className="text-neutral-500">Resolved:</span>{' '}
                    <span className="font-medium text-neutral-900">{proposal.student2.fullName}</span>
                    {proposal.student2.specialisation && (
                      <span className="text-neutral-500"> — {proposal.student2.specialisation}</span>
                    )}
                  </div>
                ) : null}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Student 2 Subtitle"
                    placeholder="e.g. Back-end module"
                    disabled={!canEdit}
                    error={errors.student2Subtitle?.message}
                    {...register('student2Subtitle')}
                  />
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                      Student 2 Work Distribution
                    </label>
                    <textarea
                      rows={3}
                      disabled={!canEdit}
                      placeholder="What this student is responsible for"
                      className={cn(
                        'w-full px-3 py-2 rounded-lg border bg-white text-sm transition-colors resize-none',
                        'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
                        errors.student2WorkDistribution ? 'border-error-500' : 'border-neutral-300',
                        !canEdit && 'bg-neutral-50'
                      )}
                      {...register('student2WorkDistribution')}
                    />
                    {errors.student2WorkDistribution && (
                      <p className="mt-1 text-xs text-error-600">{errors.student2WorkDistribution.message}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
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

        {/* Canonical MMU Form Export + Optional Supporting Attachment */}
        <Card>
          <h2 className="text-lg font-semibold text-neutral-900 mb-1">MMU FYP Proposal Form</h2>
          <p className="text-sm text-neutral-500 mb-4">
            The system generates the official MMU FCI proposal form from the fields above —
            this is the artifact your supervisor and the FYP committee will read.
          </p>

          <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-primary-50 rounded-lg border border-primary-100 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                <FileText className="h-5 w-5 text-primary-600" />
              </div>
              <div>
                <p className="font-medium text-neutral-900">FYP Proposal Form (.docx)</p>
                <p className="text-sm text-neutral-600">
                  Auto-filled from the form above. Save your draft first to capture the latest changes.
                </p>
              </div>
            </div>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<FileText className="h-4 w-4" />}
              onClick={() => exportDocx.mutate()}
              isLoading={exportDocx.isPending}
              disabled={isNewProposal}
            >
              Download
            </Button>
          </div>

          <h3 className="font-medium text-neutral-900 mb-1">Supporting attachment (optional)</h3>
          <p className="text-sm text-neutral-500 mb-3">
            Attach a supporting document if your supervisor asks for one (e.g. a marked-up draft).
            This is <strong>not</strong> the canonical form — submission still uses the generated MMU form above.
          </p>

          {proposalFileUrl ? (
            <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-neutral-500" />
                <div>
                  <p className="font-medium text-neutral-900">{proposalFileName}</p>
                  <p className="text-sm text-neutral-500">Supporting attachment</p>
                </div>
              </div>
              <div className="flex gap-2">
                <a href={proposalFileUrl} target="_blank" rel="noopener noreferrer">
                  <Button variant="secondary" size="sm">Download</Button>
                </a>
                {canEdit && (
                  <label className="cursor-pointer">
                    <span className="inline-flex items-center justify-center gap-2 font-medium rounded-md transition-all duration-200 text-primary-900 bg-transparent hover:bg-primary-50 h-8 px-3 text-sm">
                      Replace
                    </span>
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
              <div className="border-2 border-dashed border-neutral-300 rounded-lg p-6 text-center hover:border-primary-500 transition-colors cursor-pointer">
                <Upload className="h-8 w-8 text-neutral-400 mx-auto mb-2" />
                <p className="font-medium text-neutral-700 text-sm">
                  {uploadingFile ? 'Uploading...' : 'Click to attach a supporting document'}
                </p>
                <p className="text-xs text-neutral-500 mt-1">PDF, DOC, or DOCX up to 10MB</p>
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
            <p className="text-neutral-500 text-sm">No supporting attachment</p>
          )}
        </Card>
      </form>

      {/* Enhanced Submit Modal */}
      <Modal
        isOpen={showSubmitModal}
        onClose={submitModalState === 'submitting' ? () => {} : handleCloseSubmitModal}
        size="md"
        showCloseButton={submitModalState !== 'submitting'}
      >
        {submitModalState === 'confirm' && (
          <div className="p-6">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary-500/25">
                <Rocket className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-xl font-bold text-neutral-900">Submit Your Proposal</h2>
              <p className="text-neutral-500 mt-1">Ready to take the next step?</p>
            </div>

            {/* Warning Notice */}
            <div className="bg-warning-50 border border-warning-200 rounded-xl p-4 mb-6">
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-warning-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="h-4 w-4 text-warning-600" />
                </div>
                <div>
                  <p className="font-medium text-warning-800 text-sm">Important Notice</p>
                  <p className="text-warning-700 text-sm mt-0.5">
                    Once submitted, you cannot edit your proposal until feedback is received from your supervisor.
                  </p>
                </div>
              </div>
            </div>

            {/* Checklist */}
            <div className="bg-neutral-50 rounded-xl p-4 mb-6">
              <h4 className="font-semibold text-neutral-900 mb-3 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-primary-600" />
                Submission Checklist
              </h4>
              <div className="space-y-2.5">
                {[
                  { label: 'Project title is clear and descriptive', checked: true },
                  { label: 'Problem statement explains the issue', checked: true },
                  { label: 'At least 2 objectives defined', checked: true },
                  { label: 'Scope and methodology described', checked: true },
                  { label: 'Expected outcomes listed', checked: true },
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-2.5">
                    <div className="w-5 h-5 bg-success-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="h-3.5 w-3.5 text-success-600" />
                    </div>
                    <span className="text-sm text-neutral-700">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Review Info */}
            <div className="flex items-center gap-4 p-4 bg-primary-50 rounded-xl mb-6">
              <div className="flex -space-x-2">
                <div className="w-10 h-10 bg-primary-200 rounded-full flex items-center justify-center border-2 border-white">
                  <User className="h-5 w-5 text-primary-700" />
                </div>
                <div className="w-10 h-10 bg-primary-300 rounded-full flex items-center justify-center border-2 border-white">
                  <User className="h-5 w-5 text-primary-800" />
                </div>
              </div>
              <div>
                <p className="font-medium text-primary-900 text-sm">Review Process</p>
                <p className="text-primary-700 text-xs">Your supervisor & FYP committee will review within 5-7 days</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                variant="ghost"
                onClick={handleCloseSubmitModal}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={onSubmit}
                className="flex-1 bg-gradient-to-r from-primary-600 to-primary-700 shadow-lg shadow-primary-500/25"
                leftIcon={<Send className="h-4 w-4" />}
              >
                Submit Proposal
              </Button>
            </div>
          </div>
        )}

        {submitModalState === 'submitting' && (
          <div className="p-8 text-center">
            <div className="w-20 h-20 mx-auto mb-6 relative">
              <div className="absolute inset-0 bg-primary-100 rounded-full animate-ping opacity-50" />
              <div className="relative w-full h-full bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center">
                <Send className="h-8 w-8 text-white animate-pulse" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-neutral-900 mb-2">Submitting Your Proposal</h2>
            <p className="text-neutral-500">Please wait while we process your submission...</p>
            <div className="mt-6 flex justify-center">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        {submitModalState === 'success' && (
          <div className="p-8 text-center">
            {/* Success Animation */}
            <div className="relative mb-6">
              <div className="w-24 h-24 mx-auto bg-gradient-to-br from-success-400 to-success-600 rounded-full flex items-center justify-center shadow-xl shadow-success-500/30">
                <CheckCircle className="h-12 w-12 text-white" />
              </div>
              {/* Confetti-like decorations */}
              <div className="absolute top-0 left-1/4 w-3 h-3 bg-warning-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="absolute top-2 right-1/4 w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '100ms' }} />
              <div className="absolute bottom-0 left-1/3 w-2.5 h-2.5 bg-success-300 rounded-full animate-bounce" style={{ animationDelay: '200ms' }} />
              <div className="absolute bottom-2 right-1/3 w-2 h-2 bg-error-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            </div>

            <div className="flex items-center justify-center gap-2 mb-2">
              <PartyPopper className="h-5 w-5 text-warning-500" />
              <h2 className="text-2xl font-bold text-neutral-900">Congratulations!</h2>
              <PartyPopper className="h-5 w-5 text-warning-500 scale-x-[-1]" />
            </div>
            <p className="text-neutral-600 mb-6">Your proposal has been submitted successfully!</p>

            {/* Timeline Card */}
            <div className="bg-gradient-to-br from-neutral-50 to-neutral-100 rounded-xl p-5 mb-6 text-left border border-neutral-200">
              <h4 className="font-semibold text-neutral-900 mb-4 flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary-600" />
                What Happens Next?
              </h4>
              <div className="space-y-4">
                {[
                  { step: 1, title: 'Supervisor Review', desc: 'Your supervisor will review your proposal', time: '2-3 days' },
                  { step: 2, title: 'Committee Review', desc: 'FYP committee evaluates your submission', time: '3-5 days' },
                  { step: 3, title: 'Feedback & Decision', desc: 'You\'ll receive feedback via notification', time: 'Total ~7 days' },
                ].map((item, index) => (
                  <div key={index} className="flex gap-3">
                    <div className="w-7 h-7 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-primary-700">
                      {item.step}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-neutral-900 text-sm">{item.title}</p>
                      <p className="text-neutral-500 text-xs">{item.desc}</p>
                    </div>
                    <span className="text-xs text-primary-600 font-medium bg-primary-50 px-2 py-1 rounded-full h-fit">
                      {item.time}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={handleCloseSubmitModal}
                className="flex-1"
              >
                Stay Here
              </Button>
              <Button
                variant="primary"
                onClick={handleGoToDashboard}
                className="flex-1 bg-gradient-to-r from-success-500 to-success-600"
                rightIcon={<ArrowRight className="h-4 w-4" />}
              >
                Go to Dashboard
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
