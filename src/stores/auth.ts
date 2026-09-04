import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '@/api/auth'
import type { User, Organization } from '@/types'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(
    localStorage.getItem('annotation_auth_token') || sessionStorage.getItem('annotation_auth_token') || localStorage.getItem('matrix_auth_token')
  )
  const refreshToken = ref<string | null>(
    localStorage.getItem('annotation_refresh_token') || sessionStorage.getItem('annotation_refresh_token')
  )
  const user = ref<User | null>(
    (localStorage.getItem('annotation_auth_user') || sessionStorage.getItem('annotation_auth_user') || localStorage.getItem('matrix_auth_user'))
      ? JSON.parse(
          (localStorage.getItem('annotation_auth_user') || sessionStorage.getItem('annotation_auth_user') || localStorage.getItem('matrix_auth_user'))!
        )
      : null
  )
  const organization = ref<Organization | null>(
    (localStorage.getItem('annotation_auth_org') || sessionStorage.getItem('annotation_auth_org') || localStorage.getItem('matrix_auth_org'))
      ? JSON.parse(
          (localStorage.getItem('annotation_auth_org') || sessionStorage.getItem('annotation_auth_org') || localStorage.getItem('matrix_auth_org'))!
        )
      : null
  )
  const permissions = ref<string[]>(
    (localStorage.getItem('annotation_auth_perms') || sessionStorage.getItem('annotation_auth_perms') || localStorage.getItem('matrix_auth_perms'))
      ? JSON.parse(
          (localStorage.getItem('annotation_auth_perms') || sessionStorage.getItem('annotation_auth_perms') || localStorage.getItem('matrix_auth_perms'))!
        )
      : []
  )

  const isAuthenticated = computed(() => !!token.value && !!user.value)
  const currentRole = computed(() => user.value?.role?.name || 'Annotator')
  const isSuperAdmin = computed(() => currentRole.value === 'Super Admin')
  const isProjectManager = computed(() => currentRole.value === 'Project Manager' || isSuperAdmin.value)
  const isReviewer = computed(() => currentRole.value === 'Reviewer' || isSuperAdmin.value)

  function hasPermission(permissionCode: string): boolean {
    if (permissions.value && permissions.value.length > 0) {
      return permissions.value.includes(permissionCode)
    }
    return isSuperAdmin.value
  }

  async function login(credentials: { email: string; password: string; rememberMe?: boolean }) {
    const res: any = await authApi.login(credentials)
    const payload = res?.data || res
    if (payload && payload.token) {
      token.value = payload.token
      refreshToken.value = payload.refresh_token || null
      user.value = payload.user || null
      organization.value = payload.organization || payload.user?.organization || null
      
      const perms: string[] = payload.permissions || 
        payload.user?.role?.permissions?.map((p: any) => p.code) || 
        []
      permissions.value = perms

      const storage = credentials.rememberMe ? localStorage : sessionStorage
      // Clean up previous storage
      localStorage.removeItem('annotation_auth_token')
      localStorage.removeItem('annotation_refresh_token')
      sessionStorage.removeItem('annotation_auth_token')
      sessionStorage.removeItem('annotation_refresh_token')

      storage.setItem('annotation_auth_token', payload.token)
      if (payload.refresh_token) {
        storage.setItem('annotation_refresh_token', payload.refresh_token)
      }
      if (payload.user) {
        storage.setItem('annotation_auth_user', JSON.stringify(payload.user))
      }
      if (organization.value) {
        storage.setItem('annotation_auth_org', JSON.stringify(organization.value))
      }
      storage.setItem('annotation_auth_perms', JSON.stringify(permissions.value))
      return payload
    }
    throw new Error(res?.message || 'Login failed')
  }

  async function refreshAuthToken(): Promise<boolean> {
    const rfToken = refreshToken.value || localStorage.getItem('annotation_refresh_token') || sessionStorage.getItem('annotation_refresh_token')
    if (!rfToken) return false
    try {
      const res: any = await authApi.refreshToken(rfToken)
      const payload = res?.data || res
      if (payload && payload.token) {
        token.value = payload.token
        if (payload.refresh_token) {
          refreshToken.value = payload.refresh_token
        }
        if (localStorage.getItem('annotation_auth_token')) {
          localStorage.setItem('annotation_auth_token', payload.token)
          if (payload.refresh_token) localStorage.setItem('annotation_refresh_token', payload.refresh_token)
        } else {
          sessionStorage.setItem('annotation_auth_token', payload.token)
          if (payload.refresh_token) sessionStorage.setItem('annotation_refresh_token', payload.refresh_token)
        }
        return true
      }
    } catch {
      logout()
    }
    return false
  }

  async function updateProfile(payload: { full_name?: string; avatar?: string }) {
    const res: any = await authApi.updateProfile(payload)
    const data = res?.data || res
    if (data && (res.status === 'success' || res.success || data.id)) {
      user.value = { ...user.value, ...data }
      localStorage.setItem('annotation_auth_user', JSON.stringify(user.value))
      return data
    }
    throw new Error(res?.message || 'Failed to update profile')
  }

  async function uploadAvatar(file: File) {
    const res: any = await authApi.uploadAvatar(file)
    const data = res?.data || res
    if (data && (res.status === 'success' || res.success || data.id)) {
      user.value = { ...user.value, ...data }
      localStorage.setItem('annotation_auth_user', JSON.stringify(user.value))
      return data
    }
    throw new Error(res?.message || 'Failed to upload avatar')
  }

  async function deleteAvatar() {
    const res: any = await authApi.deleteAvatar()
    const data = res?.data || res
    if (data && (res.status === 'success' || res.success || data.id)) {
      user.value = { ...user.value, ...data }
      localStorage.setItem('annotation_auth_user', JSON.stringify(user.value))
      return data
    }
    throw new Error(res?.message || 'Failed to remove avatar')
  }

  async function updatePassword(payload: { current_password: string; new_password: string }) {
    const res: any = await authApi.updatePassword(payload)
    if (res?.status === 'success' || res?.success) {
      return true
    }
    throw new Error(res?.message || 'Failed to update password')
  }

  function logout() {
    token.value = null
    user.value = null
    organization.value = null
    permissions.value = []
    localStorage.removeItem('annotation_auth_token')
    localStorage.removeItem('annotation_auth_user')
    localStorage.removeItem('annotation_auth_org')
    localStorage.removeItem('annotation_auth_perms')
    localStorage.removeItem('matrix_auth_token')
    localStorage.removeItem('matrix_auth_user')
    localStorage.removeItem('matrix_auth_org')
    localStorage.removeItem('matrix_auth_perms')
    sessionStorage.removeItem('annotation_auth_token')
    sessionStorage.removeItem('annotation_auth_user')
    sessionStorage.removeItem('annotation_auth_org')
    sessionStorage.removeItem('annotation_auth_perms')
  }

  async function fetchCurrentUser() {
    try {
      const res: any = await authApi.getMe()
      const data = res?.data || res
      if (data && data.id) {
        user.value = data
        if (data.organization) {
          organization.value = data.organization
        }
        if (data.role?.permissions) {
          permissions.value = data.role.permissions.map((p: any) => p.code || p)
          localStorage.setItem('annotation_auth_perms', JSON.stringify(permissions.value))
        }
        localStorage.setItem('annotation_auth_user', JSON.stringify(user.value))
        if (organization.value) {
          localStorage.setItem('annotation_auth_org', JSON.stringify(organization.value))
        }
        return data
      }
    } catch {
      // Keep existing cached state if request fails
    }
  }

  function setOrganization(org: Organization) {
    organization.value = org
    if (localStorage.getItem('annotation_auth_org')) {
      localStorage.setItem('annotation_auth_org', JSON.stringify(org))
    } else {
      sessionStorage.setItem('annotation_auth_org', JSON.stringify(org))
    }
    window.dispatchEvent(new CustomEvent('app:organization-changed', { detail: org }))
  }

  return {
    token,
    user,
    organization,
    permissions,
    isAuthenticated,
    currentRole,
    isSuperAdmin,
    isProjectManager,
    isReviewer,
    hasPermission,
    login,
    logout,
    setOrganization,
    fetchCurrentUser,
    updateProfile,
    uploadAvatar,
    deleteAvatar,
    updatePassword,
  }
})
