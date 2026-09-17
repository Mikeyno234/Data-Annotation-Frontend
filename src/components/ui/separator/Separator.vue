<script setup lang="ts">
import { computed } from 'vue'
import { Separator, type SeparatorProps } from 'radix-vue'
import { cn } from '@/lib/utils'

interface Props extends SeparatorProps {
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  orientation: 'horizontal',
  decorative: true,
})

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props
  return delegated
})
</script>

<template>
  <Separator
    v-bind="delegatedProps"
    :class="
      cn(
        'shrink-0 bg-border',
        props.orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px',
        props.class,
      )
    "
  />
</template>
