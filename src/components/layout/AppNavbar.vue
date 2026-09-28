<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useTheme } from '@/stores/theme'
import {
  Search,
  Sun,
  Moon,
  Command,
} from 'lucide-vue-next'
import UserNavProfile from './UserNavProfile.vue'
import NotificationDropdown from './NotificationDropdown.vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const { theme, toggleTheme } = useTheme()

const searchQuery = ref('')

function handleSearchSubmit() {
  if (searchQuery.value.trim()) {
    router.push({ path: '/projects', query: { q: searchQuery.value.trim() } })
    searchQuery.value = ''
  }
}

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
  <header class="sticky top-0 z-40 flex h-16 w-full shrink-0 items-center justify-between border-b border-border/80 bg-card/85 px-4 md:px-6 backdrop-blur-md transition-all select-none">
    <!-- Left: Breadcrumb / Search Section (Berry Style) -->
    <div class="flex items-center gap-4 flex-1 max-w-xl">
      <!-- Breadcrumb indicator -->
      <div class="hidden sm:flex items-center gap-2 text-xs text-muted-foreground shrink-0">
        <span class="font-bold text-foreground tracking-tight text-xs">{{ pageTitle }}</span>
      </div>

      <!-- Berry Style Global Search Bar -->
      <form
        class="relative w-full max-w-md hidden md:flex items-center"
        @submit.prevent="handleSearchSubmit"
      >
        <div class="relative w-full">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" :stroke-width="1.6" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search pipelines, datasets, tasks..."
            class="w-full h-9 pl-9 pr-14 text-xs rounded-xl border border-border/80 bg-muted/40 hover:bg-muted/60 focus:bg-background text-foreground placeholder:text-muted-foreground/70 transition-all focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary/40"
          />
          <div class="absolute right-2 top-1/2 -translate-y-1/2 hidden lg:flex items-center gap-0.5 px-1.5 py-0.5 rounded border border-border bg-background text-[10px] text-muted-foreground font-mono">
            <Command class="size-2.5" />
            <span>K</span>
          </div>
        </div>
      </form>
    </div>

    <!-- Right Controls (Berry Topbar Icons & Profile Chip) -->
    <div class="flex items-center gap-2 sm:gap-3 shrink-0">
      <!-- Notification Flyout Dropdown (Berry / Facebook Style) -->
      <NotificationDropdown />

      <!-- Theme Switcher (Berry rounded chip) -->
      <button
        type="button"
        class="flex size-9 items-center justify-center rounded-xl border border-border/80 bg-muted/30 text-muted-foreground transition-all hover:bg-muted hover:text-foreground cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary shadow-2xs"
        :aria-label="theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'"
        @click="toggleTheme"
      >
        <Sun v-if="theme === 'dark'" class="size-4 text-foreground/80" :stroke-width="1.6" />
        <Moon v-else class="size-4 text-foreground/80" :stroke-width="1.6" />
      </button>

      <div class="h-5 w-px bg-border/60 mx-0.5" />

      <!-- Berry Style Profile Chip -->
      <UserNavProfile />
    </div>
  </header>
</template>
