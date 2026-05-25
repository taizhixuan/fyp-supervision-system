// Mirrors the official MMU FCI "FYP Proposal Form" template
// (docs-project/template/FYP Proposal Form.docx). Single source of truth for
// the cascading dropdowns in ProposalWorkspace.

export const PROJECT_STATUS_OPTIONS = [
  'Supervisor-Proposed',
  'Student-Proposed',
  'Industry-Proposed',
] as const
export type ProjectStatusOption = (typeof PROJECT_STATUS_OPTIONS)[number]

export const PROJECT_TYPE_OPTIONS = ['Application-Based', 'Research-Based'] as const
export type ProjectTypeOption = (typeof PROJECT_TYPE_OPTIONS)[number]

export const NUMBER_OF_STUDENTS_OPTIONS = ['One', 'Two'] as const
export type NumberOfStudentsOption = (typeof NUMBER_OF_STUDENTS_OPTIONS)[number]

export const SPECIALISATIONS = [
  'Software Engineering',
  'Data Science',
  'Cybersecurity',
  'Game Development',
  'Information Systems',
] as const
export type Specialisation = (typeof SPECIALISATIONS)[number]

// Categories per specialisation (template, "Project Category")
export const PROJECT_CATEGORIES_BY_SPEC: Record<Specialisation, readonly string[]> = {
  'Software Engineering': [
    'Critical System',
    'Application Software',
    'Software Tools & Utilities',
    'Service Oriented Computing',
  ],
  'Data Science': ['Data Engineering', 'Data Analytics'],
  'Cybersecurity': [
    'Cryptography and Data Security',
    'Investigation and Analysis',
    'Security and Defence',
  ],
  'Game Development': [
    'Game Software Development (GSD)',
    'Game Algorithm Research (GAR)',
    'Game Design Prototyping (GDP)',
  ],
  'Information Systems': [
    'IT Infrastructure',
    'Transaction Processing Systems',
    'Intelligent Systems',
  ],
}

// Focus / Contribution per specialisation (template, "Project Focus/Contribution")
export const PROJECT_FOCUS_BY_SPEC: Record<Specialisation, readonly string[]> = {
  'Software Engineering': [
    'Product Development',
    'Prototype/Proof of Concept',
    'Software Engineering Methodologies',
    'Others',
  ],
  'Data Science': [
    'Data Management',
    'IoT',
    'Optimisation of Technologies',
    'Analysis of data (texts, videos, images, numerical digit)',
    'Others',
  ],
  'Cybersecurity': [
    'Cryptography',
    'Database Security',
    'Blockchain',
    'Malware analysis',
    'Forensics',
    'Ethical hacking',
    'Network and Cloud Security',
    'Others',
  ],
  'Game Development': [
    'Game Software Development (GSD): development and implementation of a complete game from design to production',
    'Game Algorithm Research (GAR): investigation and analysis of specific algorithms used in games',
    'Game Design Prototyping (GDP): proof of concept of novel specific game design concepts via complete prototypes',
  ],
  'Information Systems': [
    'Data & Information Management',
    'User Experience',
    'System Analysis & Design',
    'IS Project Management',
    'Business Processes',
    'Technology Evaluation',
    'Others',
  ],
}

export function categoriesFor(spec: string | undefined | null): readonly string[] {
  if (!spec) return []
  return PROJECT_CATEGORIES_BY_SPEC[spec as Specialisation] ?? []
}

export function focusesFor(spec: string | undefined | null): readonly string[] {
  if (!spec) return []
  return PROJECT_FOCUS_BY_SPEC[spec as Specialisation] ?? []
}
