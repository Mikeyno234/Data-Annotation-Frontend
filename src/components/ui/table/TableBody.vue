<script setup lang="ts">
import { cn } from '@/lib/utils'

const props = defineProps<{
  class?: string
}>()
</script>

<template>
  <tbody :class="cn('[&_tr:last-child]:border-0 divide-y divide-border/40', props.class)">
    <slot />
  </tbody>
</template>
