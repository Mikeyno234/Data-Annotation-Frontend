import apiClient from './client'
import type { DataItem, Annotation, Pagination } from '@/types'

export const annotationsApi = {
  getDataItems(params?: {
    page?: number
    limit?: number
    project_id?: number
    batch_id?: number
    status?: string
    modality?: string
    search?: string
    my_tasks?: boolean
  }) {
    return apiClient.get<{ success: boolean; data: DataItem[]; pagination: Pagination }>('/data', { params })
  },
  getDataItem(id: number | string) {
    return apiClient.get<{ success: boolean; data: DataItem }>(`/data/${id}`)
  },
  submitAnnotation(
    dataItemId: number | string,
    payload: {
      annotation_type: string
      payload: any
      lead_time_seconds: number
    }
  ) {
    return apiClient.post<{ success: boolean; data: Annotation }>(`/data/${dataItemId}/annotations`, payload)
  },
  saveDraft(dataItemId: number | string, payload: any) {
    return apiClient.patch<{ success: boolean }>(`/data/${dataItemId}/draft`, { payload })
  },
}

