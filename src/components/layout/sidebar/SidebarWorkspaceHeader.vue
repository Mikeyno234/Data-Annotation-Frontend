<script setup lang="ts">
import { Layers } from 'lucide-vue-next'
</script>

<template>
  <div class="border-b border-sidebar-border px-4 py-3.5 flex items-center justify-between select-none">
    <div class="flex items-center gap-2.5 min-w-0">
      <!-- Minimalist Brand Logo Glyph -->
      <div class="flex size-6 items-center justify-center rounded-md bg-sidebar-primary/15 text-sidebar-primary border border-sidebar-primary/25 shrink-0">
        <Layers class="size-3.5" :stroke-width="1.6" />
      </div>

      <!-- Static Application Brand Name -->
      <div class="flex items-center gap-1.5 min-w-0">
        <span class="truncate text-xs font-semibold tracking-tight text-sidebar-foreground">
          Data Annotation
        </span>
        <span class="text-[9px] font-mono px-1 py-0.2 rounded bg-sidebar-accent text-sidebar-muted-foreground border border-sidebar-border">
          AI
        </span>
      </div>
    </div>
  </div>
</template>
