import { Card } from '@/components/ui/Card'
import { downloadAuthedFile } from '@/lib/utils/download'
import { Paperclip, Download } from 'lucide-react'

/**
 * The parsed proposal content shared by student / supervisor / committee views. Every
 * field is optional because older versions may not carry the full MMU template data.
 */
export interface ProposalContentData {
  title?: string
  projectStatus?: string | null
  projectType?: string | null
  specialisation?: string | null
  projectCategory?: string | null
  projectFocus?: string | null
  industryCollaboration?: boolean
  industryCompanyName?: string | null
  industryContactName?: string | null
  industryContactPhone?: string | null
  problemStatement?: string
  objectives?: string[] | string
  scope?: string
  methodology?: string
  expectedOutcomes?: string[] | string
  timeline?: string | null
  coSupervisorName?: string | null
  numberOfStudents?: string
  references?: string[] | string
}

interface Props {
  content: ProposalContentData
  /** Authenticated API path to download the supporting attachment (JWT attached via axios). */
  downloadPath?: string | null
  fileName?: string | null
  className?: string
}

function toList(value?: string[] | string): string[] {
  if (Array.isArray(value)) return value.map((v) => String(v).trim()).filter(Boolean)
  if (typeof value === 'string') {
    return value
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)
  }
  return []
}

function IdentityRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div className="flex flex-col">
      <dt className="text-xs font-medium uppercase tracking-wide text-neutral-400">{label}</dt>
      <dd className="text-sm text-neutral-800">{value}</dd>
    </div>
  )
}

/**
 * Renders the complete set of proposal sections. Used by the supervisor and committee
 * review views and the student version-history detail so every role sees the same content.
 */
export function ProposalContentSections({ content, downloadPath, fileName, className }: Props) {
  const objectives = toList(content.objectives)
  const outcomes = toList(content.expectedOutcomes)
  const references = toList(content.references)
  const hasIdentity =
    content.projectStatus ||
    content.projectType ||
    content.specialisation ||
    content.projectCategory ||
    content.projectFocus ||
    content.industryCollaboration

  return (
    <div className={className}>
      <div className="space-y-3 lg:space-y-4">
        {/* Project Identity */}
        {hasIdentity && (
          <Card>
            <h3 className="font-semibold text-neutral-900 mb-3">Project Identity</h3>
            <dl className="grid sm:grid-cols-2 gap-4">
              <IdentityRow label="Project Status" value={content.projectStatus} />
              <IdentityRow label="Project Type" value={content.projectType} />
              <IdentityRow label="Specialisation" value={content.specialisation} />
              <IdentityRow label="Project Category" value={content.projectCategory} />
              <IdentityRow label="Project Focus" value={content.projectFocus} />
              <IdentityRow
                label="Industry Collaboration"
                value={content.industryCollaboration ? content.industryCompanyName || 'Yes' : 'No'}
              />
            </dl>
          </Card>
        )}

        {/* Problem Statement */}
        {content.problemStatement && (
          <Card>
            <h3 className="font-semibold text-neutral-900 mb-3">Problem Statement</h3>
            <p className="text-neutral-600 whitespace-pre-wrap">{content.problemStatement}</p>
          </Card>
        )}

        {/* Objectives */}
        {objectives.length > 0 && (
          <Card>
            <h3 className="font-semibold text-neutral-900 mb-3">Objectives</h3>
            <ul className="space-y-2">
              {objectives.map((obj, index) => (
                <li key={index} className="flex items-start gap-2 text-neutral-600">
                  <span className="flex-shrink-0 w-6 h-6 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </span>
                  {obj}
                </li>
              ))}
            </ul>
          </Card>
        )}

        {/* Scope */}
        {content.scope && (
          <Card>
            <h3 className="font-semibold text-neutral-900 mb-3">Scope</h3>
            <p className="text-neutral-600 whitespace-pre-wrap">{content.scope}</p>
          </Card>
        )}

        {/* Methodology */}
        {content.methodology && (
          <Card>
            <h3 className="font-semibold text-neutral-900 mb-3">Methodology</h3>
            <p className="text-neutral-600 whitespace-pre-wrap">{content.methodology}</p>
          </Card>
        )}

        {/* Expected Outcomes — rendered as separate items for readability */}
        {outcomes.length > 0 && (
          <Card>
            <h3 className="font-semibold text-neutral-900 mb-3">Expected Outcomes</h3>
            <ul className="space-y-2">
              {outcomes.map((item, index) => (
                <li key={index} className="flex items-start gap-2 text-neutral-600">
                  <span className="flex-shrink-0 mt-2 w-1.5 h-1.5 rounded-full bg-primary-500" />
                  {item}
                </li>
              ))}
            </ul>
          </Card>
        )}

        {/* Timeline */}
        {content.timeline && (
          <Card>
            <h3 className="font-semibold text-neutral-900 mb-3">Timeline</h3>
            <p className="text-neutral-600 whitespace-pre-wrap">{content.timeline}</p>
          </Card>
        )}

        {/* References */}
        {references.length > 0 && (
          <Card>
            <h3 className="font-semibold text-neutral-900 mb-3">References</h3>
            <ul className="space-y-1 list-disc list-inside text-neutral-600 text-sm">
              {references.map((ref, index) => (
                <li key={index}>{ref}</li>
              ))}
            </ul>
          </Card>
        )}

        {/* Supporting attachment */}
        {downloadPath && (
          <Card>
            <h3 className="font-semibold text-neutral-900 mb-3">Supporting Attachment</h3>
            <button
              type="button"
              onClick={() => downloadAuthedFile(downloadPath, fileName ?? undefined)}
              className="inline-flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700"
            >
              <Paperclip className="h-4 w-4" />
              {fileName || 'Download attachment'}
              <Download className="h-4 w-4" />
            </button>
          </Card>
        )}
      </div>
    </div>
  )
}
