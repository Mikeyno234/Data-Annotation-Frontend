import axios, { type AxiosRequestConfig } from 'axios'
import router from '@/router'
export type { ApiResponse, PaginatedResponse } from '@/types'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1'

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to attach JWT Token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('annotation_auth_token') || sessionStorage.getItem('annotation_auth_token') || localStorage.getItem('matrix_auth_token')
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// ponytail: clean native Axios without monkey patch, rely on TanStack Query for caching and deduplication

// Silent refresh queue state
let isRefreshing = false
let failedQueue: Array<{
  resolve: (value?: any) => void
  reject: (reason?: any) => void
}> = []

function processQueue(error: any, token: string | null = null) {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config

    // Check if error is 401 and request was not login/refresh, and hasn't already been retried
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/login') &&
      !originalRequest.url?.includes('/auth/refresh')
    ) {
      if (isRefreshing) {
        // A refresh is already in progress; queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((newToken) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`
            }
            return apiClient(originalRequest)
          })
          .catch((err) => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        // Dynamically import authStore to prevent circular module dependencies
        const { useAuthStore } = await import('@/stores/auth')
        const authStore = useAuthStore()

        const refreshed = await authStore.refreshAuthToken()
        if (refreshed && authStore.token) {
          const newToken = authStore.token
          processQueue(null, newToken)

          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`
          }
          return apiClient(originalRequest)
        } else {
          throw new Error('Token refresh unsuccessful')
        }
      } catch (refreshErr) {
        processQueue(refreshErr, null)
        try {
          const { useAuthStore } = await import('@/stores/auth')
          const authStore = useAuthStore()
          authStore.logout()
        } catch {
          // Fallback storage purge
          const keys = [
            'annotation_auth_token',
            'annotation_refresh_token',
            'annotation_auth_user',
            'annotation_auth_org',
            'annotation_auth_perms',
          ]
          keys.forEach((k) => {
            localStorage.removeItem(k)
            sessionStorage.removeItem(k)
          })
        }

        if (window.location.pathname !== '/login') {
          router.push('/login').catch(() => {
            window.location.href = '/login'
          })
        }
        return Promise.reject(error.response?.data?.error || error)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error.response?.data?.error || error)
  }
)

export default apiClient
