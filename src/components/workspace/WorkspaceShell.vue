<script setup lang="ts">
import { computed } from 'vue'
import type { DataItem, LabelOption } from '@/types'
import type { UseAnnotationSessionReturn } from '@/composables/useAnnotationSession'
import Button from '@/components/ui/Button.vue'
import Badge from '@/components/ui/Badge.vue'
import {
  Tag,
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
    classLabelTitle: 'Label Category',
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
  <div class="flex flex-col gap-3">
    <!-- Top Action Bar (Compact, Apple-Style Header) -->
    <div v-if="showHeader" class="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-card/80 backdrop-blur-md border border-border/70 px-4 py-2.5 shadow-xs">
      <!-- Modality & Status Info -->
      <div class="flex items-center gap-2.5 min-w-0">
        <span v-if="modalityTitle" class="text-xs font-semibold tracking-tight text-foreground">
          {{ modalityTitle }}
        </span>
        <Badge v-if="modalityType" variant="outline" class="text-[10px] font-medium tracking-tight">
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
        <div class="hidden sm:flex items-center gap-0.5 bg-muted/50 p-0.5 rounded-xl border border-border/60">
          <Button
            variant="ghost"
            size="icon"
            class="size-6 rounded-lg active:scale-95 transition-transform"
            :disabled="!session.canUndo.value"
            title="Undo (Ctrl+Z)"
            @click="session.undo()"
          >
            <Undo2 class="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            class="size-6 rounded-lg active:scale-95 transition-transform"
            :disabled="!session.canRedo.value"
            title="Redo (Ctrl+Y)"
            @click="session.redo()"
          >
            <Redo2 class="size-3.5" />
          </Button>
        </div>

        <!-- Timer Indicator -->
        <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-muted/40 border border-border/50 text-xs text-muted-foreground">
          <Clock class="size-3 text-muted-foreground/80" />
          <span class="tabular-nums font-medium text-foreground">{{ session.elapsedTimeSeconds }}s</span>
        </div>

        <!-- Submit Button -->
        <Button
          size="sm"
          :disabled="session.isSaving.value"
          class="h-8 gap-1.5 font-semibold shadow-xs min-w-[130px] text-xs cursor-pointer rounded-xl active:scale-[0.97] transition-all"
          @click="session.submit()"
        >
          <LoaderCircle v-if="session.isSaving.value" class="size-3.5 animate-spin" />
          <CheckCircle2 v-else class="size-3.5" />
          <span>{{ session.isSaving.value ? 'Submitting...' : 'Submit Task' }}</span>
        </Button>

        <!-- Prev / Next Navigation -->
        <div v-if="hasPrev || hasNext" class="hidden sm:flex items-center gap-0.5 bg-muted/50 p-0.5 rounded-xl border border-border/60">
          <Button
            variant="ghost"
            size="icon"
            class="size-6 rounded-lg active:scale-95 transition-transform"
            :disabled="!hasPrev"
            title="Previous task [A]"
            @click="emit('prev')"
          >
            <ChevronLeft class="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            class="size-6 rounded-lg active:scale-95 transition-transform"
            :disabled="!hasNext"
            title="Next task [D]"
            @click="emit('next')"
          >
            <ChevronRight class="size-3.5" />
          </Button>
        </div>
      </div>
    </div>

    <!-- Active Class Selector Palette (Apple HIG Segmented Glass Control) -->
    <div
      v-if="showClassSelector && availableLabels.length > 0"
      class="flex flex-wrap items-center justify-between gap-3 bg-card/85 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-border/70 shadow-xs"
    >
      <div class="flex items-center gap-3 flex-wrap">
        <div class="flex items-center gap-1.5 select-none text-muted-foreground">
          <Tag class="size-3.5 text-primary/70" />
          <span class="text-xs font-semibold tracking-tight text-foreground/90">
            {{ classLabelTitle }}
          </span>
          <span class="text-[10px] font-mono font-medium text-muted-foreground/80 bg-muted/70 px-1.5 py-0.5 rounded-md">
            {{ availableLabels.length }}
          </span>
        </div>

        <div class="flex items-center gap-1.5 p-1 rounded-xl bg-muted/40 border border-border/40 backdrop-blur-xs flex-wrap">
          <button
            v-for="(lbl, idx) in availableLabels"
            :key="lbl.name"
            class="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer active:scale-[0.97]"
            :style="currentLabel === lbl.name ? {
              borderColor: lbl.color || 'var(--primary)',
              backgroundColor: `${lbl.color || '#3b82f6'}1a`,
              color: 'var(--foreground)'
            } : {}"
            :class="[
              currentLabel === lbl.name
                ? 'font-semibold border shadow-xs ring-1 ring-border/20 bg-card'
                : 'border border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/60',
            ]"
            @click="handleSelectLabel(lbl.name)"
          >
            <!-- Keyboard shortcut index badge (1-9) -->
            <span
              v-if="idx < 9"
              class="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded shrink-0 transition-colors"
              :class="currentLabel === lbl.name ? 'bg-foreground/15 text-foreground' : 'bg-muted-foreground/15 text-muted-foreground'"
            >
              {{ idx + 1 }}
            </span>
            <!-- Glowing color indicator dot -->
            <span
              class="size-2.5 rounded-full shrink-0 transition-transform"
              :class="currentLabel === lbl.name ? 'scale-110' : ''"
              :style="{
                backgroundColor: lbl.color || '#38bdf8',
                boxShadow: currentLabel === lbl.name ? `0 0 8px ${lbl.color || '#38bdf8'}90` : 'none'
              }"
            />
            <span class="tracking-tight">{{ lbl.name }}</span>
          </button>
        </div>
      </div>

      <!-- Extra Controls Slot -->
      <slot name="controls"></slot>
    </div>

    <!-- Dedicated Floating Toolbar Slot -->
    <slot name="toolbar"></slot>

    <!-- Quick Controls & Hotkey Hints Bar (Refined Apple Translucent Glass Strip) -->
    <div
      v-if="hotkeyHints && hotkeyHints.length > 0 && showHotkeys"
      class="flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-xl bg-card/60 backdrop-blur-md px-3.5 py-1.5 text-[11px] text-muted-foreground border border-border/50 shadow-2xs"
    >
      <span class="flex items-center gap-1.5 font-semibold text-foreground tracking-tight">
        <Keyboard class="size-3.5 text-primary/80" /> Shortcuts:
      </span>
      <span v-for="hint in hotkeyHints" :key="hint.key" class="flex items-center gap-1.5">
        <kbd class="px-1.5 py-0.2 rounded-md bg-muted text-foreground font-mono text-[10px] border border-border/70 shadow-2xs">{{ hint.key }}</kbd>
        <span class="tracking-tight">{{ hint.label }}</span>
      </span>
      <span class="flex items-center gap-1.5">
        <kbd class="px-1.5 py-0.2 rounded-md bg-muted text-foreground font-mono text-[10px] border border-border/70 shadow-2xs">Ctrl+Z / Y</kbd>
        <span class="tracking-tight">undo/redo</span>
      </span>
      <span class="flex items-center gap-1.5">
        <kbd class="px-1.5 py-0.2 rounded-md bg-muted text-foreground font-mono text-[10px] border border-border/70 shadow-2xs">Ctrl+S</kbd>
        <span class="tracking-tight">save draft</span>
      </span>
    </div>

    <!-- Viewport / Canvas Content Area (Slot) -->
    <slot></slot>
  </div>
</template>
