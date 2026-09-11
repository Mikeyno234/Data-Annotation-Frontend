<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import { useRoute } from 'vue-router'
import { computed } from 'vue'
import { Building2, Sun, Moon } from 'lucide-vue-next'
import { useTheme } from '@/stores/theme'

const authStore = useAuthStore()
const route = useRoute()
const { theme, toggleTheme } = useTheme()

const pageTitle = computed(() => {
  const titles: Record<string, string> = {
    dashboard: 'Dashboard',
    projects: 'Projects',
    'project-detail': 'Project Details',
    workspace: 'Annotation Workspace',
    'my-tasks': 'My Tasks',
    reviews: 'Review Queue',
    qa: 'Quality Assurance',
    'admin-users': 'Users Directory',
    'admin-roles': 'Roles & Permissions',
    'admin-menus': 'Menu Configuration',
    'admin-annotation-types': 'Task Catalog',
    'admin-audit-logs': 'Audit Trail',
    profile: 'Profile & Settings',
    settings: 'Profile & Settings',
  }
  return titles[String(route.name)] || 'Annotation Operations'
})
</script>

<template>
  <header class="sticky top-0 z-40 flex h-14 w-full shrink-0 items-center justify-between border-b border-border bg-card/90 px-5 md:px-8 backdrop-blur-sm transition-all select-none">
    <div class="flex items-center gap-3">
      <div class="flex items-center gap-2 text-xs text-muted-foreground font-mono">
        <span class="hidden sm:inline font-medium text-muted-foreground/70">OPS</span>
        <span class="text-border">/</span>
        <span class="font-sans font-medium text-foreground tracking-tight">{{ pageTitle }}</span>
      </div>

      <div v-if="authStore.organization" class="hidden lg:flex items-center gap-2 pl-3 text-xs text-muted-foreground border-l border-border ml-2">
        <Building2 class="size-3.5 text-muted-foreground" :stroke-width="1.6" />
        <span class="font-medium text-foreground">{{ authStore.organization.name }}</span>
      </div>
    </div>

    <div class="flex items-center gap-3">
      <button
        type="button"
        class="btn-tactile flex size-8 items-center justify-center rounded-md border border-border bg-card text-muted-foreground transition-all hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-foreground/20 cursor-pointer shadow-2xs"
        :aria-label="theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'"
        @click="toggleTheme"
      >
        <Sun v-if="theme === 'dark'" class="size-3.5 text-foreground" :stroke-width="1.6" />
        <Moon v-else class="size-3.5 text-foreground" :stroke-width="1.6" />
      </button>
    </div>
  </header>
</template>
