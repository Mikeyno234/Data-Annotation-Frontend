<script setup lang="ts">
import { computed } from 'vue'
import type { DataItem, LabelOption } from '@/types'
import type { UseAnnotationSessionReturn } from '@/composables/useAnnotationSession'
import Button from '@/components/ui/Button.vue'
import Badge from '@/components/ui/Badge.vue'
import {
  Clock,
  CheckCircle2,
  RotateCcw,
  Keyboard,
  Undo2,
  Redo2,
  LoaderCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-vue-next'

const props = withDefaults(
  defineProps<{
    item: DataItem
    session: UseAnnotationSessionReturn<any>
    labels?: LabelOption[]
    currentLabel?: string
    modalityTitle?: string
    modalityType?: string
    showClassSelector?: boolean
    classLabelTitle?: string
    hotkeyHints?: Array<{ key: string; label: string }>
    showHotkeys?: boolean
    showHeader?: boolean
    hasNext?: boolean
    hasPrev?: boolean
  }>(),
  {
    labels: () => [],
    currentLabel: '',
    modalityTitle: '',
    modalityType: '',
    showClassSelector: true,
    classLabelTitle: 'Class / Label:',
    hotkeyHints: () => [],
    showHotkeys: true,
    showHeader: true,
    hasNext: false,
    hasPrev: false,
  }
)

const emit = defineEmits<{
  'update:currentLabel': [value: string]
  selectLabel: [value: string]
  next: []
  prev: []
}>()

const availableLabels = computed(() => props.labels || [])

function handleSelectLabel(name: string) {
  emit('update:currentLabel', name)
  emit('selectLabel', name)
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <!-- Top Action Bar (Compact, Non-redundant) -->
    <div v-if="showHeader" class="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-card border border-border px-4 py-2.5 shadow-2xs">
      <!-- Modality & Status Info -->
      <div class="flex items-center gap-2.5 min-w-0">
        <span v-if="modalityTitle" class="text-xs font-semibold text-foreground">
          {{ modalityTitle }}
        </span>
        <Badge v-if="modalityType" variant="outline" class="text-[10px]">
          {{ modalityType }}
        </Badge>
        <template v-if="session.isDraftRestored">
          <span class="text-border/70 text-xs">/</span>
          <span class="text-amber-500 text-xs font-medium flex items-center gap-1">
            <RotateCcw class="size-3" /> Draft restored
          </span>
        </template>
      </div>

      <!-- Session Actions & Status -->
      <div class="flex items-center gap-3">
        <!-- History Controls -->
        <div class="hidden sm:flex items-center gap-0.5 bg-muted/60 p-0.5 rounded-lg border border-border/60">
          <Button
            variant="ghost"
            size="icon"
            class="size-6 rounded"
            :disabled="!session.canUndo.value"
            title="Undo (Ctrl+Z)"
            @click="session.undo()"
          >
            <Undo2 class="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            class="size-6 rounded"
            :disabled="!session.canRedo.value"
            title="Redo (Ctrl+Y)"
            @click="session.redo()"
          >
            <Redo2 class="size-3.5" />
          </Button>
        </div>

        <!-- Timer Indicator (No distracting pulse) -->
        <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted/50 border border-border/60 text-xs text-muted-foreground">
          <Clock class="size-3 text-muted-foreground" />
          <span class="tabular-nums font-medium text-foreground">{{ session.elapsedTimeSeconds }}s</span>
        </div>

        <!-- Submit Button -->
        <Button
          size="sm"
          :disabled="session.isSaving.value"
          class="h-8 gap-1.5 font-semibold shadow-xs min-w-[130px] text-xs cursor-pointer"
          @click="session.submit()"
        >
          <LoaderCircle v-if="session.isSaving.value" class="size-3.5 animate-spin" />
          <CheckCircle2 v-else class="size-3.5" />
          <span>{{ session.isSaving.value ? 'Submitting...' : 'Submit Task' }}</span>
        </Button>

        <!-- Prev / Next Navigation (only when parent provides them) -->
        <div v-if="hasPrev || hasNext" class="hidden sm:flex items-center gap-0.5 bg-muted/60 p-0.5 rounded-lg border border-border/60">
          <Button
            variant="ghost"
            size="icon"
            class="size-6 rounded"
            :disabled="!hasPrev"
            title="Previous task [A]"
            @click="emit('prev')"
          >
            <ChevronLeft class="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            class="size-6 rounded"
            :disabled="!hasNext"
            title="Next task [D]"
            @click="emit('next')"
          >
            <ChevronRight class="size-3.5" />
          </Button>
        </div>
      </div>
    </div>

    <!-- Active Class Selector Palette (Respecting actual label color from Task Catalog) -->
    <div
      v-if="showClassSelector && availableLabels.length > 0"
      class="flex flex-wrap items-center justify-between gap-3 bg-card px-4 py-2.5 rounded-xl border border-border shadow-2xs"
    >
      <div class="flex items-center gap-3 flex-wrap">
        <span class="text-xs font-medium text-muted-foreground">
          {{ classLabelTitle }}
        </span>
        <div class="flex items-center gap-2 flex-wrap">
          <button
            v-for="lbl in availableLabels"
            :key="lbl.name"
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer shadow-2xs active:scale-[0.98]"
            :style="currentLabel === lbl.name ? {
              borderColor: lbl.color || 'var(--primary)',
              backgroundColor: `${lbl.color || '#3b82f6'}18`,
              color: 'var(--foreground)'
            } : {}"
            :class="[
              currentLabel === lbl.name
                ? 'font-semibold ring-1'
                : 'border-border/60 bg-muted/40 text-muted-foreground hover:bg-muted/80 hover:text-foreground',
            ]"
            @click="handleSelectLabel(lbl.name)"
          >
            <span
              class="size-2 rounded-full shrink-0 shadow-2xs"
              :style="{ backgroundColor: lbl.color || '#38bdf8' }"
            />
            <span>{{ lbl.name }}</span>
          </button>
        </div>
      </div>

      <!-- Extra Controls Slot (e.g. Sentiment selector, Zoom level) -->
      <slot name="controls"></slot>
    </div>

    <!-- Dedicated Floating Toolbar Slot (Above viewport) -->
    <slot name="toolbar"></slot>

    <!-- Quick Controls & Hotkey Hints Bar -->
    <div
      v-if="hotkeyHints && hotkeyHints.length > 0 && showHotkeys"
      class="flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-lg bg-muted/30 px-3.5 py-1.5 text-[11px] text-muted-foreground border border-border/50"
    >
      <span class="flex items-center gap-1.5 font-semibold text-foreground">
        <Keyboard class="size-3.5 text-primary" /> Shortcuts:
      </span>
      <span v-for="hint in hotkeyHints" :key="hint.key" class="flex items-center gap-1.5">
        <kbd class="px-1.5 py-0.2 rounded bg-card text-foreground font-mono text-[10px] border border-border/60 shadow-2xs">{{ hint.key }}</kbd>
        <span>{{ hint.label }}</span>
      </span>
      <span class="flex items-center gap-1.5">
        <kbd class="px-1.5 py-0.2 rounded bg-card text-foreground font-mono text-[10px] border border-border/60 shadow-2xs">Ctrl+Z / Y</kbd>
        <span>undo/redo</span>
      </span>
      <span class="flex items-center gap-1.5">
        <kbd class="px-1.5 py-0.2 rounded bg-card text-foreground font-mono text-[10px] border border-border/60 shadow-2xs">Ctrl+S</kbd>
        <span>save draft</span>
      </span>
    </div>

    <!-- Viewport / Canvas Content Area (Slot) -->
    <slot></slot>
  </div>
</template>
