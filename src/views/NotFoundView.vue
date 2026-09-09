<script setup lang="ts">
import { useRouter } from 'vue-router'
import Button from '@/components/ui/Button.vue'
import { FileQuestion, ArrowLeft, Home } from 'lucide-vue-next'

const router = useRouter()
</script>

<template>
  <div class="min-h-screen w-full flex items-center justify-center p-6 bg-background relative overflow-hidden font-sans">
    <!-- Ambient glow backdrops -->
    <div class="absolute -top-32 -left-32 size-96 rounded-full bg-primary/10 blur-[120px] pointer-events-none"></div>
    <div class="absolute -bottom-32 -right-32 size-96 rounded-full bg-orange-500/10 blur-[120px] pointer-events-none"></div>

    <div class="relative z-10 max-w-md w-full text-center flex flex-col items-center">
      <!-- 404 Visual Indicator -->
      <div class="relative size-24 flex items-center justify-center rounded-3xl bg-muted/80 border border-border/80 shadow-inner mb-6">
        <FileQuestion class="size-12 text-muted-foreground animate-pulse" />
        <span class="absolute -bottom-2.5 -right-2.5 px-2.5 py-0.5 rounded-full bg-primary text-primary-foreground text-xs font-mono font-bold shadow-sm">
          404
        </span>
      </div>

      <h1 class="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl mb-3">
        Page not found
      </h1>

      <p class="text-sm text-muted-foreground leading-relaxed max-w-sm mb-8">
        The destination you are looking for does not exist, has been removed, or the link may be broken.
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
