<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { adminApi } from '@/api/admin'
import type { Menu } from '@/types'
import {
  LayoutDashboard,
  FolderKanban,
  FileCheck2,
  CheckCircle2,
  Users,
  ShieldAlert,
  ListTree,
  Layers,
  ChevronRight,
  ClipboardList,
  Settings2,
} from 'lucide-vue-next'

export interface NavigationNode {
  id: number
  code: string
  name: string
  path: string
  icon: any
  group: string
  children: NavigationNode[]
  permission?: string | null
}

const route = useRoute()
const authStore = useAuthStore()

const iconMap: Record<string, any> = {
  LayoutDashboard,
  FolderKanban,
  ClipboardList,
  FileCheck2,
  CheckCircle2,
  Users,
  ShieldAlert,
  ListTree,
  Layers,
  Settings2,
  folder: FolderKanban,
  'pen-tool': ClipboardList,
  'check-square': FileCheck2,
  'shield-check': CheckCircle2,
  settings: Settings2,
}

function resolveIcon(iconName?: string) {
  if (!iconName) return Layers
  return iconMap[iconName] || iconMap[iconName.toLowerCase()] || Layers
}

const dbMenus = ref<Menu[]>([])
const isMenusLoading = ref(true)

async function fetchDynamicMenus() {
  try {
    const roleId = authStore.user?.role_id || 0
    const res: any = await adminApi.getMenus(roleId)
    const raw = res?.data !== undefined ? res.data : res
    dbMenus.value = Array.isArray(raw) ? raw : []
  } catch {
    // Graceful fallback
  } finally {
    isMenusLoading.value = false
  }
}

watch(() => authStore.user?.role_id, () => fetchDynamicMenus())

function handleMenusUpdated() {
  fetchDynamicMenus()
}

onMounted(() => {
  fetchDynamicMenus()
  window.addEventListener('app:menus-updated', handleMenusUpdated)
})

onBeforeUnmount(() => {
  window.removeEventListener('app:menus-updated', handleMenusUpdated)
})

const dynamicTree = computed<NavigationNode[]>(() => {
  if (dbMenus.value.length === 0) {
    const fallbackWorkspace: NavigationNode[] = [
      { id: 1, code: 'DASHBOARD', name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, group: 'Workspace', children: [] },
    ]
    if (authStore.hasPermission('project.view')) {
      fallbackWorkspace.push({ id: 2, code: 'PROJECTS', name: 'Projects', path: '/projects', icon: FolderKanban, group: 'Workspace', children: [] })
    }
    if (authStore.hasPermission('annotation.view') && authStore.currentRole === 'Annotator') {
      fallbackWorkspace.push({ id: 3, code: 'MY_TASKS', name: 'My Tasks', path: '/my-tasks', icon: ClipboardList, group: 'Workspace', children: [] })
    }
    if (authStore.hasPermission('review.view')) {
      fallbackWorkspace.push({ id: 4, code: 'REVIEWS', name: 'Reviews', path: '/reviews', icon: FileCheck2, group: 'Workspace', children: [] })
    }
    if (authStore.hasPermission('qa.view')) {
      fallbackWorkspace.push({ id: 5, code: 'QA', name: 'Quality', path: '/qa', icon: CheckCircle2, group: 'Workspace', children: [] })
    }

    const fallbackAdminChildren: NavigationNode[] = []
    if (authStore.hasPermission('user.view')) {
      fallbackAdminChildren.push({ id: 7, code: 'USERS', name: 'Users', path: '/admin/users', icon: Users, group: 'Administration', children: [] })
    }
    if (authStore.hasPermission('role.update')) {
      fallbackAdminChildren.push({ id: 8, code: 'ROLES', name: 'Roles & Permissions', path: '/admin/roles', icon: ShieldAlert, group: 'Administration', children: [] })
      fallbackAdminChildren.push({ id: 9, code: 'MENUS', name: 'Menu Configuration', path: '/admin/menus', icon: ListTree, group: 'Administration', children: [] })
    }
    if (authStore.isSuperAdmin || authStore.isProjectManager || authStore.hasPermission('role.update')) {
      fallbackAdminChildren.push({ id: 10, code: 'TASK_CATALOG', name: 'Task Catalog', path: '/admin/annotation-types', icon: Layers, group: 'Administration', children: [] })
    }
    if (authStore.hasPermission('audit.view')) {
      fallbackAdminChildren.push({ id: 11, code: 'AUDIT_LOGS', name: 'Audit Trail', path: '/admin/audit-logs', icon: ShieldAlert, group: 'Administration', children: [] })
    }

    const res = [...fallbackWorkspace]
    if (fallbackAdminChildren.length > 0) {
      res.push({
        id: 6,
        code: 'ADMIN',
        name: 'Administration',
        path: '/admin',
        icon: ShieldAlert,
        group: 'Administration',
        children: fallbackAdminChildren,
      })
    }
    return res
  }

  const roots = dbMenus.value.filter((m) => !m.parent_id)
  const isMenuAllowed = (m: Menu): boolean => {
    if (m.is_active === false) return false
    if (!m.levels || m.levels.length === 0) return true
    return m.levels.some((lvl) => lvl.is_active)
  }

  const nodes: NavigationNode[] = []

  roots.forEach((root) => {
    const rawChildren = dbMenus.value.filter((m) => m.parent_id === root.id)
    const allowedChildren: NavigationNode[] = rawChildren
      .filter((c) => isMenuAllowed(c))
      .map((c) => ({
        id: c.id,
        code: c.code,
        name: c.name,
        path: c.path,
        icon: resolveIcon(c.icon),
        group: root.name,
        children: [],
      }))

    if (root.code.toUpperCase() === 'WORKSPACE') {
      allowedChildren.forEach((child) => {
        nodes.push({ ...child, group: 'Workspace', children: [] })
      })
    } else if (rawChildren.length > 0) {
      if (allowedChildren.length > 0) {
        nodes.push({
          id: root.id,
          code: root.code,
          name: root.name,
          path: root.path || '',
          icon: resolveIcon(root.icon),
          group: root.name,
          children: allowedChildren,
        })
      }
    } else {
      if (isMenuAllowed(root)) {
        nodes.push({
          id: root.id,
          code: root.code,
          name: root.name,
          path: root.path,
          icon: resolveIcon(root.icon),
          group: 'Workspace',
          children: [],
        })
      }
    }
  })

  return nodes
})

function isNodeActive(node: NavigationNode): boolean {
  if (node.path === '/dashboard') {
    return route.path === '/dashboard' || route.path === '/'
  }
  if (!node.path) return false
  return route.path === node.path || route.path.startsWith(node.path + '/')
}
</script>

<template>
  <div class="flex-1 min-h-0 overflow-y-auto px-3 py-3 font-sans">
    <nav class="space-y-4">
      <!-- Standalone Workspace Items -->
      <div v-if="dynamicTree.filter((n) => n.children.length === 0).length > 0">
        <div class="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-wider text-sidebar-muted/80">
          Workspace
        </div>
        <RouterLink
          v-for="item in dynamicTree.filter((n) => n.children.length === 0)"
          :key="item.id"
          :to="item.path"
          class="mb-1 flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition-all group"
          :class="[
            isNodeActive(item)
              ? 'bg-sidebar-accent text-sidebar-foreground font-semibold shadow-xs'
              : 'text-sidebar-muted hover:bg-sidebar-accent/60 hover:text-sidebar-foreground',
          ]"
        >
          <div class="flex items-center gap-2.5 min-w-0">
            <component
              :is="item.icon"
              class="size-4 shrink-0 transition-colors"
              :class="isNodeActive(item) ? 'text-primary' : 'text-sidebar-muted group-hover:text-sidebar-foreground'"
            />
            <span class="truncate">{{ item.name }}</span>
          </div>
          <ChevronRight v-if="isNodeActive(item)" class="size-3 text-primary shrink-0 opacity-80" />
        </RouterLink>
      </div>

      <!-- Hierarchical Parent Items with Submenus -->
      <div v-for="parent in dynamicTree.filter((n) => n.children.length > 0)" :key="parent.id">
        <div class="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-wider text-sidebar-muted/80">
          {{ parent.name }}
        </div>

        <div class="space-y-1">
          <RouterLink
            v-for="child in parent.children"
            :key="child.id"
            :to="child.path"
            class="flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition-all group"
            :class="[
              isNodeActive(child)
                ? 'bg-sidebar-accent text-sidebar-foreground font-semibold shadow-xs'
                : 'text-sidebar-muted hover:bg-sidebar-accent/60 hover:text-sidebar-foreground',
            ]"
          >
            <div class="flex items-center gap-2.5 min-w-0">
              <component
                :is="child.icon"
                class="size-4 shrink-0 transition-colors"
                :class="isNodeActive(child) ? 'text-primary' : 'text-sidebar-muted group-hover:text-sidebar-foreground'"
              />
              <span class="truncate">{{ child.name }}</span>
            </div>
            <ChevronRight v-if="isNodeActive(child)" class="size-3 text-primary shrink-0 opacity-80" />
          </RouterLink>
        </div>
      </div>
    </nav>
  </div>
</template>
