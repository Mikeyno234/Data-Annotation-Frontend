<script setup lang="ts">
import { ref, computed } from 'vue'
import type { ImagePolygon, LabelOption } from '@/types'
import Badge from '@/components/ui/Badge.vue'
import Button from '@/components/ui/Button.vue'
import {
  Trash2,
  Scissors,
  Tag,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Search,
  Sparkles,
} from 'lucide-vue-next'

const props = defineProps<{
  polygons: ImagePolygon[]
  selectedPolygonId: string | null
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
  return props.polygons.length > 0 && !props.polygons.some((p) => p.hidden)
})

const filteredPolygons = computed(() => {
  if (!searchQuery.value.trim()) return props.polygons
  const q = searchQuery.value.toLowerCase().trim()
  return props.polygons.filter(
    (p) =>
      p.label.toLowerCase().includes(q) ||
      p.id.toLowerCase().includes(q)
  )
})
</script>

<template>
  <div class="flex flex-col gap-3">
    <!-- Outliner Header (Label Studio Outliner Pattern) -->
    <div class="flex items-center justify-between pb-1 border-b border-border/50">
      <div class="flex items-center gap-2">
        <h3 class="text-xs font-bold text-foreground tracking-tight flex items-center gap-1.5">
          <Scissors class="size-3.5 text-primary" />
          <span>Polygons</span>
        </h3>
        <span
          class="text-2xs font-mono font-bold px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground border border-border/60"
        >
          {{ polygons.length }}
        </span>
      </div>

      <div class="flex items-center gap-1">
        <Badge v-if="hasPrelabel" variant="secondary" class="text-2xs font-medium gap-1 px-1.5 py-0.5">
          <Sparkles class="size-2.5 text-purple-400" /> Pre-annotated
        </Badge>

        <!-- Global Visibility Eye Toggle -->
        <Button
          variant="ghost"
          size="icon"
          class="size-7 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
          :title="isAllVisible ? 'Hide all polygons' : 'Show all polygons'"
          :disabled="polygons.length === 0"
          @click="emit('toggleAllVisibility')"
        >
          <Eye v-if="isAllVisible" class="size-3.5" />
          <EyeOff v-else class="size-3.5 text-muted-foreground/60" />
        </Button>
      </div>
    </div>

    <!-- Quick Search Input if more than 3 regions -->
    <div v-if="polygons.length > 3" class="relative">
      <Search class="absolute left-2.5 top-1/2 -translate-y-1/2 size-3 text-muted-foreground/70" />
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Filter polygons..."
        class="w-full h-7 pl-7 pr-2.5 text-2xs rounded-lg bg-muted/40 border border-border/50 text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/60 transition-all"
      />
    </div>

    <!-- Empty State -->
    <div
      v-if="polygons.length === 0"
      class="rounded-xl border border-dashed border-border/70 bg-muted/15 p-4 text-center text-xs text-muted-foreground leading-relaxed"
    >
      No polygons drawn yet.
      <p class="mt-1 text-2xs text-muted-foreground/80">
        Click vertices on canvas, then press <kbd class="px-1 py-0.5 rounded bg-muted font-mono font-semibold text-foreground text-2xs border border-border/60">Enter</kbd> to close.
      </p>
    </div>

    <!-- Region Items Tree / Outliner -->
    <div v-else class="space-y-1.5">
      <div
        v-for="poly in filteredPolygons"
        :key="poly.id"
        class="group flex flex-col p-2.5 rounded-xl border transition-all cursor-pointer shadow-2xs gap-2"
        :class="[
          selectedPolygonId === poly.id
            ? 'bg-primary/10 border-primary/60 ring-1 ring-primary/40 shadow-xs'
            : 'bg-card/90 border-border/60 hover:bg-muted/40 hover:border-border/90',
          poly.hidden ? 'opacity-55' : '',
        ]"
        @click="emit('select', poly.id)"
      >
        <div class="flex items-center justify-between gap-2">
          <!-- Left: Swatch Dot + Label + Vertex Count -->
          <div class="flex items-center gap-2 min-w-0">
            <span
              class="size-2.5 rounded-full shrink-0 shadow-2xs transition-transform group-hover:scale-110"
              :style="{ backgroundColor: poly.color || '#38bdf8' }"
            ></span>
            <div class="min-w-0 flex flex-col">
              <div class="flex items-center gap-1.5">
                <span class="text-xs font-semibold text-foreground truncate">{{ poly.label }}</span>
                <span
                  v-if="poly.confidence"
                  class="text-2xs font-mono font-medium px-1 rounded bg-purple-500/10 text-purple-600 dark:text-purple-300 border border-purple-500/20"
                  :title="`Confidence score: ${Math.round(poly.confidence * 100)}%`"
                >
                  {{ Math.round(poly.confidence * 100) }}%
                </span>
                <span v-if="poly.locked" class="text-amber-500 text-2xs" title="Locked region">
                  <Lock class="size-2.5" />
                </span>
              </div>
              <div class="text-2xs text-muted-foreground/80 font-mono tabular-nums">
                {{ poly.points.length }} vertices
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
              :title="poly.hidden ? 'Show on canvas' : 'Hide from canvas'"
              @click.stop="emit('toggleVisibility', poly.id)"
            >
              <Eye v-if="!poly.hidden" class="size-3" />
              <EyeOff v-else class="size-3 text-muted-foreground/50" />
            </Button>

            <!-- Lock Toggle -->
            <Button
              variant="ghost"
              size="icon"
              class="size-6 rounded-md hover:bg-muted cursor-pointer"
              :class="poly.locked ? 'text-amber-500 hover:text-amber-600' : 'text-muted-foreground hover:text-foreground'"
              :title="poly.locked ? 'Unlock polygon (editable)' : 'Lock polygon (prevent accidental edits)'"
              @click.stop="emit('toggleLock', poly.id)"
            >
              <Lock v-if="poly.locked" class="size-3" />
              <Unlock v-else class="size-3 text-muted-foreground/50" />
            </Button>

            <!-- Delete Button -->
            <Button
              variant="ghost"
              size="icon"
              class="size-6 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer"
              :title="poly.locked ? 'Polygon is locked' : 'Delete Polygon [Delete]'"
              :disabled="poly.locked"
              @click.stop="emit('delete', poly.id)"
            >
              <Trash2 class="size-3" />
            </Button>
          </div>
        </div>

        <!-- Quick Label Selector for Selected Polygon -->
        <div
          v-if="selectedPolygonId === poly.id && labels && labels.length > 1"
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
