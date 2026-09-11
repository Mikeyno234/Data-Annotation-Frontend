<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '@/lib/utils'

interface Props {
  variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
  className?: string
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  size: 'default',
  disabled: false,
  type: 'button',
  className: '',
})

const buttonClasses = computed(() => {
  const base = 'btn-tactile inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-foreground/20 disabled:pointer-events-none disabled:opacity-40 select-none cursor-pointer tracking-normal'

  const variants = {
    default: 'bg-primary text-primary-foreground border border-primary/40 hover:bg-primary/90 shadow-2xs',
    secondary: 'bg-muted/80 text-foreground border border-border/80 hover:bg-muted shadow-2xs',
    outline: 'border border-border bg-card text-foreground hover:bg-muted/60 shadow-2xs',
    ghost: 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
    destructive: 'bg-destructive text-destructive-foreground border border-destructive/40 hover:bg-destructive/90 shadow-2xs',
    link: 'text-primary underline-offset-4 hover:underline',
  }

  const sizes = {
    default: 'h-9 px-3.5 py-1.5',
    sm: 'h-7 rounded-md px-2.5 text-[11px]',
    lg: 'h-10 rounded-lg px-5 text-sm',
    icon: 'size-8.5 p-0 rounded-lg',
  }

  return cn(base, variants[props.variant], sizes[props.size], props.className)
})
</script>

<template>
  <button :type="type" :disabled="disabled" :class="buttonClasses">
    <slot />
  </button>
</template>
