<script setup lang="ts">
import AppLogo from '@/components/ui/AppLogo.vue'
</script>

<template>
  <div class="border-b border-sidebar-border px-4 py-3.5 flex items-center justify-between select-none">
    <RouterLink to="/dashboard" class="flex items-center min-w-0">
      <AppLogo size="sm" :show-text="true" />
    </RouterLink>
  </div>
</template>
