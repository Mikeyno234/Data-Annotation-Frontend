import apiClient from './client'
import type { AnnotationType, ModalityType } from '@/types'

export interface AnnotationTypeListParams {
  modality?: string
  search?: string
  status?: string
  page?: number
  limit?: number
}

export interface CreateAnnotationTypePayload {
  parent_id?: number | null
  level?: 'CATEGORY' | 'SUB_TYPE'
  tool_type?: string
  code: string
  name: string
  modality: ModalityType
  description?: string
  instructions?: string
  badges?: any
  preview_image_url?: string
  preview_data?: any
  sub_options?: any
  label_config?: string
  status?: 'ACTIVE' | 'INACTIVE'
}

export interface UpdateAnnotationTypePayload {
  parent_id?: number | null
  level?: 'CATEGORY' | 'SUB_TYPE'
  tool_type?: string
  code?: string
  name?: string
  modality?: ModalityType
  description?: string
  instructions?: string
  badges?: any
  preview_image_url?: string
  preview_data?: any
  sub_options?: any
  label_config?: string
  status?: 'ACTIVE' | 'INACTIVE'
}

export const annotationTypesApi = {
  getAnnotationTypes(params?: AnnotationTypeListParams) {
    return apiClient.get<{
      success: boolean
      data: AnnotationType[]
      pagination?: {
        page: number
        limit: number
        total: number
        total_pages: number
      }
    }>('/annotation-types', { params })
  },

  getAnnotationType(id: number) {
    return apiClient.get<{ success: boolean; data: AnnotationType }>(`/annotation-types/${id}`)
  },

  createAnnotationType(payload: CreateAnnotationTypePayload) {
    return apiClient.post<{ success: boolean; data: AnnotationType }>('/annotation-types', payload)
  },

  updateAnnotationType(id: number, payload: UpdateAnnotationTypePayload) {
    return apiClient.put<{ success: boolean; data: AnnotationType }>(`/annotation-types/${id}`, payload)
  },

  deleteAnnotationType(id: number) {
    return apiClient.delete<{ success: boolean; message: string }>(`/annotation-types/${id}`)
  },
}
