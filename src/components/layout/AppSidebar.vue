<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import SidebarWorkspaceHeader from './sidebar/SidebarWorkspaceHeader.vue'
import SidebarNavList from './sidebar/SidebarNavList.vue'

const authStore = useAuthStore()
</script>

<template>
  <aside class="flex h-full w-[240px] shrink-0 flex-col overflow-hidden bg-sidebar text-sidebar-foreground border-r border-sidebar-border select-none max-md:hidden shadow-xs transition-colors duration-200">
    <SidebarWorkspaceHeader />
    <SidebarNavList />
  </aside>
</template>
