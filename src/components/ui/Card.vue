<script setup lang="ts">
import { cn } from '@/utils/cn'

interface Props {
  className?: string
}

defineProps<Props>()
</script>

<template>
  <div :class="cn('card-depth rounded-2xl bg-card text-card-foreground border border-border/60 transition-all duration-200', className)">
    <slot />
  </div>
</template>
