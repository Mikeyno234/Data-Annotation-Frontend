<script setup lang="ts">
import { cn } from '@/lib/utils'

interface Props {
  className?: string
}

defineProps<Props>()
</script>

<template>
  <div :class="cn('p-0', className)">
    <slot />
  </div>
</template>
