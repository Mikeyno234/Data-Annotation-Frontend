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
        'flex h-9 w-full rounded-xl border border-border/80 bg-card px-3.5 py-2 text-xs transition-all file:border-0 file:bg-transparent file:text-xs file:font-medium placeholder:text-muted-foreground/50 focus-visible:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-40 text-foreground shadow-2xs',
        className
      )
    "
    @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
  />
</template>
