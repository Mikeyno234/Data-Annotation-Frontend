import { ref, computed } from 'vue'
import { adminApi } from '@/api/admin'
import type { Role, Permission, Menu, Organization } from '@/types'
import { useAuthStore } from '@/stores/auth'
import { toast } from '@/utils/toast'
import type { MenuGroup } from '@/components/admin/roles/PermissionMatrix.vue'

export function useRoleManagement() {
  const authStore = useAuthStore()
  const roles = ref<Role[]>([])
  const organizations = ref<Organization[]>([])
  const permissions = ref<Permission[]>([])
  const menus = ref<Menu[]>([])
  const isLoading = ref(true)

  const selectedRoleId = ref<number | null>(null)
  const autoSaveStatus = ref<'idle' | 'saving' | 'saved' | 'error'>('idle')
  let autoSaveTimer: any = null

  const selectedOrgFilter = ref<'ALL' | number>('ALL')
  const roleSearchQuery = ref('')

  const showRoleModal = ref(false)
  const editingRoleId = ref<number | null>(null)
  const roleForm = ref({ name: '', description: '', organization_id: null as number | null })
  const isSavingRole = ref(false)

  const organizationList = computed(() => {
    if (organizations.value.length > 0) return organizations.value
    const map = new Map<number, { id: number; name: string }>()
    if (authStore.organization?.id && authStore.organization?.name) {
      map.set(authStore.organization.id, { id: authStore.organization.id, name: authStore.organization.name })
    }
    for (const r of roles.value) {
      if (r.organization_id && r.organization?.name) {
        map.set(r.organization_id, { id: r.organization_id, name: r.organization.name })
      }
    }
    return Array.from(map.values())
  })

  const filteredRoles = computed(() => {
    return roles.value.filter((r) => {
      if (typeof selectedOrgFilter.value === 'number' && r.organization_id !== selectedOrgFilter.value) return false
      if (roleSearchQuery.value.trim()) {
        const q = roleSearchQuery.value.toLowerCase()
        const matchesName = r.name.toLowerCase().includes(q)
        const matchesDesc = (r.description || '').toLowerCase().includes(q)
        const matchesOrg = (r.organization?.name || '').toLowerCase().includes(q)
        if (!matchesName && !matchesDesc && !matchesOrg) return false
      }
      return true
    })
  })

  const selectedRole = computed(() => roles.value.find((r) => r.id === selectedRoleId.value))
  const isSelectedRoleSuperAdmin = computed(() => selectedRole.value?.name === 'Super Admin' || selectedRole.value?.id === 1)

  const menuGroups = computed<MenuGroup[]>(() => {
    const roots = menus.value.filter((m) => !m.parent_id)
    const result: MenuGroup[] = []

    roots.forEach((root) => {
      const children = menus.value.filter((m) => m.parent_id === root.id)
      if (children.length > 0) {
        result.push({ id: root.id, name: root.name, code: root.code, icon: root.icon, submenus: children })
      } else if (root.levels && root.levels.length > 0) {
        result.push({ id: root.id, name: root.name, code: root.code, icon: root.icon, submenus: [root] })
      }
    })

    const assignedIds = new Set(result.flatMap((g) => g.submenus.map((s) => s.id)))
    const orphans = menus.value.filter((m) => !assignedIds.has(m.id) && m.levels && m.levels.length > 0)
    if (orphans.length > 0) {
      result.push({ id: 9999, name: 'Other Modules', code: 'OTHER', submenus: orphans })
    }
    return result
  })

  function setOrgFilter(orgId: 'ALL' | number) {
    selectedOrgFilter.value = orgId
    const available = filteredRoles.value
    if (available.length > 0) selectRole(available[0].id)
  }

  async function fetchRolesData() {
    isLoading.value = true
    try {
      const [rolesRes, permsRes, orgsRes]: any = await Promise.allSettled([
        adminApi.getRoles(),
        adminApi.getPermissions(),
        adminApi.getOrganizations(),
      ])

      if (orgsRes.status === 'fulfilled' && orgsRes.value) {
        const rawOrgs = orgsRes.value.data !== undefined ? orgsRes.value.data : orgsRes.value
        organizations.value = Array.isArray(rawOrgs) ? rawOrgs : []
      }
      if (rolesRes.status === 'fulfilled' && rolesRes.value) {
        const rawRoles = rolesRes.value.data !== undefined ? rolesRes.value.data : rolesRes.value
        roles.value = Array.isArray(rawRoles) ? rawRoles : []
        const available = filteredRoles.value
        const targetId = selectedRoleId.value && roles.value.some((r) => r.id === selectedRoleId.value)
          ? selectedRoleId.value
          : available.length > 0
            ? available[0].id
            : roles.value.length > 0
              ? roles.value[0].id
              : null
        if (targetId) await selectRole(targetId)
      }
      if (permsRes.status === 'fulfilled' && permsRes.value) {
        const rawPerms = permsRes.value.data !== undefined ? permsRes.value.data : permsRes.value
        permissions.value = Array.isArray(rawPerms) ? rawPerms : []
      }
    } catch (err: any) {
      toast.error('Failed to load roles & permissions', err?.message)
    } finally {
      isLoading.value = false
    }
  }

  async function selectRole(roleId: number) {
    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer)
      autoSaveTimer = null
    }
    selectedRoleId.value = roleId
    try {
      const res: any = await adminApi.getMenus(roleId)
      const raw = res?.data !== undefined ? res.data : res
      const loadedMenus: Menu[] = Array.isArray(raw) ? raw : []

      const targetRole = roles.value.find((r) => r.id === roleId)
      if (targetRole?.name === 'Super Admin' || roleId === 1) {
        for (const m of loadedMenus) {
          m.is_active = true
          if (m.levels) for (const lvl of m.levels) lvl.is_active = true
        }
      }
      menus.value = loadedMenus
    } catch (err: any) {
      toast.error('Failed to load menu access for role', err?.message)
    }
  }

  function triggerAutoSave() {
    if (isSelectedRoleSuperAdmin.value) return
    autoSaveStatus.value = 'saving'
    if (autoSaveTimer) clearTimeout(autoSaveTimer)
    const targetRoleId = selectedRoleId.value
    if (!targetRoleId) return

    autoSaveTimer = setTimeout(async () => {
      if (selectedRoleId.value !== targetRoleId) return
      try {
        const activeIds = menus.value.flatMap((menu) =>
          (menu.levels || []).filter((level) => level.is_active).map((level) => level.id)
        )
        await adminApi.updateRoleMenuAccess(targetRoleId, activeIds)
        window.dispatchEvent(new CustomEvent('app:menus-updated'))
        autoSaveStatus.value = 'saved'
        setTimeout(() => {
          if (autoSaveStatus.value === 'saved') autoSaveStatus.value = 'idle'
        }, 2000)
      } catch (err: any) {
        autoSaveStatus.value = 'error'
        toast.error('Auto-save failed', err?.message)
      }
    }, 250)
  }

  function handleToggleGroup(group: MenuGroup, active: boolean) {
    if (isSelectedRoleSuperAdmin.value) return
    for (const submenu of group.submenus) {
      if (submenu.levels) for (const lvl of submenu.levels) lvl.is_active = active
    }
    triggerAutoSave()
  }

  function handleToggleMenuLevel(level: any) {
    if (isSelectedRoleSuperAdmin.value) return
    level.is_active = !level.is_active
    triggerAutoSave()
  }

  function openCreateRole() {
    editingRoleId.value = null
    const defaultOrgId = typeof selectedOrgFilter.value === 'number'
      ? selectedOrgFilter.value
      : (authStore.user?.organization_id || (organizationList.value.length > 0 ? organizationList.value[0].id : null))
    roleForm.value = { name: '', description: '', organization_id: defaultOrgId }
    showRoleModal.value = true
  }

  function openEditRole(role: Role) {
    editingRoleId.value = role.id
    roleForm.value = { name: role.name, description: role.description || '', organization_id: role.organization_id || null }
    showRoleModal.value = true
  }

  async function handleSaveRole() {
    if (!roleForm.value.name.trim()) {
      toast.error('Validation error', 'Role name is required')
      return
    }
    isSavingRole.value = true
    try {
      if (editingRoleId.value) {
        await adminApi.updateRole(editingRoleId.value, roleForm.value)
        toast.success('Role updated', `Updated role ${roleForm.value.name}`)
      } else {
        const res: any = await adminApi.createRole(roleForm.value)
        toast.success('Role created', `Created role ${roleForm.value.name}`)
        if (res?.data?.id) selectedRoleId.value = res.data.id
      }
      showRoleModal.value = false
      await fetchRolesData()
    } catch (err: any) {
      toast.error('Failed to save role', err?.message)
    } finally {
      isSavingRole.value = false
    }
  }

  async function handleDeleteRole(role: Role) {
    if (role.is_system) {
      toast.warning('Action forbidden', 'System roles cannot be deleted')
      return
    }
    if (!confirm(`Are you sure you want to delete role "${role.name}"?`)) return
    try {
      await adminApi.deleteRole(role.id)
      toast.success('Role deleted', `Removed role ${role.name}`)
      await fetchRolesData()
    } catch (err: any) {
      toast.error('Delete failed', err?.message)
    }
  }

  return {
    roles,
    organizations,
    permissions,
    menus,
    isLoading,
    selectedRoleId,
    autoSaveStatus,
    selectedOrgFilter,
    roleSearchQuery,
    showRoleModal,
    editingRoleId,
    roleForm,
    isSavingRole,
    organizationList,
    filteredRoles,
    selectedRole,
    isSelectedRoleSuperAdmin,
    menuGroups,
    setOrgFilter,
    fetchRolesData,
    selectRole,
    handleToggleGroup,
    handleToggleMenuLevel,
    openCreateRole,
    openEditRole,
    handleSaveRole,
    handleDeleteRole,
  }
}
