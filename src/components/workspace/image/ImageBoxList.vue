<script setup lang="ts">
import { ref, computed } from 'vue'
import type { ImageBox, LabelOption } from '@/types'
import Badge from '@/components/ui/Badge.vue'
import Button from '@/components/ui/Button.vue'
import {
  Trash2,
  Tag,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Square,
  Search,
  Sparkles,
} from 'lucide-vue-next'

const props = defineProps<{
  boxes: ImageBox[]
  selectedBoxId: string | null
  labels?: LabelOption[]
  hasPrelabel?: boolean
}>()

const emit = defineEmits<{
  (e: 'select', id: string): void
  (e: 'delete', id: string): void
  (e: 'toggleVisibility', id: string): void
  (e: 'toggleLock', id: string): void
  (e: 'toggleAllVisibility'): void
  (e: 'updateLabel', id: string, newLabel: string, newColor: string): void
}>()

const searchQuery = ref('')

const isAllVisible = computed(() => {
  return props.boxes.length > 0 && !props.boxes.some((b) => b.hidden)
})

const filteredBoxes = computed(() => {
  if (!searchQuery.value.trim()) return props.boxes
  const q = searchQuery.value.toLowerCase().trim()
  return props.boxes.filter(
    (b) =>
      b.label.toLowerCase().includes(q) ||
      b.id.toLowerCase().includes(q)
  )
})
</script>

<template>
  <div class="flex flex-col gap-3">
    <!-- Outliner Header (Label Studio Outliner Pattern) -->
    <div class="flex items-center justify-between pb-1 border-b border-border/50">
      <div class="flex items-center gap-2">
        <h3 class="text-xs font-bold text-foreground tracking-tight flex items-center gap-1.5">
          <Square class="size-3.5 text-primary" />
          <span>Bounding Boxes</span>
        </h3>
        <span
          class="text-2xs font-mono font-bold px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground border border-border/60"
        >
          {{ boxes.length }}
        </span>
      </div>

      <div class="flex items-center gap-1">
        <Badge v-if="hasPrelabel" variant="secondary" class="text-2xs font-medium gap-1 px-1.5 py-0.5">
          <Sparkles class="size-2.5 text-purple-400" /> Pre-annotated
        </Badge>

        <!-- Global Visibility Eye Toggle (Label Studio) -->
        <Button
          variant="ghost"
          size="icon"
          class="size-7 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
          :title="isAllVisible ? 'Hide all regions' : 'Show all regions'"
          :disabled="boxes.length === 0"
          @click="emit('toggleAllVisibility')"
        >
          <Eye v-if="isAllVisible" class="size-3.5" />
          <EyeOff v-else class="size-3.5 text-muted-foreground/60" />
        </Button>
      </div>
    </div>

    <!-- Quick Search Input if more than 3 regions -->
    <div v-if="boxes.length > 3" class="relative">
      <Search class="absolute left-2.5 top-1/2 -translate-y-1/2 size-3 text-muted-foreground/70" />
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Filter by label..."
        class="w-full h-7 pl-7 pr-2.5 text-2xs rounded-lg bg-muted/40 border border-border/50 text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/60 transition-all"
      />
    </div>

    <!-- Empty State -->
    <div
      v-if="boxes.length === 0"
      class="rounded-xl border border-dashed border-border/70 bg-muted/15 p-4 text-center text-xs text-muted-foreground leading-relaxed"
    >
      No bounding boxes created yet.
      <p class="mt-1 text-2xs text-muted-foreground/80">
        Draw on canvas with <kbd class="px-1 py-0.5 rounded bg-muted font-mono font-semibold text-foreground text-2xs border border-border/60">B</kbd> (box) or <kbd class="px-1 py-0.5 rounded bg-muted font-mono font-semibold text-foreground text-2xs border border-border/60">L</kbd> (lasso).
      </p>
    </div>

    <!-- Region Items Tree / Outliner -->
    <div v-else class="space-y-1.5">
      <div
        v-for="box in filteredBoxes"
        :key="box.id"
        class="group flex flex-col p-2.5 rounded-xl border transition-all cursor-pointer shadow-2xs gap-2"
        :class="[
          selectedBoxId === box.id
            ? 'bg-primary/10 border-primary/60 ring-1 ring-primary/40 shadow-xs'
            : 'bg-card/90 border-border/60 hover:bg-muted/40 hover:border-border/90',
          box.hidden ? 'opacity-55' : '',
        ]"
        @click="emit('select', box.id)"
      >
        <div class="flex items-center justify-between gap-2">
          <!-- Left: Swatch Dot + Label + Dimension -->
          <div class="flex items-center gap-2 min-w-0">
            <span
              class="size-2.5 rounded-full shrink-0 shadow-2xs transition-transform group-hover:scale-110"
              :style="{ backgroundColor: box.color || '#38bdf8' }"
            ></span>
            <div class="min-w-0 flex flex-col">
              <div class="flex items-center gap-1.5">
                <span class="text-xs font-semibold text-foreground truncate">{{ box.label }}</span>
                <span
                  v-if="box.confidence"
                  class="text-2xs font-mono font-medium px-1 rounded bg-purple-500/10 text-purple-600 dark:text-purple-300 border border-purple-500/20"
                  :title="`Confidence score: ${Math.round(box.confidence * 100)}%`"
                >
                  {{ Math.round(box.confidence * 100) }}%
                </span>
                <span v-if="box.locked" class="text-amber-500 text-2xs" title="Locked region">
                  <Lock class="size-2.5" />
                </span>
              </div>
              <div class="text-2xs text-muted-foreground/80 font-mono tabular-nums">
                [{{ Math.round(box.x) }}, {{ Math.round(box.y) }}] {{ Math.round(box.width) }}×{{ Math.round(box.height) }}
              </div>
            </div>
          </div>

          <!-- Right: Outliner Quick Action Buttons (Eye, Lock, Delete) -->
          <div class="flex items-center gap-0.5 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
            <!-- Visibility Eye Toggle -->
            <Button
              variant="ghost"
              size="icon"
              class="size-6 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
              :title="box.hidden ? 'Show on canvas' : 'Hide from canvas'"
              @click.stop="emit('toggleVisibility', box.id)"
            >
              <Eye v-if="!box.hidden" class="size-3" />
              <EyeOff v-else class="size-3 text-muted-foreground/50" />
            </Button>

            <!-- Lock Toggle -->
            <Button
              variant="ghost"
              size="icon"
              class="size-6 rounded-md hover:bg-muted cursor-pointer"
              :class="box.locked ? 'text-amber-500 hover:text-amber-600' : 'text-muted-foreground hover:text-foreground'"
              :title="box.locked ? 'Unlock region (editable)' : 'Lock region (prevent accidental edits)'"
              @click.stop="emit('toggleLock', box.id)"
            >
              <Lock v-if="box.locked" class="size-3" />
              <Unlock v-else class="size-3 text-muted-foreground/50" />
            </Button>

            <!-- Delete Button -->
            <Button
              variant="ghost"
              size="icon"
              class="size-6 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer"
              :title="box.locked ? 'Region is locked' : 'Delete Box [Delete]'"
              :disabled="box.locked"
              @click.stop="emit('delete', box.id)"
            >
              <Trash2 class="size-3" />
            </Button>
          </div>
        </div>

        <!-- Quick Label Selector for Selected Box -->
        <div
          v-if="selectedBoxId === box.id && labels && labels.length > 1"
          class="flex items-center gap-1.5 flex-wrap pt-1.5 border-t border-border/40"
          @click.stop
        >
          <span class="text-2xs text-muted-foreground flex items-center gap-1 mr-1">
            <Tag class="size-2.5" /> Reassign:
          </span>
          <button
            v-for="lbl in labels"
            :key="lbl.name"
            type="button"
            class="px-2 py-0.5 rounded text-2xs font-medium transition-all cursor-pointer border"
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
