<script setup lang="ts">
import { cn } from '@/lib/utils'

interface Props {
  modelValue?: string | number
  type?: string
  placeholder?: string
  disabled?: boolean
  className?: string
}

withDefaults(defineProps<Props>(), {
  modelValue: '',
  type: 'text',
  placeholder: '',
  disabled: false,
  className: '',
})

defineEmits<{
  'update:modelValue': [value: string | number]
}>()
</script>

<template>
  <input
    :type="type"
    :value="modelValue"
    :placeholder="placeholder"
    :disabled="disabled"
    :class="
      cn(
        'flex h-9 w-full rounded-lg border border-border bg-card px-3 py-1.5 text-xs transition-all file:border-0 file:bg-transparent file:text-xs file:font-medium placeholder:text-muted-foreground/50 focus-visible:border-foreground/40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-foreground/15 disabled:cursor-not-allowed disabled:opacity-40 text-foreground',
        className
      )
    "
    @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
  />
</template>
