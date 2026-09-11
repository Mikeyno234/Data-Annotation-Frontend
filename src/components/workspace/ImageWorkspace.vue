<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import type { DataItem, ImageBox, ImagePolygon, ImageClassificationPayload, ImageAnnotationPayload, LabelOption } from '@/types'
import { useMediaBlobUrl } from '@/composables/useMediaBlobUrl'
import { useAnnotationSession } from '@/composables/useAnnotationSession'
import { useCanvasViewport } from '@/composables/workspace/useCanvasViewport'
import { useBBoxInteraction } from '@/composables/workspace/useBBoxInteraction'
import { usePolygonDrawing } from '@/composables/workspace/usePolygonDrawing'
import { renderCanvasWorkspace } from '@/composables/workspace/canvasRenderer'
import { generateAutoPrelabelData } from '@/composables/workspace/imagePrelabel'
import { toast } from '@/utils/toast'
import WorkspaceShell from '@/components/workspace/WorkspaceShell.vue'
import WorkspaceFloatingToolbar, { type CanvasTool, type WorkspaceSubtype } from '@/components/workspace/WorkspaceFloatingToolbar.vue'
import Badge from '@/components/ui/Badge.vue'
import Card from '@/components/ui/Card.vue'
import CardContent from '@/components/ui/CardContent.vue'
import ImageBoxList from './image/ImageBoxList.vue'
import ImagePolygonList from './image/ImagePolygonList.vue'
import { Tag, Check } from 'lucide-vue-next'

const props = defineProps<{
  item: DataItem
  labels?: LabelOption[]
  annotationType?: string
  hasNext?: boolean
  hasPrev?: boolean
}>()

const emit = defineEmits<{ submitted: []; next: []; prev: [] }>()

const detectedSubtype = computed<WorkspaceSubtype>(() => {
  const t = (props.annotationType || '').toUpperCase()
  if (t.includes('POLYGON') || t.includes('SEGMENTATION')) return 'polygon'
  if (t.includes('CHOICE') || t.includes('TAG') || t.includes('CLASSIF')) return 'classification'
  return 'bbox'
})

const activeTool = ref<CanvasTool>(
  detectedSubtype.value === 'polygon' ? 'polygon' : detectedSubtype.value === 'classification' ? 'select' : 'bbox'
)

watch(detectedSubtype, (val) => {
  activeTool.value = val === 'polygon' ? 'polygon' : val === 'classification' ? 'select' : 'bbox'
})

const defaultLabels = [{ name: 'Default label', color: '#38bdf8' }]
const availableLabels = computed(() => (props.labels?.length ? props.labels : defaultLabels))
const currentLabel = ref(props.labels?.[0]?.name || 'Default label')
const selectedItemId = ref<string | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const selectedClasses = ref<string[]>([])

const imageEl = new Image()
imageEl.crossOrigin = 'anonymous'
let imageLoaded = false
imageEl.onload = () => { imageLoaded = true; drawCanvas() }
imageEl.onerror = () => { imageLoaded = false; drawCanvas() }

const { mediaUrl } = useMediaBlobUrl(() => props.item.id, {
  onSuccess: (url) => { imageEl.src = url },
  onError: () => { imageLoaded = false },
})

watch(mediaUrl, (newUrl) => {
  if (newUrl) {
    imageEl.src = newUrl
  } else {
    imageLoaded = false
    imageEl.removeAttribute('src')
    drawCanvas()
  }
})

// Deep Annotation Session
const session = useAnnotationSession<ImageAnnotationPayload>({
  item: props.item,
  annotationType: props.annotationType || (
    detectedSubtype.value === 'polygon' ? 'Image segmentation' :
    detectedSubtype.value === 'classification' ? 'Image classification' : 'Image regions'
  ),
  initialPayload: detectedSubtype.value === 'classification' ? { selectedLabels: [] } : [],
  validatePayload: (payload) => {
    if (detectedSubtype.value === 'classification') {
      const labels = (!Array.isArray(payload) && payload && 'selectedLabels' in payload)
        ? payload.selectedLabels
        : selectedClasses.value
      return (!labels || !labels.length) ? 'Please select at least 1 image classification label' : null
    }
    return (!payload || (Array.isArray(payload) && payload.length === 0))
      ? `Annotation must contain at least 1 ${detectedSubtype.value === 'polygon' ? 'polygon' : 'bounding box'}`
      : null
  },
  onSubmitted: () => emit('submitted'),
  onSelectLabelIndex: (index) => {
    const label = availableLabels.value[index]
    if (!label) return
    currentLabel.value = label.name
    if (detectedSubtype.value === 'classification') toggleClass(label.name)
  },
  onDeleteSelected: () => {
    if (detectedSubtype.value === 'polygon' && polygonDrawer.currentPolyPoints.value.length > 0) {
      polygonDrawer.popLastPoint()
      return
    }
    if (selectedItemId.value) deleteItem(selectedItemId.value)
  },
  customHotkeys: {
    KeyB: () => { if (detectedSubtype.value === 'bbox') activeTool.value = 'bbox' },
    KeyL: () => { if (detectedSubtype.value === 'bbox') activeTool.value = 'lasso' },
    KeyP: () => { if (detectedSubtype.value === 'polygon') activeTool.value = 'polygon' },
    KeyV: () => { activeTool.value = 'select' },
    KeyH: () => { activeTool.value = 'pan' },
    Enter: () => {
      if (detectedSubtype.value === 'polygon' && polygonDrawer.currentPolyPoints.value.length >= 3) {
        polygonDrawer.completePolygon()
      } else if (detectedSubtype.value === 'classification' && selectedClasses.value.length > 0) {
        session.submit()
      }
    },
    Escape: () => {
      polygonDrawer.cancelPolygon()
      bboxInteraction.cancelLasso()
    },
  },
})

const currentBoxes = computed<ImageBox[]>(() => {
  return (Array.isArray(session.payload.value) && detectedSubtype.value === 'bbox')
    ? session.payload.value as ImageBox[]
    : []
})

const currentPolygons = computed<ImagePolygon[]>(() => {
  return (Array.isArray(session.payload.value) && detectedSubtype.value === 'polygon')
    ? session.payload.value as ImagePolygon[]
    : []
})

watch(
  () => session.payload.value,
  (val) => {
    if (detectedSubtype.value === 'classification') {
      if (val && !Array.isArray(val) && Array.isArray((val as ImageClassificationPayload).selectedLabels)) {
        selectedClasses.value = [...(val as ImageClassificationPayload).selectedLabels]
      } else if (Array.isArray(val)) {
        selectedClasses.value = val.map((v: any) => v.label || v).filter(Boolean)
      }
    }
    drawCanvas()
  },
  { deep: true }
)

function toggleClass(className: string) {
  const idx = selectedClasses.value.indexOf(className)
  if (idx >= 0) selectedClasses.value.splice(idx, 1)
  else selectedClasses.value.push(className)
  const newPayload: ImageClassificationPayload = { selectedLabels: [...selectedClasses.value] }
  session.payload.value = newPayload
  session.pushState(newPayload)
  toast.success('Category Updated', className)
}

// Composables
const viewport = useCanvasViewport({ canvasRef, onViewportChange: () => drawCanvas() })

const bboxInteraction = useBBoxInteraction({
  canvasRef,
  currentBoxes,
  selectedItemId,
  currentLabel,
  availableLabels,
  zoomScale: viewport.zoomScale,
  screenToWorld: viewport.screenToWorld,
  worldToScreen: viewport.worldToScreen,
  onCommit: (boxes) => {
    session.payload.value = boxes
    session.pushState(boxes)
  },
  onRedraw: () => drawCanvas(),
  getImageElement: () => imageEl,
  isImageLoaded: () => imageLoaded,
})

const polygonDrawer = usePolygonDrawing({
  currentPolygons,
  selectedItemId,
  currentLabel,
  availableLabels,
  zoomScale: viewport.zoomScale,
  onCommit: (polygons) => {
    session.payload.value = polygons
    session.pushState(polygons)
  },
  onRedraw: () => drawCanvas(),
})

function drawCanvas() {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  renderCanvasWorkspace(ctx, {
    canvas,
    imageEl,
    imageLoaded,
    zoomScale: viewport.zoomScale.value,
    panOffsetX: viewport.panOffsetX.value,
    panOffsetY: viewport.panOffsetY.value,
    subtype: detectedSubtype.value,
    boxes: currentBoxes.value,
    polygons: currentPolygons.value,
    selectedItemId: selectedItemId.value,
    polyPoints: polygonDrawer.currentPolyPoints.value,
    hoverPolyPoint: polygonDrawer.hoverPolyPoint.value,
    lassoPoints: bboxInteraction.lassoPoints.value,
    isDrawingLasso: bboxInteraction.isDrawingLasso.value,
  })
}

function handleMouseDown(e: MouseEvent) {
  const canvas = canvasRef.value
  if (!canvas) return
  const rect = canvas.getBoundingClientRect()
  const sx = e.clientX - rect.left
  const sy = e.clientY - rect.top
  const { x: clickX, y: clickY } = viewport.screenToWorld(sx, sy)

  if (e.button === 1 || activeTool.value === 'pan') {
    viewport.startPan(e.clientX, e.clientY)
    return
  }
  if (detectedSubtype.value === 'polygon') polygonDrawer.startPolygonMouseDown(clickX, clickY, activeTool.value)
  else if (detectedSubtype.value === 'bbox') bboxInteraction.startBBoxMouseDown(clickX, clickY, activeTool.value)
}

function handleMouseMove(e: MouseEvent) {
  const canvas = canvasRef.value
  if (!canvas) return
  if (viewport.isPanning.value) {
    viewport.updatePan(e.clientX, e.clientY)
    return
  }
  const rect = canvas.getBoundingClientRect()
  const sx = e.clientX - rect.left
  const sy = e.clientY - rect.top
  const { x: currentX, y: currentY } = viewport.screenToWorld(sx, sy)

  if (detectedSubtype.value === 'polygon') polygonDrawer.handlePolygonMouseMove(currentX, currentY)
  else if (detectedSubtype.value === 'bbox') bboxInteraction.handleBBoxMouseMove(currentX, currentY, sx, sy, activeTool.value)
}

function handleMouseUp(e: MouseEvent) {
  if (viewport.isPanning.value) viewport.endPan()
  else if (detectedSubtype.value === 'bbox') bboxInteraction.handleBBoxMouseUp(e, activeTool.value)
}

function deleteItem(id: string) {
  if (detectedSubtype.value === 'polygon') polygonDrawer.deletePolygon(id)
  else if (detectedSubtype.value === 'bbox') bboxInteraction.deleteBox(id)
}

function resetDraft() {
  if (detectedSubtype.value === 'classification') {
    selectedClasses.value = []
    session.payload.value = { selectedLabels: [] }
    session.pushState({ selectedLabels: [] })
    toast.info('Categories Reset')
    return
  }
  polygonDrawer.cancelPolygon()
  session.payload.value = []
  selectedItemId.value = null
  session.pushState([])
  drawCanvas()
  toast.info('Draft Reset', 'All annotations cleared.')
}

function autoPrelabel() {
  const canvas = canvasRef.value
  if (!canvas) return
  const labelObj = availableLabels.value[0]

  if (detectedSubtype.value === 'classification') {
    if (labelObj && !selectedClasses.value.includes(labelObj.name)) toggleClass(labelObj.name)
    toast.success('AI Assisted', 'Top confidence category applied.')
    return
  }

  const { poly, box } = generateAutoPrelabelData(detectedSubtype.value, canvas.width, canvas.height, labelObj)
  if (poly) {
    const updated = [...currentPolygons.value, poly]
    session.payload.value = updated
    selectedItemId.value = poly.id
    session.pushState(updated)
    drawCanvas()
    toast.success('AI Assisted', 'Suggested polygon segmentation generated.')
  } else if (box) {
    const updated = [...currentBoxes.value, box]
    session.payload.value = updated
    selectedItemId.value = box.id
    session.pushState(updated)
    drawCanvas()
    toast.success('AI Assisted', 'Suggested object region detected.')
  }
}

const hotkeyHints = computed(() => {
  if (detectedSubtype.value === 'polygon') {
    return [
      { key: 'P', label: 'polygon tool' }, { key: 'Click', label: 'add vertex' },
      { key: 'Enter', label: 'close polygon' }, { key: 'Backspace', label: 'pop point' },
      { key: '1-9', label: 'select class' },
    ]
  }
  if (detectedSubtype.value === 'classification') {
    return [
      { key: '1-9', label: 'toggle category' }, { key: 'Enter', label: 'submit task' },
      { key: 'Ctrl+Z', label: 'undo' },
    ]
  }
  return [
    { key: 'V', label: 'pointer / select' }, { key: 'B', label: 'rect box' },
    { key: 'L', label: 'lasso to box' }, { key: 'H', label: 'pan' },
    { key: '1-9', label: 'choose class' }, { key: 'Delete', label: 'remove selected' },
  ]
})

const modalityHeaderTitle = computed(() => {
  if (detectedSubtype.value === 'polygon') return 'Polygon Segmentation'
  if (detectedSubtype.value === 'classification') return 'Image Classification'
  return '2D Bounding Box'
})

onMounted(() => {
  const canvas = canvasRef.value
  if (canvas) {
    canvas.width = canvas.offsetWidth || 800
    canvas.height = 440
    drawCanvas()
  }
})
</script>

<template>
  <WorkspaceShell
    :item="item"
    :session="session"
    :labels="labels"
    v-model:current-label="currentLabel"
    :modality-title="modalityHeaderTitle"
    modality-type="Image"
    :show-class-selector="detectedSubtype !== 'classification'"
    class-label-title="Active class"
    :hotkey-hints="hotkeyHints"
  >
    <!-- Floating Studio Toolbar Dock -->
    <template #toolbar>
      <div class="w-full flex justify-center pb-2">
        <WorkspaceFloatingToolbar
          :subtype="detectedSubtype"
          v-model:active-tool="activeTool"
          :can-undo="session.canUndo.value"
          :can-redo="session.canRedo.value"
          :has-selection="!!selectedItemId || selectedClasses.length > 0"
          :is-saving="session.isSaving.value"
          :has-next="hasNext"
          :has-prev="hasPrev"
          :is-drawing-polygon="polygonDrawer.currentPolyPoints.value.length >= 3"
          @undo="session.undo()"
          @redo="session.redo()"
          @delete-selected="selectedItemId ? deleteItem(selectedItemId) : null"
          @reset-draft="resetDraft"
          @auto-prelabel="autoPrelabel"
          @save-draft="session.saveDraft()"
          @submit="session.submit()"
          @next="emit('next')"
          @prev="emit('prev')"
          @complete-polygon="polygonDrawer.completePolygon"
          @zoom-in="viewport.applyZoom(viewport.zoomScale.value * 1.3)"
          @zoom-out="viewport.applyZoom(viewport.zoomScale.value / 1.3)"
          @reset-zoom="viewport.resetViewport()"
        />
      </div>
    </template>

    <!-- Workspace Main Layout -->
    <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <!-- Canvas Viewport -->
      <div class="lg:col-span-3">
        <Card class="overflow-hidden bg-card/90 shadow-sm relative group">
          <CardContent class="p-4">
            <canvas
              ref="canvasRef"
              class="w-full h-[450px] rounded-2xl block shadow-inner bg-black/5 dark:bg-black/40 transition-colors"
              :class="[
                activeTool === 'bbox' ? 'cursor-crosshair' : '',
                activeTool === 'lasso' ? 'cursor-crosshair' : '',
                activeTool === 'polygon' ? 'cursor-crosshair' : '',
                activeTool === 'select' ? 'cursor-default' : '',
                activeTool === 'pan' ? 'cursor-grab' : '',
              ]"
              @mousedown="handleMouseDown"
              @mousemove="handleMouseMove"
              @mouseup="handleMouseUp"
              @wheel.prevent="viewport.handleWheel"
            ></canvas>
          </CardContent>
        </Card>
      </div>

      <!-- Inspector / Sidebar Area based on Subtype -->
      <div class="lg:col-span-1">
        <!-- 1. Classification Cards Sidebar -->
        <div v-if="detectedSubtype === 'classification'" class="flex flex-col gap-3">
          <div class="flex items-center justify-between">
            <h3 class="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Tag class="size-3.5 text-muted-foreground" /> Image Categories
            </h3>
            <Badge variant="secondary" class="text-[11px] font-medium">
              {{ selectedClasses.length }} selected
            </Badge>
          </div>

          <p class="text-xs text-muted-foreground">
            Press <kbd class="px-1 py-0.5 rounded bg-muted font-mono font-bold text-foreground">1-9</kbd> or click to assign categories:
          </p>

          <div class="space-y-2">
            <button
              v-for="(lbl, idx) in availableLabels"
              :key="lbl.name"
              type="button"
              class="w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer shadow-2xs active:scale-98 text-left"
              :class="[
                selectedClasses.includes(lbl.name)
                  ? 'bg-primary/10 border-primary/60 ring-2 ring-primary/25 font-bold'
                  : 'bg-card/95 border-border/60 hover:bg-card hover:border-border hover:shadow-xs'
              ]"
              @click="toggleClass(lbl.name)"
            >
              <div class="flex items-center gap-2.5">
                <span
                  class="size-3 rounded-full shrink-0 shadow-2xs"
                  :style="{ backgroundColor: lbl.color || '#38bdf8' }"
                ></span>
                <span class="text-xs text-foreground">{{ lbl.name }}</span>
              </div>

              <div class="flex items-center gap-2">
                <span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted/80 text-muted-foreground font-bold">
                  {{ idx + 1 }}
                </span>
                <Check v-if="selectedClasses.includes(lbl.name)" class="size-4 text-primary stroke-[2.5]" />
              </div>
            </button>
          </div>
        </div>

        <!-- 2. Polygon Segmentation Inspector -->
        <ImagePolygonList
          v-else-if="detectedSubtype === 'polygon'"
          :polygons="currentPolygons"
          :selected-polygon-id="selectedItemId"
          :has-prelabel="session.hasPrelabel.value"
          @select="selectedItemId = $event; drawCanvas()"
          @delete="deleteItem($event)"
        />

        <!-- 3. Bounding Boxes Inspector -->
        <ImageBoxList
          v-else
          :boxes="currentBoxes"
          :selected-box-id="selectedItemId"
          :labels="labels"
          :has-prelabel="session.hasPrelabel.value"
          @select="selectedItemId = $event; drawCanvas()"
          @delete="deleteItem($event)"
          @update-label="bboxInteraction.updateBoxLabel"
        />
      </div>
    </div>
  </WorkspaceShell>
</template>
