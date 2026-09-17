<script setup lang="ts">
import { X } from 'lucide-vue-next'
import { cn } from '@/lib/utils'

interface Props {
  open: boolean
  title?: string
  description?: string
  maxWidth?: string
}

withDefaults(defineProps<Props>(), {
  open: false,
  title: '',
  description: '',
  maxWidth: 'max-w-lg',
})

const emit = defineEmits<{
  close: []
}>()
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="open"
        class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-background/80 p-3 backdrop-blur-xs sm:items-center sm:p-6"
        role="presentation"
        @click.self="emit('close')"
      >
        <div
          :class="cn('relative my-auto flex max-h-[calc(100vh-1.5rem)] w-full flex-col overflow-hidden rounded-xl border border-border bg-card shadow-xl sm:max-h-[calc(100vh-3rem)] text-card-foreground', maxWidth)"
          role="dialog"
          aria-modal="true"
          :aria-label="title || 'Dialog'"
          @keydown.esc="emit('close')"
        >
          <div v-if="title || description" class="flex shrink-0 items-start justify-between gap-4 border-b border-border/60 bg-card px-4 sm:px-5 py-3.5 sm:py-4">
            <div class="min-w-0 pr-2">
              <h3 v-if="title" class="text-sm sm:text-base font-semibold tracking-tight text-foreground">{{ title }}</h3>
              <p v-if="description" class="mt-0.5 text-xs text-muted-foreground">{{ description }}</p>
            </div>
            <button
              type="button"
              class="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
              aria-label="Close dialog"
              @click="emit('close')"
            >
              <X class="size-4" :stroke-width="1.8" />
            </button>
          </div>

          <div class="min-h-0 overflow-y-auto px-4 sm:px-6 py-4">
            <slot />
          </div>

          <div v-if="$slots.footer" class="flex shrink-0 items-center justify-end gap-3 bg-muted/20 border-t border-border/60 px-4 sm:px-6 py-3 sm:py-4">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
