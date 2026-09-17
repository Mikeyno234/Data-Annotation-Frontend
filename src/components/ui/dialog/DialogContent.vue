<script setup lang="ts">
import { computed } from 'vue'
import {
  DialogClose,
  DialogContent,
  type DialogContentEmits,
  type DialogContentProps,
  DialogOverlay,
  DialogPortal,
  useForwardPropsEmits,
} from 'radix-vue'
import { X } from 'lucide-vue-next'
import { cn } from '@/lib/utils'

interface Props extends DialogContentProps {
  class?: string
  portalDisabled?: boolean
}

const props = defineProps<Props>()
const emits = defineEmits<DialogContentEmits>()

const isTest = computed(() => {
  return props.portalDisabled || (typeof process !== 'undefined' && process.env?.NODE_ENV === 'test') || (import.meta as any).env?.MODE === 'test'
})

const delegatedProps = computed(() => {
  const { class: _, portalDisabled: __, ...delegated } = props
  return delegated
})

const forwarded = useForwardPropsEmits(delegatedProps, emits)
</script>

<template>
  <DialogPortal :disabled="isTest">
    <DialogOverlay
      class="fixed inset-0 z-50 bg-background/80 backdrop-blur-xs data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
    />
    <DialogContent
      v-bind="forwarded"
      :class="
        cn(
          'fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border border-border bg-card p-6 shadow-xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-xl',
          props.class,
        )
      "
    >
      <slot />

      <DialogClose
        class="absolute right-4 top-4 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none cursor-pointer"
        aria-label="Close"
      >
        <X class="size-4" :stroke-width="1.8" />
      </DialogClose>
    </DialogContent>
  </DialogPortal>
</template>
