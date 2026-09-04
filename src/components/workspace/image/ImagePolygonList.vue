<script setup lang="ts">
import type { ImagePolygon } from '@/types'
import Badge from '@/components/ui/Badge.vue'
import Button from '@/components/ui/Button.vue'
import { Trash2, Sparkles, Scissors } from 'lucide-vue-next'

defineProps<{
  polygons: ImagePolygon[]
  selectedPolygonId: string | null
  hasPrelabel?: boolean
}>()

const emit = defineEmits<{
  (e: 'select', id: string): void
  (e: 'delete', id: string): void
}>()
</script>

<template>
  <div class="flex flex-col gap-3">
    <div class="flex items-center justify-between">
      <h3 class="text-xs font-bold uppercase tracking-wider text-muted-foreground font-mono flex items-center gap-1.5">
        <Scissors class="size-3.5 text-primary" /> Polygons ({{ polygons.length }})
      </h3>
      <Badge v-if="hasPrelabel" variant="secondary" class="gap-1 text-[10px]">
        <Sparkles class="size-3 text-primary" /> Pre-annotated
      </Badge>
    </div>

    <div v-if="polygons.length === 0" class="text-xs text-muted-foreground/80 py-4 px-3 text-center border border-dashed border-border/60 rounded-xl bg-card/40">
      Click on canvas to place vertices. Press <kbd class="px-1 py-0.5 rounded bg-muted font-mono font-bold text-foreground">Enter</kbd> to close.
    </div>

    <div class="space-y-2.5">
      <div
        v-for="poly in polygons"
        :key="poly.id"
        class="flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer shadow-2xs"
        :class="[
          selectedPolygonId === poly.id
            ? 'bg-primary/10 border-primary/50 ring-2 ring-primary/25'
            : 'bg-card/95 border-border/60 hover:bg-card hover:border-border hover:shadow-xs',
        ]"
        @click="emit('select', poly.id)"
      >
        <div class="flex items-center gap-2.5">
          <span class="size-3 rounded-full shrink-0 shadow-2xs" :style="{ backgroundColor: poly.color }"></span>
          <div>
            <div class="text-xs font-bold text-foreground">{{ poly.label }}</div>
            <div class="text-[10px] text-muted-foreground font-mono">
              {{ poly.points.length }} vertices
            </div>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          class="size-8 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          @click.stop="emit('delete', poly.id)"
        >
          <Trash2 class="size-3.5" />
        </Button>
      </div>
    </div>
  </div>
</template>
