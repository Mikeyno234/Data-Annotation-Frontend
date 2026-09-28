<script setup lang="ts">
import { ref, computed } from 'vue'
import type { DataItem, LabelOption } from '@/types'
import type { UseAnnotationSessionReturn } from '@/composables/useAnnotationSession'
import Button from '@/components/ui/Button.vue'
import Badge from '@/components/ui/Badge.vue'
import Modal from '@/components/ui/Modal.vue'
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
  FileCode,
  SkipForward,
  HelpCircle,
  Check,
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

const showShortcutsModal = ref(false)
const showSkipConfirmModal = ref(false)

const availableLabels = computed(() => props.labels || [])

const isUpdateMode = computed(() => {
  return props.session.isDraftRestored?.value || props.item?.status === 'REWORK' || props.item?.status === 'ANNOTATED'
})

const submitButtonLabel = computed(() => {
  if (props.session.isSaving?.value) return 'Saving...'
  return isUpdateMode.value ? 'Update Task' : 'Submit Task'
})

// Format seconds into MM:SS or HH:MM:SS for jitter-free tabular display
const formattedTime = computed(() => {
  const totalSeconds = props.session.elapsedTimeSeconds?.value ?? 0
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  const pad = (n: number) => n.toString().padStart(2, '0')
  if (hours > 0) {
    return `${hours}:${pad(minutes)}:${pad(seconds)}`
  }
  return `${pad(minutes)}:${pad(seconds)}`
})

// Asset filename or shortened ID for instant annotator orientation
const itemDisplayLabel = computed(() => {
  if (props.item?.file_name) return props.item.file_name
  if (props.item?.id != null) return `#${props.item.id}`
  return ''
})

function handleSelectLabel(name: string) {
  emit('update:currentLabel', name)
  emit('selectLabel', name)
}

function confirmSkip() {
  showSkipConfirmModal.value = false
  props.session.skip()
}
</script>

<template>
  <div class="flex flex-col gap-3">
    <!-- Top Action Bar (Compact, Apple-Style Header) -->
    <header
      v-if="showHeader"
      role="banner"
      class="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-card/85 backdrop-blur-md border border-border/70 px-4 py-2.5 card-depth"
    >
      <!-- Modality, Asset Metadata & Status Info -->
      <div class="flex items-center gap-2.5 min-w-0 flex-wrap">
        <span v-if="modalityTitle" class="text-xs font-semibold tracking-tight text-foreground truncate max-w-[200px]">
          {{ modalityTitle }}
        </span>
        <Badge v-if="modalityType" variant="outline" class="text-2xs font-medium tracking-tight">
          {{ modalityType }}
        </Badge>
        <span
          v-if="itemDisplayLabel"
          class="hidden md:inline-flex items-center gap-1 text-2xs font-mono text-muted-foreground/80 bg-muted/60 px-2 py-0.5 rounded-md border border-border/40 truncate max-w-[200px]"
          :title="itemDisplayLabel"
        >
          <FileCode class="size-2.5 shrink-0" />
          <span class="truncate">{{ itemDisplayLabel }}</span>
        </span>
        <template v-if="session.isDraftRestored?.value">
          <span class="text-border/70 text-xs select-none">/</span>
          <span class="text-amber-500 text-xs font-medium inline-flex items-center gap-1">
            <RotateCcw class="size-3 shrink-0" /> Draft restored
          </span>
        </template>
        <template v-else-if="session.isDraftSaving?.value">
          <span class="text-border/70 text-xs select-none">/</span>
          <span class="text-muted-foreground text-2xs font-medium inline-flex items-center gap-1">
            <LoaderCircle class="size-2.5 animate-spin" /> Auto-saving...
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
            class="size-7 rounded-lg btn-tactile"
            :disabled="!session.canUndo.value"
            title="Undo (Ctrl+Z)"
            aria-label="Undo last action (Ctrl+Z)"
            @click="session.undo()"
          >
            <Undo2 class="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            class="size-7 rounded-lg btn-tactile"
            :disabled="!session.canRedo.value"
            title="Redo (Ctrl+Y)"
            aria-label="Redo action (Ctrl+Y)"
            @click="session.redo()"
          >
            <Redo2 class="size-3.5" />
          </Button>
        </div>

        <!-- Timer Indicator (Tabular Digits for zero layout jitter) -->
        <div
          class="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-muted/40 border border-border/50 text-xs text-muted-foreground"
          title="Active time spent on this annotation task"
        >
          <Clock class="size-3 text-muted-foreground/80 shrink-0" />
          <span class="tabular-nums font-mono font-medium text-foreground tracking-tight">{{ formattedTime }}</span>
        </div>

        <!-- Shortcuts Guide Modal Trigger (Label Studio Pattern) -->
        <Button
          variant="ghost"
          size="icon"
          class="size-8 rounded-xl text-muted-foreground hover:text-foreground cursor-pointer"
          title="Keyboard shortcuts guide [?]"
          aria-label="Keyboard shortcuts"
          @click="showShortcutsModal = true"
        >
          <HelpCircle class="size-4" />
        </Button>

        <!-- Skip Task Action Button (Label Studio Pattern) -->
        <Button
          variant="outline"
          size="sm"
          class="h-8 px-2.5 gap-1.5 text-xs font-semibold rounded-xl border-border/80 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors cursor-pointer"
          title="Skip this task and load next"
          :disabled="session.isSaving.value"
          @click="showSkipConfirmModal = true"
        >
          <SkipForward class="size-3.5" />
          <span class="hidden md:inline">Skip</span>
        </Button>

        <!-- Submit / Update Button (Primary Visual Action with Ctrl+Enter hint) -->
        <Button
          size="sm"
          :disabled="session.isSaving.value"
          class="h-8 gap-1.5 font-semibold card-depth min-w-32 text-xs cursor-pointer rounded-xl btn-tactile"
          :title="`${submitButtonLabel} [Ctrl+Enter]`"
          :aria-label="submitButtonLabel"
          @click="session.submit()"
        >
          <LoaderCircle v-if="session.isSaving.value" class="size-3.5 animate-spin" />
          <CheckCircle2 v-else class="size-3.5" />
          <span>{{ submitButtonLabel }}</span>
        </Button>

        <!-- Prev / Next Navigation -->
        <div v-if="hasPrev || hasNext" class="hidden sm:flex items-center gap-0.5 bg-muted/50 p-0.5 rounded-xl border border-border/60">
          <Button
            variant="ghost"
            size="icon"
            class="size-7 rounded-lg btn-tactile"
            :disabled="!hasPrev"
            title="Previous task [A]"
            aria-label="Previous task (A)"
            @click="emit('prev')"
          >
            <ChevronLeft class="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            class="size-7 rounded-lg btn-tactile"
            :disabled="!hasNext"
            title="Next task [D]"
            aria-label="Next task (D)"
            @click="emit('next')"
          >
            <ChevronRight class="size-3.5" />
          </Button>
        </div>
      </div>
    </header>

    <!-- Active Class Selector Palette (Apple HIG Segmented Glass Control) -->
    <nav
      v-if="showClassSelector && availableLabels.length > 0"
      aria-label="Label classes selector"
      class="flex flex-wrap items-center justify-between gap-3 bg-card/85 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-border/70 card-depth"
    >
      <div class="flex items-center gap-3 flex-wrap">
        <div class="flex items-center gap-1.5 select-none text-muted-foreground">
          <Tag class="size-3.5 text-primary/70 shrink-0" />
          <span class="text-xs font-semibold tracking-tight text-foreground/90">
            {{ classLabelTitle }}
          </span>
          <span class="text-2xs font-mono font-medium text-muted-foreground/80 bg-muted/70 px-1.5 py-0.5 rounded-md">
            {{ availableLabels.length }}
          </span>
        </div>

        <div
          role="radiogroup"
          aria-label="Active classification label"
          class="flex items-center gap-1.5 p-1 rounded-xl bg-muted/40 border border-border/40 backdrop-blur-xs flex-wrap"
        >
          <button
            v-for="(lbl, idx) in availableLabels"
            :key="lbl.name"
            type="button"
            role="radio"
            :aria-checked="currentLabel === lbl.name"
            :aria-label="`Select label ${lbl.name}`"
            class="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer btn-tactile"
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
              class="text-2xs font-mono font-bold px-1.5 py-0.5 rounded shrink-0 transition-colors"
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
    </nav>

    <!-- Dedicated Floating Toolbar Slot -->
    <slot name="toolbar"></slot>

    <!-- Quick Controls & Hotkey Hints Bar -->
    <aside
      v-if="hotkeyHints && hotkeyHints.length > 0 && showHotkeys"
      aria-label="Keyboard shortcut hints"
      class="flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-xl bg-card/60 backdrop-blur-md px-3.5 py-1.5 text-xs text-muted-foreground border border-border/50 card-depth"
    >
      <span class="flex items-center gap-1.5 font-semibold text-foreground tracking-tight">
        <Keyboard class="size-3.5 text-primary/80 shrink-0" /> Shortcuts:
      </span>
      <span v-for="hint in hotkeyHints" :key="hint.key" class="flex items-center gap-1.5">
        <kbd class="px-1.5 py-0.5 rounded-md bg-muted text-foreground font-mono text-2xs border border-border/70">{{ hint.key }}</kbd>
        <span class="tracking-tight">{{ hint.label }}</span>
      </span>
      <span class="flex items-center gap-1.5">
        <kbd class="px-1.5 py-0.5 rounded-md bg-muted text-foreground font-mono text-2xs border border-border/70">Ctrl+Z / Y</kbd>
        <span class="tracking-tight">undo/redo</span>
      </span>
      <span class="flex items-center gap-1.5">
        <kbd class="px-1.5 py-0.5 rounded-md bg-muted text-foreground font-mono text-2xs border border-border/70">Ctrl+S</kbd>
        <span class="tracking-tight">save draft</span>
      </span>
    </aside>

    <!-- Viewport / Canvas Content Area (Slot) -->
    <main role="main" class="w-full">
      <slot></slot>
    </main>

    <!-- Shortcuts Guide Modal (Label Studio / Apple Glass Pattern) -->
    <Modal
      :open="showShortcutsModal"
      title="Workspace Keyboard Shortcuts"
      description="Power-user shortcuts to speed up high-throughput annotation tasks"
      max-width="max-w-xl"
      @close="showShortcutsModal = false"
    >
      <div class="space-y-4 py-1 text-xs">
        <!-- Navigation & Workflow -->
        <div>
          <h4 class="text-2xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Workflow & Navigation</h4>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div class="flex items-center justify-between p-2 rounded-lg bg-muted/30 border border-border/50">
              <span class="text-foreground">Submit / Update Task</span>
              <kbd class="px-2 py-0.5 rounded bg-muted text-foreground font-mono text-2xs border border-border/70 font-semibold">Ctrl + Enter</kbd>
            </div>
            <div class="flex items-center justify-between p-2 rounded-lg bg-muted/30 border border-border/50">
              <span class="text-foreground">Save Draft</span>
              <kbd class="px-2 py-0.5 rounded bg-muted text-foreground font-mono text-2xs border border-border/70 font-semibold">Ctrl + S</kbd>
            </div>
            <div class="flex items-center justify-between p-2 rounded-lg bg-muted/30 border border-border/50">
              <span class="text-foreground">Next Task</span>
              <kbd class="px-2 py-0.5 rounded bg-muted text-foreground font-mono text-2xs border border-border/70 font-semibold">D</kbd>
            </div>
            <div class="flex items-center justify-between p-2 rounded-lg bg-muted/30 border border-border/50">
              <span class="text-foreground">Previous Task</span>
              <kbd class="px-2 py-0.5 rounded bg-muted text-foreground font-mono text-2xs border border-border/70 font-semibold">A</kbd>
            </div>
            <div class="flex items-center justify-between p-2 rounded-lg bg-muted/30 border border-border/50">
              <span class="text-foreground">Undo action</span>
              <kbd class="px-2 py-0.5 rounded bg-muted text-foreground font-mono text-2xs border border-border/70 font-semibold">Ctrl + Z</kbd>
            </div>
            <div class="flex items-center justify-between p-2 rounded-lg bg-muted/30 border border-border/50">
              <span class="text-foreground">Redo action</span>
              <kbd class="px-2 py-0.5 rounded bg-muted text-foreground font-mono text-2xs border border-border/70 font-semibold">Ctrl + Y</kbd>
            </div>
          </div>
        </div>

        <!-- Canvas Tools & Drawing -->
        <div>
          <h4 class="text-2xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Canvas Tools & Drawing</h4>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div class="flex items-center justify-between p-2 rounded-lg bg-muted/30 border border-border/50">
              <span class="text-foreground">Select / Pointer Tool</span>
              <kbd class="px-2 py-0.5 rounded bg-muted text-foreground font-mono text-2xs border border-border/70 font-semibold">V</kbd>
            </div>
            <div class="flex items-center justify-between p-2 rounded-lg bg-muted/30 border border-border/50">
              <span class="text-foreground">Bounding Box (Rect)</span>
              <kbd class="px-2 py-0.5 rounded bg-muted text-foreground font-mono text-2xs border border-border/70 font-semibold">B</kbd>
            </div>
            <div class="flex items-center justify-between p-2 rounded-lg bg-muted/30 border border-border/50">
              <span class="text-foreground">Freehand Lasso to Box</span>
              <kbd class="px-2 py-0.5 rounded bg-muted text-foreground font-mono text-2xs border border-border/70 font-semibold">L</kbd>
            </div>
            <div class="flex items-center justify-between p-2 rounded-lg bg-muted/30 border border-border/50">
              <span class="text-foreground">Polygon Tool</span>
              <kbd class="px-2 py-0.5 rounded bg-muted text-foreground font-mono text-2xs border border-border/70 font-semibold">P</kbd>
            </div>
            <div class="flex items-center justify-between p-2 rounded-lg bg-muted/30 border border-border/50">
              <span class="text-foreground">Meta SAM 3 AI Wand</span>
              <kbd class="px-2 py-0.5 rounded bg-muted text-foreground font-mono text-2xs border border-border/70 font-semibold">A</kbd>
            </div>
            <div class="flex items-center justify-between p-2 rounded-lg bg-muted/30 border border-border/50">
              <span class="text-foreground">Pan Canvas (Hand)</span>
              <kbd class="px-2 py-0.5 rounded bg-muted text-foreground font-mono text-2xs border border-border/70 font-semibold">H / Space</kbd>
            </div>
          </div>
        </div>

        <!-- Labeling & Outliner -->
        <div>
          <h4 class="text-2xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Labeling & Outliner</h4>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div class="flex items-center justify-between p-2 rounded-lg bg-muted/30 border border-border/50">
              <span class="text-foreground">Choose Class (1-9)</span>
              <kbd class="px-2 py-0.5 rounded bg-muted text-foreground font-mono text-2xs border border-border/70 font-semibold">1, 2 ... 9</kbd>
            </div>
            <div class="flex items-center justify-between p-2 rounded-lg bg-muted/30 border border-border/50">
              <span class="text-foreground">Delete Selected Region</span>
              <kbd class="px-2 py-0.5 rounded bg-muted text-foreground font-mono text-2xs border border-border/70 font-semibold">Delete</kbd>
            </div>
            <div class="flex items-center justify-between p-2 rounded-lg bg-muted/30 border border-border/50">
              <span class="text-foreground">Close Polygon</span>
              <kbd class="px-2 py-0.5 rounded bg-muted text-foreground font-mono text-2xs border border-border/70 font-semibold">Enter</kbd>
            </div>
            <div class="flex items-center justify-between p-2 rounded-lg bg-muted/30 border border-border/50">
              <span class="text-foreground">Cancel Polygon / Drawing</span>
              <kbd class="px-2 py-0.5 rounded bg-muted text-foreground font-mono text-2xs border border-border/70 font-semibold">Escape</kbd>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <Button variant="default" size="sm" class="cursor-pointer" @click="showShortcutsModal = false">
          Got it
        </Button>
      </template>
    </Modal>

    <!-- Skip Task Confirmation Modal -->
    <Modal
      :open="showSkipConfirmModal"
      title="Skip Task?"
      description="Release active task lease and continue to next task in queue."
      max-width="max-w-sm"
      @close="showSkipConfirmModal = false"
    >
      <div class="py-2 text-xs text-muted-foreground leading-relaxed">
        Skipping will release this task back into the project queue for other annotators or future review. Any unsaved edits will be discarded.
      </div>

      <template #footer>
        <Button variant="outline" size="sm" class="cursor-pointer" @click="showSkipConfirmModal = false">
          Cancel
        </Button>
        <Button variant="destructive" size="sm" class="cursor-pointer" @click="confirmSkip">
          Confirm Skip
        </Button>
      </template>
    </Modal>
  </div>
</template>
