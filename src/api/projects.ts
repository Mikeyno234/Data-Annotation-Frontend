import apiClient from './client'
import type { Project, Dataset, Batch, Pagination, ExportFormatOption, ProjectStats } from '@/types'

export interface CreateProjectPayload {
  name: string
  code: string
  description?: string
  modality: string
  annotation_type: string
  tool_type?: string
  label_config?: string
  assignee_ids?: number[]
}

export const projectsApi = {
  getProjects(params?: { page?: number; limit?: number; modality?: string; search?: string }) {
    return apiClient.get<{ success: boolean; data: Project[]; pagination: Pagination }>('/projects', { params })
  },
  getProject(id: number | string) {
    return apiClient.get<{ success: boolean; data: Project }>(`/projects/${id}`)
  },
  createProject(payload: CreateProjectPayload) {
    return apiClient.post<{ success: boolean; data: Project }>('/projects', payload)
  },
  updateProject(id: number | string, payload: CreateProjectPayload) {
    return apiClient.put<{ success: boolean; data: Project }>(`/projects/${id}`, payload)
  },
  assignProject(id: number | string, userIds: number[]) {
    return apiClient.post<{ success: boolean }>(`/projects/${id}/assign`, { user_ids: userIds })
  },
  assignBatch(id: number | string, userIds: number[]) {
    return apiClient.post<{ success: boolean }>(`/batches/${id}/assign`, { user_ids: userIds })
  },
  getDatasets(params?: { projectId?: number; project_id?: number; page?: number; limit?: number; search?: string; modality?: string }) {
    const pId = params?.project_id || params?.projectId
    return apiClient.get<{ success: boolean; data: Dataset[]; pagination: Pagination }>('/datasets', {
      params: { ...params, project_id: pId }
    })
  },
  getBatches(datasetId?: number) {
    return apiClient.get<{ success: boolean; data: Batch[] }>('/batches', { params: { dataset_id: datasetId } })
  },
  createBatch(projectId: number | string, payload: { name: string; priority?: string; dataset_id?: number; assignee_ids?: number[] }) {
    return apiClient.post<{ success: boolean; data: Batch }>(`/projects/${projectId}/batches`, payload)
  },
  uploadDataset(formData: FormData) {
    return apiClient.post<{ success: boolean; data: Dataset }>('/datasets/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },
  exportProject(id: number | string, format: string = 'json') {
    return apiClient.get(`/projects/${id}/export`, {
      params: { format },
      responseType: 'blob',
    })
  },
  getExportFormats(id: number | string) {
    return apiClient.get<{ success: boolean; data: ExportFormatOption[] }>(`/projects/${id}/export-formats`)
  },
  getProjectStats(id: number | string) {
    return apiClient.get<{ success: boolean; data: ProjectStats }>(`/projects/${id}/stats`)
  }
}

