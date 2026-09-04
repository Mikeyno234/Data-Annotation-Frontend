import apiClient from './client'
import type { Review, QATask, QAResult, DataItem, Pagination } from '@/types'

export const workflowApi = {
  checkoutTask(projectId: number | string) {
		return apiClient.post<{ success: boolean; data: DataItem }>(`/projects/${projectId}/tasks/checkout`)
  },
  releaseTask(taskId: number | string) {
    return apiClient.post<{ success: boolean }>(`/tasks/${taskId}/release-lock`)
  },
  getReviews(params?: {
    page?: number
    limit?: number
    status?: string
    search?: string
    project_id?: number
  }) {
    return apiClient.get<{ success: boolean; data: Review[]; pagination: Pagination }>('/reviews', { params })
  },
  approveReview(annotationId: number | string, comment?: string) {
    return apiClient.post<{ success: boolean; data: Review }>(`/reviews/${annotationId}/approve`, { comment })
  },
  rejectReview(annotationId: number | string, comment: string) {
    return apiClient.post<{ success: boolean; data: Review }>(`/reviews/${annotationId}/reject`, { comment })
  },
  getQATasks(params?: {
    page?: number
    limit?: number
    status?: string
    project_id?: number
  }) {
    return apiClient.get<{ success: boolean; data: QATask[]; pagination: Pagination }>('/qa/tasks', { params })
  },
  evaluateQA(
    qaTaskId: number | string,
    payload: {
      score: number
      passed: boolean
      issue_type?: string
      comment?: string
    }
  ) {
    return apiClient.post<{ success: boolean; data: QAResult }>(`/qa/tasks/${qaTaskId}/evaluate`, payload)
  }
}
