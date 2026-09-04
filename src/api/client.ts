import axios, { type AxiosRequestConfig } from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1'

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// In-flight request deduplication map to prevent redundant concurrent backend hits
const inFlightRequests = new Map<string, Promise<any>>()

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

// Custom get wrapper with automatic In-Flight Promise Deduplication
const originalGet = apiClient.get.bind(apiClient)
apiClient.get = function (url: string, config?: any): Promise<any> {
  const requestKey = `GET:${url}:${JSON.stringify(config?.params || {})}`
  
  if (inFlightRequests.has(requestKey)) {
    return inFlightRequests.get(requestKey)!
  }

  const promise = originalGet(url, config)
    .finally(() => {
      // Hold the slot briefly for 500ms to throttle burst spam clicks
      setTimeout(() => {
        inFlightRequests.delete(requestKey)
      }, 500)
    })

  inFlightRequests.set(requestKey, promise)
  return promise
} as any

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401 && !error.config?.url?.includes('/auth/login') && !error.config?.url?.includes('/auth/refresh')) {
      localStorage.removeItem('annotation_auth_token')
      localStorage.removeItem('annotation_refresh_token')
      localStorage.removeItem('annotation_auth_user')
      sessionStorage.removeItem('annotation_auth_token')
      sessionStorage.removeItem('annotation_refresh_token')
      sessionStorage.removeItem('annotation_auth_user')
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error.response?.data?.error || error)
  }
)

export default apiClient
