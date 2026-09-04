<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import SidebarWorkspaceHeader from './sidebar/SidebarWorkspaceHeader.vue'
import SidebarNavList from './sidebar/SidebarNavList.vue'
import SidebarUserFooter from './sidebar/SidebarUserFooter.vue'

const authStore = useAuthStore()
</script>

<template>
  <aside class="flex h-full w-[240px] shrink-0 flex-col overflow-hidden bg-sidebar text-sidebar-foreground select-none max-md:hidden shadow-lg shadow-black/10">
    <SidebarWorkspaceHeader />
    <SidebarNavList />
    <SidebarUserFooter />
  </aside>
</template>
