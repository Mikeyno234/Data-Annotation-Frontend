<script setup lang="ts">
import { cn } from '@/lib/utils'

interface Props {
  className?: string
}

defineProps<Props>()
</script>

<template>
  <div :class="cn('relative flex flex-col rounded-2xl border border-border/70 bg-card text-card-foreground shadow-xs transition-all duration-150', className)">
    <slot />
  </div>
</template>
