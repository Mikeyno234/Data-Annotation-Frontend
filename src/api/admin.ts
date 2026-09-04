import apiClient from './client'
import type { User, Role, Permission, AuditLog, AnalyticsOverview, Menu, Pagination, Organization } from '@/types'

export const adminApi = {
  getUsers(params?: {
    page?: number
    limit?: number
    search?: string
    role_id?: number
    status?: string
  }) {
    return apiClient.get<{ success: boolean; data: User[]; pagination: Pagination }>('/users', { params })
  },
  getRoles() {
    return apiClient.get<{ success: boolean; data: Role[] }>('/roles')
  },
  getOrganizations() {
    return apiClient.get<{ success: boolean; data: Organization[] }>('/organizations')
  },
  getPermissions() {
    return apiClient.get<{ success: boolean; data: Permission[] }>('/permissions')
  },
  createRole(payload: { name: string; description: string }) { return apiClient.post('/roles', payload) },
  updateRole(id: number, payload: { name: string; description: string }) { return apiClient.put(`/roles/${id}`, payload) },
  deleteRole(id: number) { return apiClient.delete(`/roles/${id}`) },
  updateUserAccess(id: number, payload: { role_id?: number; status?: string }) { return apiClient.put(`/users/${id}/access`, payload) },
  getMenus(roleId: number) {
    return apiClient.get<{ success: boolean; data: Menu[] }>('/menus', { params: { role_id: roleId } })
  },
  updateRoleMenuAccess(roleId: number, activeLevelIds: number[]) {
    return apiClient.put(`/roles/${roleId}/menu-access`, { active_level_ids: activeLevelIds })
  },
  createMenu(payload: any) { return apiClient.post('/menus', payload) },
  updateMenu(id: number, payload: any) { return apiClient.put(`/menus/${id}`, payload) },
  deleteMenu(id: number) { return apiClient.delete(`/menus/${id}`) },
  getAuditLogs(params?: {
    page?: number
    limit?: number
    search?: string
    action?: string
    status?: string
    user_id?: number
  }) {
    return apiClient.get<{ success: boolean; data: AuditLog[]; pagination: Pagination }>('/audit-logs', { params })
  },
  getAnalyticsOverview() {
    return apiClient.get<{ success: boolean; data: AnalyticsOverview }>('/analytics/overview')
  }
}
