<script setup lang="ts">
import { computed } from 'vue'
import {
  DropdownMenuItem,
  type DropdownMenuItemEmits,
  type DropdownMenuItemProps,
  useForwardPropsEmits,
} from 'radix-vue'
import { cn } from '@/lib/utils'

interface Props extends DropdownMenuItemProps {
  inset?: boolean
  class?: string
}

const props = defineProps<Props>()
const emits = defineEmits<DropdownMenuItemEmits>()

const delegatedProps = computed(() => {
  const { class: _, inset: __, ...delegated } = props
  return delegated
})

const forwarded = useForwardPropsEmits(delegatedProps, emits)
</script>

<template>
  <DropdownMenuItem
    v-bind="forwarded"
    :class="
      cn(
        'relative flex cursor-pointer select-none items-center gap-2 rounded-md px-2.5 py-1.5 text-xs outline-none transition-colors focus:bg-muted focus:text-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        props.inset && 'pl-8',
        props.class,
      )
    "
  >
    <slot />
  </DropdownMenuItem>
</template>
