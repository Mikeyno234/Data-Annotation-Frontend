<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '@/utils/cn'

interface Props {
  variant?: 'default' | 'secondary' | 'outline' | 'destructive' | 'success' | 'warning' | 'info'
  dot?: boolean
  className?: string
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  dot: false,
  className: '',
})

const badgeClasses = computed(() => {
  const base = 'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold transition-all focus:outline-none select-none tracking-tight'

  const variants = {
    default: 'bg-primary text-primary-foreground border border-primary/20 shadow-2xs',
    secondary: 'bg-muted/80 text-muted-foreground border border-border/40',
    outline: 'bg-muted/30 text-foreground border border-border/60 shadow-2xs',
    destructive: 'bg-destructive/10 text-destructive border border-destructive/25 font-bold',
    success: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 font-bold',
    warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25 font-bold',
    info: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/25 font-bold',
  }

  return cn(base, variants[props.variant], props.className)
})
</script>

<template>
  <div :class="badgeClasses">
    <span v-if="dot" class="beacon-dot shrink-0" />
    <slot />
  </div>
</template>
