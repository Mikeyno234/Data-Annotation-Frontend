<script setup lang="ts">
import { cn } from '@/lib/utils'

interface Props {
  className?: string
}

defineProps<Props>()
</script>

<template>
  <div :class="cn('card-depth rounded-lg bg-card text-card-foreground border border-border transition-all duration-150', className)">
    <slot />
  </div>
</template>
