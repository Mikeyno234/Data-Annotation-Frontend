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
  Loader2,
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
  }>(),
  {
    labels: () => [],
    currentLabel: '',
    modalityTitle: '',
    modalityType: '',
    showClassSelector: true,
    classLabelTitle: 'Class / Label:',
    hotkeyHints: () => [],
    showHotkeys: false,
  }
)

const emit = defineEmits<{
  'update:currentLabel': [value: string]
  selectLabel: [value: string]
}>()

const defaultLabels = [{ name: 'Default label', color: '#38bdf8' }]
const availableLabels = computed(() => (props.labels?.length ? props.labels : defaultLabels))

function handleSelectLabel(name: string) {
  emit('update:currentLabel', name)
  emit('selectLabel', name)
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <!-- Top Action Bar -->
    <div class="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-card/90 p-4 shadow-sm backdrop-blur">
      <!-- Task & Modality Info -->
      <div class="flex items-center gap-3">
        <div>
          <div class="flex items-center gap-2">
            <h2 class="text-base font-bold text-foreground">{{ item.file_name }}</h2>
            <Badge v-if="modalityTitle">{{ modalityTitle }}</Badge>
          </div>
          <div class="flex items-center gap-2 text-xs text-muted-foreground font-mono mt-0.5">
            <span>Task ID: #{{ item.id }}</span>
            <span v-if="modalityType">• {{ modalityType }} Modality</span>
            <span v-if="session.isDraftRestored" class="text-amber-500 font-semibold flex items-center gap-1">
              • <RotateCcw class="size-3 inline" /> Draft Restored
            </span>
          </div>
        </div>
      </div>

      <!-- Session Actions & Status -->
      <div class="flex items-center gap-3">
        <!-- History Controls -->
        <div class="hidden sm:flex items-center gap-1 bg-muted/60 p-1 rounded-xl shadow-inner">
          <Button
            variant="ghost"
            size="icon"
            class="size-7 rounded-lg"
            :disabled="!session.canUndo.value"
            title="Undo (Ctrl+Z)"
            @click="session.undo()"
          >
            <Undo2 class="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            class="size-7 rounded-lg"
            :disabled="!session.canRedo.value"
            title="Redo (Ctrl+Y)"
            @click="session.redo()"
          >
            <Redo2 class="size-3.5" />
          </Button>
        </div>

        <!-- Timer Indicator -->
        <div class="flex items-center gap-2 rounded-xl bg-muted/60 px-3.5 py-2 text-xs font-mono text-muted-foreground shadow-inner">
          <Clock class="size-3.5 text-primary animate-pulse" />
          <span>Elapsed:</span>
          <span class="font-bold text-foreground">{{ session.elapsedTimeSeconds }}s</span>
        </div>

        <!-- Submit Button -->
        <Button
          :disabled="session.isSaving.value"
          class="gap-2 font-semibold shadow-md min-w-[150px]"
          @click="session.submit()"
        >
          <Loader2 v-if="session.isSaving.value" class="size-4 animate-spin" />
          <CheckCircle2 v-else class="size-4" />
          <span>{{ session.isSaving.value ? 'Submitting...' : 'Submit Annotation' }}</span>
        </Button>
      </div>
    </div>

    <!-- Active Class Selector Palette (if enabled) -->
    <div
      v-if="showClassSelector && availableLabels.length > 0"
      class="flex flex-wrap items-center justify-between gap-4 bg-card/90 p-3.5 rounded-2xl shadow-sm"
    >
      <div class="flex items-center gap-3 flex-wrap">
        <span class="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-mono">
          {{ classLabelTitle }}
        </span>
        <div class="flex items-center gap-2 flex-wrap">
          <button
            v-for="lbl in availableLabels"
            :key="lbl.name"
            class="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold border-0 transition-all cursor-pointer shadow-xs active:scale-95"
            :class="[
              currentLabel === lbl.name
                ? 'bg-primary text-primary-foreground shadow-sm ring-2 ring-primary/40 font-bold'
                : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground',
            ]"
            @click="handleSelectLabel(lbl.name)"
          >
            <span
              class="size-2 rounded-full"
              :style="{ backgroundColor: currentLabel === lbl.name ? '#ffffff' : lbl.color || '#38bdf8' }"
            ></span>
            {{ lbl.name }}
          </button>
        </div>
      </div>

      <!-- Extra Controls Slot (e.g. Sentiment selector, Zoom level) -->
      <slot name="controls"></slot>
    </div>

    <!-- Dedicated Floating Toolbar Slot (Above viewport) -->
    <slot name="toolbar"></slot>

    <!-- Quick Controls & Hotkey Hints Bar (Optional / Minimal) -->
    <div
      v-if="hotkeyHints && hotkeyHints.length > 0 && showHotkeys"
      class="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl bg-muted/30 px-4 py-2 text-[11px] text-muted-foreground shadow-inner"
    >
      <span class="flex items-center gap-1.5 font-semibold text-foreground">
        <Keyboard class="size-3.5 text-primary" /> Shortcuts:
      </span>
      <span v-for="hint in hotkeyHints" :key="hint.key" class="flex items-center gap-1.5">
        <kbd class="px-2 py-0.5 rounded-lg bg-card text-foreground font-mono shadow-xs">{{ hint.key }}</kbd>
        <span>{{ hint.label }}</span>
      </span>
      <span class="flex items-center gap-1.5">
        <kbd class="px-2 py-0.5 rounded-lg bg-card text-foreground font-mono shadow-xs">Ctrl+Z / Y</kbd>
        <span>undo/redo</span>
      </span>
      <span class="flex items-center gap-1.5">
        <kbd class="px-2 py-0.5 rounded-lg bg-card text-foreground font-mono shadow-xs">Ctrl+S</kbd>
        <span>save draft</span>
      </span>
    </div>

    <!-- Viewport / Canvas Content Area (Slot) -->
    <slot></slot>
  </div>
</template>
