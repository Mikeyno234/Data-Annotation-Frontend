<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '@/utils/cn'

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
  const base = 'btn-tactile inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:pointer-events-none disabled:opacity-45 select-none cursor-pointer tracking-tight'

  const variants = {
    default: 'bg-primary text-primary-foreground border border-primary/30 shadow-xs shadow-primary/25 hover:bg-primary/95 hover:shadow-sm hover:shadow-primary/30',
    secondary: 'bg-muted/70 text-secondary-foreground border border-border/50 hover:bg-muted hover:text-foreground shadow-2xs',
    outline: 'border border-border/70 bg-card/70 text-foreground hover:bg-muted/80 hover:border-border shadow-2xs',
    ghost: 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
    destructive: 'bg-destructive text-destructive-foreground border border-destructive/30 shadow-xs hover:bg-destructive/90',
    link: 'text-primary underline-offset-4 hover:underline',
  }

  const sizes = {
    default: 'h-10 px-4 py-2',
    sm: 'h-8 rounded-lg px-3 text-xs',
    lg: 'h-11 rounded-2xl px-6 text-base',
    icon: 'size-10 p-0',
  }

  return cn(base, variants[props.variant], sizes[props.size], props.className)
})
</script>

<template>
  <button :type="type" :disabled="disabled" :class="buttonClasses">
    <slot />
  </button>
</template>
