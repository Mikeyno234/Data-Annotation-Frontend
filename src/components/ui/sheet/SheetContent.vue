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
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const sheetVariants = cva(
  'fixed z-50 gap-4 bg-card p-6 shadow-xl transition ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:duration-200 data-[state=open]:duration-300',
  {
    variants: {
      side: {
        top: 'inset-x-0 top-0 border-b border-border data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top',
        bottom: 'inset-x-0 bottom-0 border-t border-border data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom',
        left: 'inset-y-0 left-0 h-full w-3/4 border-r border-border data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-sm',
        right: 'inset-y-0 right-0 h-full w-full border-l border-border data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-lg',
      },
    },
    defaultVariants: {
      side: 'right',
    },
  },
)

interface Props extends DialogContentProps {
  side?: VariantProps<typeof sheetVariants>['side']
  class?: string
  portalDisabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  side: 'right',
})

const emits = defineEmits<DialogContentEmits>()

const isTest = computed(() => {
  return props.portalDisabled || (typeof process !== 'undefined' && process.env?.NODE_ENV === 'test') || (import.meta as any).env?.MODE === 'test'
})

const delegatedProps = computed(() => {
  const { class: _, side: __, portalDisabled: ___, ...delegated } = props
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
      :class="cn(sheetVariants({ side }), props.class)"
      v-bind="forwarded"
    >
      <slot />

      <DialogClose
        class="absolute right-4 top-4 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none cursor-pointer"
        aria-label="Close panel"
      >
        <X class="size-4" :stroke-width="1.8" />
      </DialogClose>
    </DialogContent>
  </DialogPortal>
</template>
