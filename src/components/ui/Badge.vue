<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '@/lib/utils'

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
  const base = 'inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium transition-all focus:outline-none select-none tracking-tight'

  const variants = {
    default: 'bg-primary/10 text-primary border border-primary/20',
    secondary: 'bg-muted text-muted-foreground border border-border/60',
    outline: 'bg-transparent text-foreground border border-border',
    destructive: 'bg-destructive/10 text-destructive border border-destructive/20',
    success: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
    warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20',
    info: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20',
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
