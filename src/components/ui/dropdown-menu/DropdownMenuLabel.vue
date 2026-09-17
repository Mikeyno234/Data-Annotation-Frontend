<script setup lang="ts">
import { DropdownMenuLabel, type DropdownMenuLabelProps } from 'radix-vue'
import { cn } from '@/lib/utils'

interface Props extends DropdownMenuLabelProps {
  inset?: boolean
  class?: string
}

const props = defineProps<Props>()
</script>

<template>
  <DropdownMenuLabel
    :class="
      cn(
        'px-2 py-1.5 text-xs font-semibold text-foreground',
        props.inset && 'pl-8',
        props.class,
      )
    "
  >
    <slot />
  </DropdownMenuLabel>
</template>
