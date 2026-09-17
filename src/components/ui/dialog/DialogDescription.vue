<script setup lang="ts">
import { computed } from 'vue'
import { DialogDescription, type DialogDescriptionProps } from 'radix-vue'
import { cn } from '@/lib/utils'

interface Props extends DialogDescriptionProps {
  class?: string
}

const props = defineProps<Props>()

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props
  return delegated
})
</script>

<template>
  <DialogDescription
    v-bind="delegatedProps"
    :class="cn('text-xs text-muted-foreground', props.class)"
  >
    <slot />
  </DialogDescription>
</template>
