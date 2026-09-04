<script setup lang="ts">
import AppNavbar from './AppNavbar.vue'
import AppSidebar from './AppSidebar.vue'
import ToastContainer from '@/components/ui/ToastContainer.vue'
</script>

<template>
  <div class="h-screen w-screen overflow-hidden bg-background text-foreground flex flex-col relative selection:bg-primary/20 selection:text-primary">
    <div class="flex flex-1 min-h-0 overflow-hidden relative z-10">
      <AppSidebar />
      <div class="flex min-w-0 flex-1 flex-col overflow-hidden">
        <AppNavbar />
        <main class="flex-1 min-h-0 overflow-y-auto px-4 py-6 sm:px-6 sm:py-7 lg:px-8 lg:py-8">
          <slot />
        </main>
      </div>
    </div>
    <ToastContainer />
  </div>
</template>
