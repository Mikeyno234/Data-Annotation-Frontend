<script setup lang="ts">
import {
  Undo2,
  Redo2,
  MousePointer2,
  Square,
  LassoSelect,
  Scissors,
  Move,
  Trash2,
  RotateCcw,
  ChevronRight,
  ChevronLeft,
  CheckCheck,
  ZoomIn,
  ZoomOut
} from 'lucide-vue-next'

export type CanvasTool = 'select' | 'bbox' | 'lasso' | 'polygon' | 'pan'
export type WorkspaceSubtype = 'bbox' | 'polygon' | 'classification'

withDefaults(
  defineProps<{
    subtype?: WorkspaceSubtype
    activeTool?: CanvasTool
    canUndo?: boolean
    canRedo?: boolean
    hasSelection?: boolean
    isSaving?: boolean
    canSubmit?: boolean
    hasNext?: boolean
    hasPrev?: boolean
    isDrawingPolygon?: boolean
  }>(),
  {
    subtype: 'bbox',
    activeTool: 'bbox',
    canUndo: false,
    canRedo: false,
    hasSelection: false,
    isSaving: false,
    canSubmit: true,
    hasNext: false,
    hasPrev: false,
    isDrawingPolygon: false,
  }
)

const emit = defineEmits<{
  'update:activeTool': [tool: CanvasTool]
  undo: []
  redo: []
  deleteSelected: []
  resetDraft: []
  next: []
  prev: []
  completePolygon: []
  zoomIn: []
  zoomOut: []
  resetZoom: []
}>()
</script>

<template>
  <div class="flex items-center justify-center w-full py-1 select-none">
    <div class="flex items-center gap-2">
      <!-- Main Dock Capsule: Essential Annotation Canvas Controls -->
      <div class="flex items-center h-12 px-2.5 rounded-2xl bg-card/95 border border-border shadow-xl backdrop-blur-xl text-muted-foreground">
        
        <!-- 1. Reset / Clear Draft -->
        <button
          type="button"
          class="flex size-8 items-center justify-center rounded-xl transition-all cursor-pointer hover:bg-muted hover:text-foreground active:scale-95 disabled:opacity-30 disabled:pointer-events-none"
          title="Reset / Clear Canvas"
          @click="emit('resetDraft')"
        >
          <RotateCcw class="size-4 stroke-[1.8]" />
        </button>

        <!-- Divider -->
        <div class="h-4 w-px bg-border mx-1.5"></div>

        <!-- 2. Primary Creation Tool by Subtype -->
        <!-- BBOX Mode: Rectangle Box + Freehand Lasso to Box -->
        <template v-if="subtype === 'bbox'">
          <button
            type="button"
            class="flex size-9 items-center justify-center rounded-xl transition-all cursor-pointer active:scale-95 font-medium"
            :class="[
              activeTool === 'bbox'
                ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25 font-bold'
                : 'hover:bg-muted hover:text-foreground'
            ]"
            title="Bounding Box Tool [B] (Click & Drag Rectangle)"
            @click="emit('update:activeTool', 'bbox')"
          >
            <Square class="size-4 stroke-[2.2]" />
          </button>

          <button
            type="button"
            class="flex size-9 items-center justify-center rounded-xl transition-all cursor-pointer active:scale-95 font-medium"
            :class="[
              activeTool === 'lasso'
                ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25 font-bold'
                : 'hover:bg-muted hover:text-foreground'
            ]"
            title="Lasso to Box Tool [L] (Draw around object, auto creates bounding box)"
            @click="emit('update:activeTool', 'lasso')"
          >
            <LassoSelect class="size-4 stroke-[2.2]" />
          </button>
        </template>

        <!-- POLYGON Mode -->
        <button
          v-if="subtype === 'polygon'"
          type="button"
          class="flex size-9 items-center justify-center rounded-xl transition-all cursor-pointer active:scale-95 font-medium"
          :class="[
            activeTool === 'polygon'
              ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25 font-bold'
              : 'hover:bg-muted hover:text-foreground'
          ]"
          title="Polygon Tool [P] (Click vertices to draw)"
          @click="emit('update:activeTool', 'polygon')"
        >
          <Scissors class="size-4 stroke-[2.2]" />
        </button>

        <!-- Complete Polygon Button (shown only when drawing polygon with >= 3 points) -->
        <button
          v-if="subtype === 'polygon' && isDrawingPolygon"
          type="button"
          class="flex size-8 items-center justify-center rounded-xl bg-success text-success-foreground shadow-md transition-all cursor-pointer hover:scale-105 active:scale-95 font-bold animate-pulse"
          title="Close Polygon [Enter]"
          @click="emit('completePolygon')"
        >
          <CheckCheck class="size-4 stroke-[2.5]" />
        </button>

        <!-- 3. Pointer / Select Tool -->
        <button
          type="button"
          class="flex size-9 items-center justify-center rounded-xl transition-all cursor-pointer active:scale-95 font-medium"
          :class="[
            activeTool === 'select'
              ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25 font-bold'
              : 'hover:bg-muted hover:text-foreground'
          ]"
          title="Select / Pointer Tool [V]"
          @click="emit('update:activeTool', 'select')"
        >
          <MousePointer2 class="size-4 stroke-[2]" />
        </button>

        <!-- 4. Pan / Hand Tool -->
        <button
          type="button"
          class="flex size-9 items-center justify-center rounded-xl transition-all cursor-pointer active:scale-95 font-medium"
          :class="[
            activeTool === 'pan'
              ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25 font-bold'
              : 'hover:bg-muted hover:text-foreground'
          ]"
          title="Pan / Hand Tool [H]"
          @click="emit('update:activeTool', 'pan')"
        >
          <Move class="size-4 stroke-[2]" />
        </button>

        <!-- Divider -->
        <div class="h-4 w-px bg-border mx-1.5"></div>

        <!-- Zoom In / Out Controls (Available for all subtypes) -->
        <button
          type="button"
          class="flex size-8 items-center justify-center rounded-xl transition-all cursor-pointer hover:bg-muted hover:text-foreground active:scale-95"
          title="Zoom In [Ctrl + Scroll Up]"
          @click="emit('zoomIn')"
        >
          <ZoomIn class="size-4 stroke-[1.8]" />
        </button>
        <button
          type="button"
          class="flex size-8 items-center justify-center rounded-xl transition-all cursor-pointer hover:bg-muted hover:text-foreground active:scale-95"
          title="Zoom Out [Ctrl + Scroll Down]"
          @click="emit('zoomOut')"
        >
          <ZoomOut class="size-4 stroke-[1.8]" />
        </button>
        <button
          type="button"
          class="flex h-8 px-1.5 items-center justify-center rounded-xl text-[10px] font-mono font-bold transition-all cursor-pointer hover:bg-muted hover:text-foreground active:scale-95"
          title="Reset Zoom & Pan (100%)"
          @click="emit('resetZoom')"
        >
          1:1
        </button>

        <!-- Divider -->
        <div class="h-4 w-px bg-border mx-1.5"></div>

        <!-- 5. Undo & Redo Controls -->
        <button
          type="button"
          class="flex size-8 items-center justify-center rounded-xl transition-all cursor-pointer hover:bg-muted hover:text-foreground active:scale-95 disabled:opacity-30 disabled:pointer-events-none"
          :disabled="!canUndo"
          title="Undo [Ctrl+Z]"
          @click="emit('undo')"
        >
          <Undo2 class="size-4 stroke-[1.8]" />
        </button>

        <button
          type="button"
          class="flex size-8 items-center justify-center rounded-xl transition-all cursor-pointer hover:bg-muted hover:text-foreground active:scale-95 disabled:opacity-30 disabled:pointer-events-none"
          :disabled="!canRedo"
          title="Redo [Ctrl+Y]"
          @click="emit('redo')"
        >
          <Redo2 class="size-4 stroke-[1.8]" />
        </button>

        <!-- 6. Delete Selected Item (Trash) -->
        <button
          type="button"
          class="flex size-8 items-center justify-center rounded-xl transition-all cursor-pointer hover:bg-destructive/15 hover:text-destructive active:scale-95 disabled:opacity-30 disabled:pointer-events-none"
          :disabled="!hasSelection"
          title="Delete Selected Item [Delete]"
          @click="emit('deleteSelected')"
        >
          <Trash2 class="size-4 stroke-[1.8]" />
        </button>
      </div>

      <!-- Secondary Capsule: Queue Navigation (Prev / Next Task) -->
      <div class="flex items-center h-12 px-2 rounded-2xl bg-card/95 border border-border shadow-xl backdrop-blur-xl text-muted-foreground gap-1">
        <button
          type="button"
          class="flex size-8 items-center justify-center rounded-xl transition-all cursor-pointer hover:bg-muted hover:text-foreground active:scale-95 disabled:opacity-30 disabled:pointer-events-none"
          :disabled="!hasPrev"
          title="Previous Task"
          @click="emit('prev')"
        >
          <ChevronLeft class="size-4.5 stroke-[2]" />
        </button>

        <div class="h-4 w-px bg-border mx-0.5"></div>

        <button
          type="button"
          class="flex size-8 items-center justify-center rounded-xl transition-all cursor-pointer hover:bg-muted hover:text-foreground active:scale-95 disabled:opacity-30 disabled:pointer-events-none"
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
