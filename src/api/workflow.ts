import apiClient from './client'
import type { Review, ReviewProjectSummary, BatchReviewRequest, QAProjectSummary, BatchQAEvaluateRequest, QAIssueTypeOption, QATask, QAResult, DataItem, Pagination } from '@/types'

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
  getReviewProjects(params?: { search?: string }) {
    return apiClient.get<{ success: boolean; data: ReviewProjectSummary[] }>('/reviews/projects', { params })
  },
  approveReview(annotationId: number | string, comment?: string, fixPayload?: any) {
    return apiClient.post<{ success: boolean; data: Review }>(`/reviews/${annotationId}/approve`, {
      comment,
      fix_payload: fixPayload,
    })
  },
  rejectReview(annotationId: number | string, comment: string) {
    return apiClient.post<{ success: boolean; data: Review }>(`/reviews/${annotationId}/reject`, { comment })
  },
  batchApproveReviews(payload: BatchReviewRequest) {
    return apiClient.post<{ success: boolean; data: { approved_count: number }; message: string }>('/reviews/batch-approve', payload)
  },
  batchRejectReviews(payload: BatchReviewRequest) {
    return apiClient.post<{ success: boolean; data: { rejected_count: number }; message: string }>('/reviews/batch-reject', payload)
  },
  getQATasks(params?: {
    page?: number
    limit?: number
    status?: string
    project_id?: number
  }) {
    return apiClient.get<{ success: boolean; data: QATask[]; pagination: Pagination }>('/qa/tasks', { params })
  },
  getQAProjects(params?: { search?: string }) {
    return apiClient.get<{ success: boolean; data: QAProjectSummary[] }>('/qa/projects', { params })
  },
  getQAIssueTypes() {
    return apiClient.get<{ success: boolean; data: QAIssueTypeOption[] }>('/qa/issue-types')
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
  },
  batchEvaluateQA(payload: BatchQAEvaluateRequest) {
    return apiClient.post<{ success: boolean; data: { count: number }; message: string }>('/qa/batch-evaluate', payload)
  }
}
