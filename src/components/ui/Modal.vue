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
    <Transition name="modal">
      <div
        v-if="open"
        class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-3 backdrop-blur-md sm:items-center sm:p-6"
        role="presentation"
        @click.self="emit('close')"
      >
        <div
          :class="cn('relative my-auto flex max-h-[calc(100vh-1.5rem)] w-full flex-col overflow-hidden rounded-xl border border-border bg-card shadow-lg sm:max-h-[calc(100vh-3rem)]', maxWidth)"
          role="dialog"
          aria-modal="true"
          :aria-label="title || 'Dialog'"
        >
          <div class="flex shrink-0 items-start justify-between gap-4 border-b border-border/60 bg-card px-5 py-4">
            <div class="min-w-0">
              <h3 v-if="title" class="text-base font-semibold tracking-tight text-foreground">{{ title }}</h3>
              <p v-if="description" class="mt-0.5 text-xs text-muted-foreground">{{ description }}</p>
            </div>
            <button
              class="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-foreground/20 cursor-pointer"
              aria-label="Close dialog"
              @click="emit('close')"
            >
              <X class="size-4" :stroke-width="1.6" />
            </button>
          </div>

          <div class="min-h-0 overflow-y-auto px-6 py-4">
            <slot />
          </div>

          <div v-if="$slots.footer" class="flex shrink-0 items-center justify-end gap-3 bg-muted/30 px-6 py-4">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
