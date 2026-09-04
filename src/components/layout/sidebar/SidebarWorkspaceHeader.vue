<script setup lang="ts">
import { Layers } from 'lucide-vue-next'
</script>

<template>
  <div class="border-b border-sidebar-border/60 px-4 py-3.5 flex items-center justify-between select-none">
    <div class="flex items-center gap-2.5 min-w-0">
      <!-- Minimalist Brand Logo Glyph -->
      <div class="flex size-6.5 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20 shadow-2xs shrink-0">
        <Layers class="size-3.5" />
      </div>

      <!-- Static Application Brand Name -->
      <div class="flex items-center gap-1.5 min-w-0">
        <span class="truncate text-xs font-bold tracking-tight text-sidebar-foreground">
          Data Annotation
        </span>
      </div>
    </div>
  </div>
</template>
