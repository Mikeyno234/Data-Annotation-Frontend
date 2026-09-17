<script setup lang="ts">
import { computed } from 'vue'
import {
  TooltipContent,
  type TooltipContentEmits,
  type TooltipContentProps,
  TooltipPortal,
  useForwardPropsEmits,
} from 'radix-vue'
import { cn } from '@/lib/utils'

interface Props extends TooltipContentProps {
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  sideOffset: 4,
})
const emits = defineEmits<TooltipContentEmits>()

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props
  return delegated
})

const forwarded = useForwardPropsEmits(delegatedProps, emits)
</script>

<template>
  <TooltipPortal>
    <TooltipContent
      v-bind="forwarded"
      :class="
        cn(
          'z-50 overflow-hidden rounded-md bg-foreground px-2.5 py-1 text-[11px] font-medium text-background shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-1 data-[side=left]:slide-in-from-right-1 data-[side=right]:slide-in-from-left-1 data-[side=top]:slide-in-from-bottom-1',
          props.class,
        )
      "
    >
      <slot />
    </TooltipContent>
  </TooltipPortal>
</template>
