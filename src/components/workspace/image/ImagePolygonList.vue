<script setup lang="ts">
import type { ImagePolygon, LabelOption } from '@/types'
import Badge from '@/components/ui/Badge.vue'
import Button from '@/components/ui/Button.vue'
import { Trash2, Scissors, Tag } from 'lucide-vue-next'

defineProps<{
  polygons: ImagePolygon[]
  selectedPolygonId: string | null
  labels?: LabelOption[]
  hasPrelabel?: boolean
}>()

const emit = defineEmits<{
  (e: 'select', id: string): void
  (e: 'delete', id: string): void
  (e: 'updateLabel', id: string, newLabel: string, newColor: string): void
}>()
</script>

<template>
  <div class="flex flex-col gap-3">
    <div class="flex items-center justify-between">
      <h3 class="text-xs font-semibold text-foreground flex items-center gap-1.5">
        <Scissors class="size-3.5 text-muted-foreground" /> Polygons ({{ polygons.length }})
      </h3>
      <Badge v-if="hasPrelabel" variant="secondary" class="text-[10px]">
        Pre-annotated
      </Badge>
    </div>

    <!-- Empty State -->
    <div v-if="polygons.length === 0" class="text-xs text-muted-foreground py-4 px-3 text-center border border-border/50 rounded-xl bg-muted/20">
      Click on canvas to place vertices. Press <kbd class="px-1 py-0.2 rounded bg-muted font-mono font-semibold text-foreground text-[10px]">Enter</kbd> to close.
    </div>

    <div v-else class="space-y-2">
      <div
        v-for="poly in polygons"
        :key="poly.id"
        class="flex flex-col p-3 rounded-xl border transition-all cursor-pointer shadow-2xs gap-2"
        :class="[
          selectedPolygonId === poly.id
            ? 'bg-primary/10 border-primary/50 ring-1 ring-primary/30'
            : 'bg-card border-border/60 hover:bg-muted/40 hover:border-border hover:shadow-xs',
        ]"
        @click="emit('select', poly.id)"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2.5 min-w-0">
            <span class="size-2.5 rounded-full shrink-0 shadow-2xs" :style="{ backgroundColor: poly.color }"></span>
            <div class="min-w-0">
              <div class="text-xs font-semibold text-foreground truncate">{{ poly.label }}</div>
              <div class="text-[10px] text-muted-foreground tabular-nums">
                {{ poly.points.length }} vertices
              </div>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            class="size-7 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
            title="Delete Polygon [Delete]"
            @click.stop="emit('delete', poly.id)"
          >
            <Trash2 class="size-3.5" />
          </Button>
        </div>

        <!-- Quick Label Selector for Selected Polygon -->
        <div
          v-if="selectedPolygonId === poly.id && labels && labels.length > 1"
          class="flex items-center gap-1.5 flex-wrap pt-1.5 border-t border-border/40"
          @click.stop
        >
          <span class="text-[10px] text-muted-foreground flex items-center gap-1 mr-1">
            <Tag class="size-2.5" /> Change:
          </span>
          <button
            v-for="lbl in labels"
            :key="lbl.name"
            type="button"
            class="px-2 py-0.5 rounded text-[10px] font-medium transition-all cursor-pointer border"
            :style="poly.label === lbl.name ? {
              borderColor: lbl.color || 'var(--primary)',
              backgroundColor: `${lbl.color || '#3b82f6'}20`,
              color: 'var(--foreground)'
            } : {}"
            :class="[
              poly.label === lbl.name
                ? 'font-semibold ring-1'
                : 'border-border/50 bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
            ]"
            @click="emit('updateLabel', poly.id, lbl.name, lbl.color || '#3b82f6')"
          >
            {{ lbl.name }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
