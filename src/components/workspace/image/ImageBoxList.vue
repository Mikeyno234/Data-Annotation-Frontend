<script setup lang="ts">
import type { ImageBox, LabelOption } from '@/types'
import Badge from '@/components/ui/Badge.vue'
import Button from '@/components/ui/Button.vue'
import { Trash2, Tag } from 'lucide-vue-next'

const props = defineProps<{
  boxes: ImageBox[]
  selectedBoxId: string | null
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
      <h3 class="text-xs font-semibold text-foreground">
        Bounding Boxes ({{ boxes.length }})
      </h3>
      <Badge v-if="hasPrelabel" variant="secondary" class="text-[10px]">
        Pre-annotated
      </Badge>
    </div>

    <!-- Empty State -->
    <div
      v-if="boxes.length === 0"
      class="rounded-xl border border-border/50 bg-muted/20 p-4 text-center text-xs text-muted-foreground"
    >
      Draw a box on the canvas using tool <kbd class="px-1 py-0.2 rounded bg-muted font-mono font-semibold text-foreground text-[10px]">B</kbd> or <kbd class="px-1 py-0.2 rounded bg-muted font-mono font-semibold text-foreground text-[10px]">L</kbd>.
    </div>

    <div v-else class="space-y-2">
      <div
        v-for="box in boxes"
        :key="box.id"
        class="flex flex-col p-3 rounded-xl border transition-all cursor-pointer shadow-2xs gap-2"
        :class="[
          selectedBoxId === box.id
            ? 'bg-primary/10 border-primary/50 ring-1 ring-primary/30'
            : 'bg-card border-border/60 hover:bg-muted/40 hover:border-border hover:shadow-xs',
        ]"
        @click="emit('select', box.id)"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2.5 min-w-0">
            <span class="size-2.5 rounded-full shrink-0 shadow-2xs" :style="{ backgroundColor: box.color }"></span>
            <div class="min-w-0">
              <div class="text-xs font-semibold text-foreground truncate">{{ box.label }}</div>
              <div class="text-[10px] text-muted-foreground tabular-nums">
                [{{ Math.round(box.x) }}, {{ Math.round(box.y) }}] {{ Math.round(box.width) }}x{{ Math.round(box.height) }}
              </div>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            class="size-7 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
            title="Delete Box [Delete]"
            @click.stop="emit('delete', box.id)"
          >
            <Trash2 class="size-3.5" />
          </Button>
        </div>

        <!-- Quick Label Selector for Selected Box -->
        <div
          v-if="selectedBoxId === box.id && labels && labels.length > 1"
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
            :style="box.label === lbl.name ? {
              borderColor: lbl.color || 'var(--primary)',
              backgroundColor: `${lbl.color || '#3b82f6'}20`,
              color: 'var(--foreground)'
            } : {}"
            :class="[
              box.label === lbl.name
                ? 'font-semibold ring-1'
                : 'border-border/50 bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
            ]"
            @click="emit('updateLabel', box.id, lbl.name, lbl.color || '#3b82f6')"
          >
            {{ lbl.name }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
