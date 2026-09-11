<script setup lang="ts">
import { useRouter } from 'vue-router'
import Button from '@/components/ui/Button.vue'
import { ShieldAlert, ArrowLeft, Home } from 'lucide-vue-next'

const router = useRouter()
</script>

<template>
  <div class="min-h-screen w-full flex items-center justify-center p-6 bg-background relative overflow-hidden font-sans select-none">
    <div class="relative z-10 max-w-sm w-full text-center flex flex-col items-center">
      <!-- 403 Visual Indicator -->
      <div class="size-16 flex items-center justify-center rounded-lg bg-card border border-destructive/30 shadow-2xs mb-4">
        <ShieldAlert class="size-8 text-destructive" :stroke-width="1.6" />
      </div>

      <div class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium text-destructive bg-destructive/10 border border-destructive/20 mb-2">
        Access Denied
      </div>

      <h1 class="text-xl font-semibold tracking-tight text-foreground mb-2">
        Access Restricted
      </h1>

      <p class="text-xs text-muted-foreground leading-relaxed max-w-xs mb-6">
        You do not have permission to access this resource. Please contact your workspace administrator if you need access.
      </p>

      <div class="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
        <Button
          variant="outline"
          size="sm"
          class="w-full sm:w-auto gap-1.5 text-xs font-medium"
          @click="router.back()"
        >
          <ArrowLeft class="size-3.5" :stroke-width="1.6" />
          <span>Go Back</span>
        </Button>
        <Button
          size="sm"
          class="w-full sm:w-auto gap-1.5 text-xs font-medium"
          @click="router.push('/dashboard')"
        >
          <Home class="size-3.5" :stroke-width="1.6" />
          <span>Dashboard</span>
        </Button>
      </div>
    </div>
  </div>
</template>
