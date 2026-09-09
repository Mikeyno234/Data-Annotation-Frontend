<script setup lang="ts">
import { useRouter } from 'vue-router'
import Button from '@/components/ui/Button.vue'
import { ShieldAlert, ArrowLeft, Home } from 'lucide-vue-next'

const router = useRouter()
</script>

<template>
  <div class="min-h-screen w-full flex items-center justify-center p-6 bg-background relative overflow-hidden font-sans">
    <!-- Ambient glow backdrops -->
    <div class="absolute -top-32 -left-32 size-96 rounded-full bg-destructive/10 blur-[120px] pointer-events-none"></div>
    <div class="absolute -bottom-32 -right-32 size-96 rounded-full bg-amber-500/10 blur-[120px] pointer-events-none"></div>

    <div class="relative z-10 max-w-md w-full text-center flex flex-col items-center">
      <!-- 403 Visual Indicator -->
      <div class="relative size-24 flex items-center justify-center rounded-3xl bg-destructive/10 border border-destructive/20 shadow-inner mb-6">
        <ShieldAlert class="size-12 text-destructive" />
        <span class="absolute -bottom-2.5 -right-2.5 px-2.5 py-0.5 rounded-full bg-destructive text-destructive-foreground text-xs font-mono font-bold shadow-sm">
          403
        </span>
      </div>

      <h1 class="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl mb-3">
        Access Denied
      </h1>

      <p class="text-sm text-muted-foreground leading-relaxed max-w-sm mb-8">
        You don't have the necessary role or permission to access this resource. If you believe this is an error, please contact your workspace administrator.
      </p>

      <div class="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
        <Button
          variant="outline"
          class="w-full sm:w-auto gap-2 rounded-xl"
          @click="router.back()"
        >
          <ArrowLeft class="size-4" />
          <span>Go Back</span>
        </Button>
        <Button
          class="w-full sm:w-auto gap-2 rounded-xl shadow-md"
          @click="router.push('/dashboard')"
        >
          <Home class="size-4" />
          <span>Return to Dashboard</span>
        </Button>
      </div>
    </div>
  </div>
</template>
