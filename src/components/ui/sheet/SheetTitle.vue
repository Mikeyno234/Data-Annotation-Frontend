<script setup lang="ts">
import { computed } from 'vue'
import { DialogTitle, type DialogTitleProps } from 'radix-vue'
import { cn } from '@/lib/utils'

interface Props extends DialogTitleProps {
  class?: string
}

const props = defineProps<Props>()

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props
  return delegated
})
</script>

<template>
  <DialogTitle
    v-bind="delegatedProps"
    :class="cn('text-base font-semibold text-foreground', props.class)"
  >
    <slot />
  </DialogTitle>
</template>
