<script setup lang="ts">
import { DropdownMenuSeparator, type DropdownMenuSeparatorProps } from 'radix-vue'
import { cn } from '@/lib/utils'

const props = defineProps<DropdownMenuSeparatorProps & { class?: string }>()
</script>

<template>
  <DropdownMenuSeparator :class="cn('-mx-1 my-1 h-px bg-border/60', props.class)" />
</template>
