export type ResourceCategory = 'HANDBOOK' | 'TEMPLATE' | 'RUBRIC' | 'GUIDELINE' | 'TUTORIAL' | 'FORM'

export type ResourceType = 'PDF' | 'DOCX' | 'XLSX' | 'VIDEO' | 'LINK' | 'OTHER'

export type ResourceVisibility = 'PUBLIC' | 'STUDENT' | 'SUPERVISOR' | 'COMMITTEE'

export interface Resource {
  resourceId: string | number
  uploadedByAdminUserId?: number
  category: ResourceCategory
  type?: ResourceType
  title: string
  description?: string
  storagePath?: string
  fileUrl?: string
  fileName?: string
  fileSize?: number
  visibility: ResourceVisibility
  isActive?: boolean
  isFeatured?: boolean
  downloadCount?: number
  tags?: string[]
  publishedAt: string
  updatedAt?: string
  cycleId?: number | null
  cycleType?: string | null
  cycleAcademicYear?: string | null
}

export interface ResourceListResponse {
  resources: Resource[]
  total: number
}

export interface Announcement {
  announcementId: number
  createdByUserId: number
  scope: string
  title: string
  content: string
  publishAt: string
  createdAt: string
}

export interface FaqItem {
  id: number
  category: string
  question: string
  answer: string
}

export interface SystemParameter {
  paramId: number
  paramKey: string
  paramValue: string
  updatedAt: string
}
