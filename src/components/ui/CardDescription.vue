<script setup lang="ts">
import { cn } from '@/utils/cn'

interface Props {
  className?: string
}

defineProps<Props>()
</script>

<template>
  <p :class="cn('text-sm text-muted-foreground', className)">
    <slot />
  </p>
</template>
