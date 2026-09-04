import apiClient from './client'
import type { User, Organization } from '@/types'

export interface LoginResponse {
  token: string
  refresh_token?: string
  user: User
  organization: Organization | null
  permissions: string[]
}

export const authApi = {
  login(credentials: { email: string; password: string }) {
    return apiClient.post<{ success: boolean; data: LoginResponse }>('/auth/login', credentials)
  },
  refreshToken(refreshToken: string) {
    return apiClient.post<{ success: boolean; data: LoginResponse }>('/auth/refresh', { refresh_token: refreshToken })
  },
  getMe() {
    return apiClient.get<{ success: boolean; data: User }>('/auth/me')
  },
  updateProfile(payload: { full_name?: string; avatar?: string }) {
    return apiClient.put<{ success: boolean; data: User }>('/auth/profile', payload)
  },
  uploadAvatar(file: File) {
    const formData = new FormData()
    formData.append('avatar', file)
    return apiClient.post<{ success: boolean; data: User }>('/auth/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },
  deleteAvatar() {
    return apiClient.delete<{ success: boolean; data: User }>('/auth/avatar')
  },
  updatePassword(payload: { current_password: string; new_password: string }) {
    return apiClient.put<{ success: boolean; message: string }>('/auth/password', payload)
  },
}

export function getAvatarUrl(user?: User | null): string {
  if (!user?.avatar) return ''
  if (user.avatar.startsWith('http://') || user.avatar.startsWith('https://') || user.avatar.startsWith('data:')) {
    return user.avatar
  }
  const apiBase = import.meta.env.VITE_API_BASE_URL || '/api/v1'
  return `${apiBase}/auth/avatar/${user.id}?t=${encodeURIComponent(user.avatar)}`
}

