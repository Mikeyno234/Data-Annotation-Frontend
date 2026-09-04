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
    workspace: 'Annotation Workspace',
    reviews: 'Review Queue',
    qa: 'Quality Assurance',
    'admin-users': 'Users & Roles',
    'admin-menus': 'Menus & Navigation',
    'admin-audit-logs': 'Audit Trail',
    profile: 'Profile & Settings',
  }
  return titles[String(route.name)] || 'Annotation Operations'
})
</script>

<template>
  <header class="sticky top-0 z-40 flex h-16 w-full shrink-0 items-center justify-between border-b border-border/40 bg-card/85 px-5 md:px-8 backdrop-blur-md transition-all shadow-2xs">
    <div class="flex items-center gap-3">
      <div class="flex items-center gap-2 text-xs text-muted-foreground">
        <span class="hidden sm:inline font-medium">Operations</span>
        <span class="text-muted-foreground/30 font-mono text-[11px]">/</span>
        <span class="font-semibold text-foreground tracking-tight">{{ pageTitle }}</span>
      </div>

      <div v-if="authStore.organization" class="hidden lg:flex items-center gap-2 pl-3 text-xs text-muted-foreground border-l border-border/40 ml-2">
        <Building2 class="size-3.5 text-primary" />
        <span class="font-medium text-foreground">{{ authStore.organization.name }}</span>
      </div>
    </div>

    <div class="flex items-center gap-3">
      <button
        type="button"
        class="btn-tactile flex size-9 items-center justify-center rounded-xl border border-border/50 bg-muted/40 text-muted-foreground transition-all hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 cursor-pointer shadow-2xs"
        :aria-label="theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'"
        @click="toggleTheme"
      >
        <Sun v-if="theme === 'dark'" class="size-4 text-amber-400" />
        <Moon v-else class="size-4 text-slate-700" />
      </button>
    </div>
  </header>
</template>
