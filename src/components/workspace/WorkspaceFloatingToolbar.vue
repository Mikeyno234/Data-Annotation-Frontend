<script setup lang="ts">
import { computed } from 'vue'
import {
  Undo2,
  Redo2,
  MousePointer2,
  Square,
  Move,
  Trash2,
  RotateCcw,
  Sparkles,
  Save,
  Check,
  ChevronRight,
  ChevronLeft,
  Loader2
} from 'lucide-vue-next'

export type CanvasTool = 'select' | 'bbox' | 'pan'

const props = withDefaults(
  defineProps<{
    activeTool?: CanvasTool
    canUndo?: boolean
    canRedo?: boolean
    hasSelection?: boolean
    isSaving?: boolean
    canSubmit?: boolean
    hasNext?: boolean
    hasPrev?: boolean
  }>(),
  {
    activeTool: 'bbox',
    canUndo: false,
    canRedo: false,
    hasSelection: false,
    isSaving: false,
    canSubmit: true,
    hasNext: false,
    hasPrev: false,
  }
)

const emit = defineEmits<{
  'update:activeTool': [tool: CanvasTool]
  undo: []
  redo: []
  deleteSelected: []
  resetDraft: []
  autoPrelabel: []
  saveDraft: []
  submit: []
  next: []
  prev: []
}>()
</script>

<template>
  <div class="flex items-center justify-center w-full py-1 select-none">
    <div class="flex items-center gap-2">
      <!-- Main Dock Capsule (Floating Studio Toolbar) -->
      <div class="flex items-center h-12 px-2.5 rounded-2xl bg-[#141517]/95 border border-white/10 shadow-2xl backdrop-blur-xl text-zinc-400">
        
        <!-- 1. Reset / Clear (Undo history or restart) -->
        <button
          type="button"
          class="relative flex size-8 items-center justify-center rounded-xl transition-all cursor-pointer hover:bg-white/10 hover:text-zinc-100 active:scale-95 disabled:opacity-30 disabled:pointer-events-none"
          title="Reset / Clear Draft"
          @click="emit('resetDraft')"
        >
          <!-- Subtle Crown / Pro badge aesthetic like user reference -->
          <span class="absolute -top-1.5 right-0.5 text-[9px] text-amber-400 select-none">👑</span>
          <RotateCcw class="size-4 stroke-[1.8]" />
        </button>

        <!-- Divider -->
        <div class="h-4 w-px bg-white/10 mx-1.5"></div>

        <!-- 2. Tool Mode: Draw Bounding Box (Highlighter active style with lime green accent) -->
        <button
          type="button"
          class="flex size-9 items-center justify-center rounded-xl transition-all cursor-pointer active:scale-95 font-medium"
          :class="[
            activeTool === 'bbox'
              ? 'bg-[#ccff00] text-black shadow-lg shadow-[#ccff00]/20 font-bold'
              : 'hover:bg-white/10 hover:text-zinc-100'
          ]"
          title="Bounding Box Tool (Click & Drag)"
          @click="emit('update:activeTool', 'bbox')"
        >
          <Square class="size-4 stroke-[2.2]" />
        </button>

        <!-- 3. Tool Mode: Select & Inspect Pointer -->
        <button
          type="button"
          class="flex size-8 items-center justify-center rounded-xl transition-all cursor-pointer active:scale-95"
          :class="[
            activeTool === 'select'
              ? 'bg-[#ccff00] text-black shadow-lg shadow-[#ccff00]/20 font-bold'
              : 'hover:bg-white/10 hover:text-zinc-100'
          ]"
          title="Select / Move Box Mode"
          @click="emit('update:activeTool', 'select')"
        >
          <MousePointer2 class="size-4 stroke-[1.8]" />
        </button>

        <!-- 4. Tool Mode: Hand / Pan -->
        <button
          type="button"
          class="flex size-8 items-center justify-center rounded-xl transition-all cursor-pointer active:scale-95"
          :class="[
            activeTool === 'pan'
              ? 'bg-[#ccff00] text-black shadow-lg shadow-[#ccff00]/20 font-bold'
              : 'hover:bg-white/10 hover:text-zinc-100'
          ]"
          title="Pan / View Mode"
          @click="emit('update:activeTool', 'pan')"
        >
          <Move class="size-4 stroke-[1.8]" />
        </button>

        <!-- Divider -->
        <div class="h-4 w-px bg-white/10 mx-1.5"></div>

        <!-- 5. Undo & Redo Controls -->
        <button
          type="button"
          class="flex size-8 items-center justify-center rounded-xl transition-all cursor-pointer hover:bg-white/10 hover:text-zinc-100 active:scale-95 disabled:opacity-30 disabled:pointer-events-none"
          :disabled="!canUndo"
          title="Undo Action (Ctrl+Z)"
          @click="emit('undo')"
        >
          <Undo2 class="size-4 stroke-[1.8]" />
        </button>

        <button
          type="button"
          class="flex size-8 items-center justify-center rounded-xl transition-all cursor-pointer hover:bg-white/10 hover:text-zinc-100 active:scale-95 disabled:opacity-30 disabled:pointer-events-none"
          :disabled="!canRedo"
          title="Redo Action (Ctrl+Y)"
          @click="emit('redo')"
        >
          <Redo2 class="size-4 stroke-[1.8]" />
        </button>

        <!-- 6. Delete Selected Object (Trash icon) -->
        <button
          type="button"
          class="flex size-8 items-center justify-center rounded-xl transition-all cursor-pointer hover:bg-red-500/20 hover:text-red-400 active:scale-95 disabled:opacity-30 disabled:pointer-events-none"
          :disabled="!hasSelection"
          title="Delete Selected Box"
          @click="emit('deleteSelected')"
        >
          <Trash2 class="size-4 stroke-[1.8]" />
        </button>

        <!-- Divider -->
        <div class="h-4 w-px bg-white/10 mx-1.5"></div>

        <!-- 7. Smart AI Assist / Auto Pre-label -->
        <button
          type="button"
          class="relative flex size-8 items-center justify-center rounded-xl transition-all cursor-pointer hover:bg-white/10 hover:text-amber-300 active:scale-95"
          title="AI Assistant / Prelabeling"
          @click="emit('autoPrelabel')"
        >
          <!-- +$20 badge aesthetic from user reference -->
          <span class="absolute -top-1.5 -right-1 text-[8px] font-mono font-bold text-amber-400 select-none">AI</span>
          <Sparkles class="size-4 stroke-[1.8]" />
        </button>

        <!-- 8. Save Draft Button -->
        <button
          type="button"
          class="flex size-8 items-center justify-center rounded-xl transition-all cursor-pointer hover:bg-white/10 hover:text-zinc-100 active:scale-95"
          title="Save Draft (Autosaved)"
          @click="emit('saveDraft')"
        >
          <Save class="size-4 stroke-[1.8]" />
        </button>

        <div class="h-4 w-px bg-white/10 mx-1"></div>

        <!-- 9. Big Submission Icon (Lime Green Accent Button like user reference) -->
        <button
          type="button"
          class="flex size-9 items-center justify-center rounded-xl bg-[#ccff00] text-black shadow-lg shadow-[#ccff00]/25 transition-all cursor-pointer hover:scale-105 active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
          :disabled="isSaving"
          title="Submit Annotation (Finished)"
          @click="emit('submit')"
        >
          <Loader2 v-if="isSaving" class="size-4.5 animate-spin" />
          <Check v-else class="size-5 stroke-[2.8]" />
        </button>
      </div>

      <!-- Secondary Capsule (Fast Navigation Queue) -->
      <div class="flex items-center h-12 px-2 rounded-2xl bg-[#141517]/95 border border-white/10 shadow-2xl backdrop-blur-xl text-zinc-400 gap-1">
        <button
          type="button"
          class="flex size-8 items-center justify-center rounded-xl transition-all cursor-pointer hover:bg-white/10 hover:text-zinc-100 active:scale-95 disabled:opacity-30 disabled:pointer-events-none"
          :disabled="!hasPrev"
          title="Previous Task"
          @click="emit('prev')"
        >
          <ChevronLeft class="size-4.5 stroke-[2]" />
        </button>

        <div class="h-4 w-px bg-white/10 mx-0.5"></div>

        <button
          type="button"
          class="flex size-8 items-center justify-center rounded-xl transition-all cursor-pointer hover:bg-white/10 hover:text-zinc-100 active:scale-95 disabled:opacity-30 disabled:pointer-events-none"
          :disabled="!hasNext"
          title="Next Task"
          @click="emit('next')"
        >
          <ChevronRight class="size-4.5 stroke-[2]" />
        </button>
      </div>
    </div>
  </div>
</template>
