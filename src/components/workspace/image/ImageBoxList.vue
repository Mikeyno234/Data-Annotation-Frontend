<script setup lang="ts">
import type { ImageBox, LabelOption } from '@/types'
import Badge from '@/components/ui/Badge.vue'
import Button from '@/components/ui/Button.vue'
import { Trash2, Sparkles, Tag } from 'lucide-vue-next'

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
      <h3 class="text-xs font-bold uppercase tracking-wider text-muted-foreground font-mono">
        Bounding Boxes ({{ boxes.length }})
      </h3>
      <Badge v-if="hasPrelabel" variant="secondary" class="gap-1 text-[10px]">
        <Sparkles class="size-3 text-primary" /> Pre-annotated
      </Badge>
    </div>

    <div class="space-y-2.5">
      <div
        v-for="box in boxes"
        :key="box.id"
        class="flex flex-col p-3 rounded-2xl border transition-all cursor-pointer shadow-2xs gap-2"
        :class="[
          selectedBoxId === box.id
            ? 'bg-primary/10 border-primary/50 ring-2 ring-primary/25'
            : 'bg-card/95 border-border/60 hover:bg-card hover:border-border hover:shadow-xs',
        ]"
        @click="emit('select', box.id)"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <span class="size-3 rounded-full shrink-0 shadow-2xs" :style="{ backgroundColor: box.color }"></span>
            <div>
              <div class="text-xs font-bold text-foreground">{{ box.label }}</div>
              <div class="text-[10px] text-muted-foreground font-mono">
                [{{ Math.round(box.x) }}, {{ Math.round(box.y) }}] {{ Math.round(box.width) }}x{{ Math.round(box.height) }}
              </div>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            class="size-8 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            title="Delete Box [Delete]"
            @click.stop="emit('delete', box.id)"
          >
            <Trash2 class="size-3.5" />
          </Button>
        </div>

        <!-- Quick Label Selector for Selected Box -->
        <div
          v-if="selectedBoxId === box.id && labels && labels.length > 1"
          class="flex items-center gap-1.5 flex-wrap pt-1 border-t border-border/40"
          @click.stop
        >
          <span class="text-[10px] text-muted-foreground font-mono flex items-center gap-1 mr-1">
            <Tag class="size-2.5" /> Change:
          </span>
          <button
            v-for="lbl in labels"
            :key="lbl.name"
            type="button"
            class="px-2 py-0.5 rounded-lg text-[10px] font-semibold transition-all cursor-pointer"
            :class="[
              box.label === lbl.name
                ? 'bg-primary text-primary-foreground font-bold shadow-xs'
                : 'bg-muted/80 text-muted-foreground hover:bg-muted hover:text-foreground'
            ]"
            @click="emit('updateLabel', box.id, lbl.name, lbl.color)"
          >
            {{ lbl.name }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
