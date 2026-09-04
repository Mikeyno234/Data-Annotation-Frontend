<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import type { DataItem, ImageBox, LabelOption } from '@/types'
import { createDataItemMediaUrl } from '@/api/media'
import { useAnnotationSession } from '@/composables/useAnnotationSession'
import { toast } from '@/utils/toast'
import WorkspaceShell from '@/components/workspace/WorkspaceShell.vue'
import WorkspaceFloatingToolbar, { type CanvasTool } from '@/components/workspace/WorkspaceFloatingToolbar.vue'
import Button from '@/components/ui/Button.vue'
import Badge from '@/components/ui/Badge.vue'
import Card from '@/components/ui/Card.vue'
import CardContent from '@/components/ui/CardContent.vue'
import ImageBoxList from './image/ImageBoxList.vue'

const props = defineProps<{
  item: DataItem
  labels?: LabelOption[]
  annotationType?: string
  hasNext?: boolean
  hasPrev?: boolean
}>()

const emit = defineEmits<{
  submitted: []
  next: []
  prev: []
}>()

const activeTool = ref<CanvasTool>('bbox')

const defaultLabels = [{ name: 'Default label', color: '#38bdf8' }]
const availableLabels = computed(() => (props.labels?.length ? props.labels : defaultLabels))
const currentLabel = ref(props.labels?.[0]?.name || 'Default label')
const selectedBoxId = ref<string | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)

// Initialize the deep Annotation Session
const session = useAnnotationSession<ImageBox[]>({
  item: props.item,
  annotationType: props.annotationType || 'Image regions',
  initialPayload: [],
  validatePayload: (boxes) => {
    if (!boxes || boxes.length === 0) {
      return 'Annotation must contain at least 1 bounding box'
    }
    return null
  },
  onSubmitted: () => {
    emit('submitted')
  },
  onSelectLabelIndex: (index) => {
    const label = availableLabels.value[index]
    if (label) currentLabel.value = label.name
  },
  onDeleteSelected: () => {
    if (selectedBoxId.value) {
      deleteBox(selectedBoxId.value)
    }
  },
})

// Underlying image for the canvas
const imageEl = new Image()
imageEl.crossOrigin = 'anonymous'
let imageLoaded = false

imageEl.onload = () => {
  imageLoaded = true
  drawCanvas()
}

async function loadImage() {
  try {
    imageEl.src = await createDataItemMediaUrl(props.item.id)
  } catch {
    imageLoaded = false
  }
}

let isDrawing = false
let startX = 0
let startY = 0

function drawCanvas() {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const width = canvas.width
  const height = canvas.height
  ctx.clearRect(0, 0, width, height)

  // Draw source image or placeholder
  if (imageLoaded && imageEl.naturalWidth > 0) {
    ctx.drawImage(imageEl, 0, 0, width, height)
  } else {
    ctx.fillStyle = '#0f172a'
    ctx.fillRect(0, 0, width, height)
    ctx.fillStyle = '#475569'
    ctx.font = '12px Inter, sans-serif'
    ctx.fillText('Loading image…', 12, 20)
  }

  // Draw bounding boxes
  const boxes = session.payload.value || []
  boxes.forEach((box) => {
    const isSelected = box.id === selectedBoxId.value
    const color = box.color || '#10b981'

    ctx.fillStyle = isSelected ? `${color}33` : `${color}1a`
    ctx.fillRect(box.x, box.y, box.width, box.height)

    ctx.strokeStyle = isSelected ? '#ffffff' : color
    ctx.lineWidth = isSelected ? 3 : 2
    ctx.strokeRect(box.x, box.y, box.width, box.height)

    // Label tag
    ctx.fillStyle = color
    ctx.fillRect(box.x, box.y - 20, Math.max(box.label.length * 8 + 16, 70), 20)
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 11px Inter, sans-serif'
    ctx.fillText(
      `${box.label} (${(box.confidence ? box.confidence * 100 : 100).toFixed(0)}%)`,
      box.x + 4,
      box.y - 6
    )
  })
}

function handleMouseDown(e: MouseEvent) {
  const canvas = canvasRef.value
  if (!canvas) return
  const rect = canvas.getBoundingClientRect()
  startX = e.clientX - rect.left
  startY = e.clientY - rect.top

  const boxes = session.payload.value || []
  const clicked = boxes.find(
    (b) => startX >= b.x && startX <= b.x + b.width && startY >= b.y && startY <= b.y + b.height
  )

  if (activeTool.value === 'select') {
    selectedBoxId.value = clicked ? clicked.id : null
    drawCanvas()
    return
  }

  if (activeTool.value === 'pan') {
    return
  }

  // bbox tool mode
  if (clicked) {
    selectedBoxId.value = clicked.id
    drawCanvas()
    return
  }

  isDrawing = true
  selectedBoxId.value = null
}

function handleMouseMove(e: MouseEvent) {
  if (!isDrawing || activeTool.value !== 'bbox') return
  const canvas = canvasRef.value
  if (!canvas) return
  const rect = canvas.getBoundingClientRect()
  const currentX = e.clientX - rect.left
  const currentY = e.clientY - rect.top

  drawCanvas()

  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.strokeStyle = '#ccff00'
  ctx.lineWidth = 2
  ctx.strokeRect(startX, startY, currentX - startX, currentY - startY)
}

function handleMouseUp(e: MouseEvent) {
  if (!isDrawing || activeTool.value !== 'bbox') return
  isDrawing = false
  const canvas = canvasRef.value
  if (!canvas) return
  const rect = canvas.getBoundingClientRect()
  const endX = e.clientX - rect.left
  const endY = e.clientY - rect.top

  const x = Math.min(startX, endX)
  const y = Math.min(startY, endY)
  const width = Math.abs(endX - startX)
  const height = Math.abs(endY - startY)

  if (width > 15 && height > 15) {
    const labelObj = availableLabels.value.find((l) => l.name === currentLabel.value)
    const newBox: ImageBox = {
      id: `box-${Date.now()}`,
      x,
      y,
      width,
      height,
      label: currentLabel.value,
      confidence: 1.0,
      color: labelObj?.color || '#ccff00',
    }
    const updated = [...(session.payload.value || []), newBox]
    session.payload.value = updated
    selectedBoxId.value = newBox.id
    session.pushState(updated)
    toast.success('Bounding Box Created', `${currentLabel.value} [${Math.round(x)}, ${Math.round(y)}]`)
  }

  drawCanvas()
}

function deleteBox(id: string) {
  const updated = (session.payload.value || []).filter((b) => b.id !== id)
  session.payload.value = updated
  if (selectedBoxId.value === id) selectedBoxId.value = null
  session.pushState(updated)
  drawCanvas()
  toast.info('Bounding box deleted')
}

function resetDraft() {
  session.payload.value = []
  selectedBoxId.value = null
  session.pushState([])
  drawCanvas()
  toast.info('Draft Reset', 'All bounding boxes cleared.')
}

function autoPrelabel() {
  const canvas = canvasRef.value
  if (!canvas) return
  const w = canvas.width
  const h = canvas.height
  const labelObj = availableLabels.value[0]
  const sampleBox: ImageBox = {
    id: `ai-box-${Date.now()}`,
    x: Math.round(w * 0.2),
    y: Math.round(h * 0.25),
    width: Math.round(w * 0.45),
    height: Math.round(h * 0.5),
    label: labelObj?.name || 'Detected Object',
    confidence: 0.94,
    color: labelObj?.color || '#ccff00',
  }
  const updated = [...(session.payload.value || []), sampleBox]
  session.payload.value = updated
  selectedBoxId.value = sampleBox.id
  session.pushState(updated)
  drawCanvas()
  toast.success('AI Assisted', 'Suggested object region detected.')
}

// Redraw whenever payload updates (e.g. from undo/redo)
watch(
  () => session.payload.value,
  () => {
    drawCanvas()
  },
  { deep: true }
)

const hotkeyHints = [
  { key: '1-9', label: 'choose class' },
  { key: 'Delete', label: 'remove selected' },
  { key: 'Drag', label: 'draw box' },
]

onMounted(() => {
  loadImage()
  const canvas = canvasRef.value
  if (canvas) {
    canvas.width = canvas.offsetWidth
    canvas.height = 420
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
    modality-title="2D Bounding Box"
    modality-type="Image"
    class-label-title="Object class:"
    :hotkey-hints="hotkeyHints"
  >
    <!-- Floating Studio Toolbar Dock (Inspired by Modern Clean Studio Toolbar) -->
    <template #toolbar>
      <div class="w-full flex justify-center pb-2">
        <WorkspaceFloatingToolbar
          v-model:active-tool="activeTool"
          :can-undo="session.canUndo.value"
          :can-redo="session.canRedo.value"
          :has-selection="!!selectedBoxId"
          :is-saving="session.isSaving.value"
          :has-next="hasNext"
          :has-prev="hasPrev"
          @undo="session.undo()"
          @redo="session.redo()"
          @delete-selected="selectedBoxId && deleteBox(selectedBoxId)"
          @reset-draft="resetDraft"
          @auto-prelabel="autoPrelabel"
          @save-draft="session.saveDraft()"
          @submit="session.submit()"
          @next="emit('next')"
          @prev="emit('prev')"
        />
      </div>
    </template>

    <!-- Canvas Viewport -->
    <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <div class="lg:col-span-3">
        <Card class="overflow-hidden bg-card/90 shadow-sm relative group">
          <CardContent class="p-4">
            <canvas
              ref="canvasRef"
              class="w-full h-[450px] rounded-2xl block shadow-inner bg-black/5 dark:bg-black/40 transition-colors"
              :class="[
                activeTool === 'bbox' ? 'cursor-crosshair' : '',
                activeTool === 'select' ? 'cursor-default' : '',
                activeTool === 'pan' ? 'cursor-grab' : '',
              ]"
              @mousedown="handleMouseDown"
              @mousemove="handleMouseMove"
              @mouseup="handleMouseUp"
            ></canvas>
          </CardContent>
        </Card>
      </div>

      <!-- Bounding Boxes Inspector -->
      <div class="lg:col-span-1">
        <ImageBoxList
          :boxes="session.payload.value || []"
          :selected-box-id="selectedBoxId"
          :has-prelabel="session.hasPrelabel.value"
          @select="selectedBoxId = $event; drawCanvas()"
          @delete="deleteBox($event)"
        />
      </div>
    </div>
  </WorkspaceShell>
</template>
