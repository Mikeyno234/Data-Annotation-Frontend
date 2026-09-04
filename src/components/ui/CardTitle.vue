<script setup lang="ts">
import { cn } from '@/utils/cn'

interface Props {
  className?: string
}

defineProps<Props>()
</script>

<template>
  <h3 :class="cn('font-semibold leading-none tracking-tight text-lg text-foreground', className)">
    <slot />
  </h3>
</template>
