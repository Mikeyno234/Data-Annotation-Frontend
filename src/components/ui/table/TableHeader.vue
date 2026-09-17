<script setup lang="ts">
import { cn } from '@/lib/utils'

const props = defineProps<{
  class?: string
}>()
</script>

<template>
  <thead :class="cn('[&_tr]:border-b [&_tr]:border-border/60 bg-muted/30', props.class)">
    <slot />
  </thead>
</template>
