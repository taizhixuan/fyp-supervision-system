import { api } from './client'
import type { Resource, ResourceListResponse, Announcement, SystemParameter } from '@/types'

export const resourcesApi = {
  /**
   * Get list of resources (handbook, templates, etc.)
   */
  getResources: async (params?: {
    category?: string
    visibility?: string
  }): Promise<ResourceListResponse> => {
    const response = await api.get('/resources', { params })
    return response.data
  },

  /**
   * Get resource categories
   */
  getCategories: async (): Promise<{ categories: string[] }> => {
    const response = await api.get('/resources/categories')
    return response.data
  },

  /**
   * Get single resource by ID
   */
  getResource: async (resourceId: number): Promise<Resource> => {
    const response = await api.get(`/resources/${resourceId}`)
    return response.data
  },

  /**
   * Download resource file
   */
  downloadResource: async (resourceId: number): Promise<Blob> => {
    const response = await api.get(`/resources/${resourceId}/download`, {
      responseType: 'blob',
    })
    return response.data
  },
}

export const announcementsApi = {
  /**
   * Get latest public announcements (for landing page)
   */
  getLatest: async (limit: number = 3): Promise<{ announcements: Announcement[] }> => {
    const response = await api.get('/announcements/latest', { params: { limit } })
    return response.data
  },

  /**
   * Get all announcements (paginated)
   */
  getAnnouncements: async (params?: {
    page?: number
    limit?: number
    scope?: string
  }): Promise<{ announcements: Announcement[]; total: number }> => {
    const response = await api.get('/announcements', { params })
    return response.data
  },
}

export const systemApi = {
  /**
   * Get public system parameters (support email, etc.)
   */
  getPublicParameters: async (): Promise<{ parameters: SystemParameter[] }> => {
    const response = await api.get('/system/parameters/public')
    return response.data
  },
}
