<script setup lang="ts">
import { toasts } from '@/utils/toast'
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-vue-next'

function remove(id: string) {
  toasts.value = toasts.value.filter((t) => t.id !== id)
}
</script>

<template>
  <div class="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none p-4">
    <TransitionGroup
      enter-active-class="transform ease-out duration-300 transition"
      enter-from-class="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2"
      enter-to-class="translate-y-0 opacity-100 sm:translate-x-0"
      leave-active-class="transition ease-in duration-100"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-for="item in toasts"
        :key="item.id"
        class="pointer-events-auto flex items-start justify-between gap-3 rounded-lg border p-4 shadow-xl backdrop-blur-md transition-all"
        :class="{
          'border-success/40 bg-success-soft text-foreground': item.type === 'success',
          'border-destructive/40 bg-destructive/10 text-foreground': item.type === 'error',
          'border-warning/40 bg-warning-soft text-foreground': item.type === 'warning',
          'border-info/40 bg-info-soft text-foreground': item.type === 'info',
        }"
      >
        <div class="flex items-start gap-3">
          <CheckCircle2 v-if="item.type === 'success'" class="size-5 text-success shrink-0 mt-0.5" />
          <AlertCircle v-else-if="item.type === 'error'" class="size-5 text-destructive shrink-0 mt-0.5" />
          <AlertTriangle v-else-if="item.type === 'warning'" class="size-5 text-warning shrink-0 mt-0.5" />
          <Info v-else class="size-5 text-info shrink-0 mt-0.5" />

          <div>
            <div class="text-sm font-semibold">{{ item.title }}</div>
            <div v-if="item.description" class="text-xs opacity-80 mt-0.5">{{ item.description }}</div>
          </div>
        </div>

        <button
          class="rounded-md p-1 opacity-70 hover:opacity-100 transition-opacity cursor-pointer"
          @click="remove(item.id)"
        >
          <X class="size-4" />
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>
