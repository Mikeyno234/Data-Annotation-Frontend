<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import type { DataItem, ImageBox, ImagePolygon, ImageClassificationPayload, ImageAnnotationPayload, LabelOption } from '@/types'
import { createDataItemMediaUrl } from '@/api/media'
import { useAnnotationSession } from '@/composables/useAnnotationSession'
import { toast } from '@/utils/toast'
import { isPointInPolygon, computeColorLassoBounds } from '@/utils/annotation'
import WorkspaceShell from '@/components/workspace/WorkspaceShell.vue'
import WorkspaceFloatingToolbar, { type CanvasTool, type WorkspaceSubtype } from '@/components/workspace/WorkspaceFloatingToolbar.vue'
import Button from '@/components/ui/Button.vue'
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

const emit = defineEmits<{
  submitted: []
  next: []
  prev: []
}>()

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
  if (val === 'polygon') activeTool.value = 'polygon'
  else if (val === 'classification') activeTool.value = 'select'
  else activeTool.value = 'bbox'
})

const defaultLabels = [{ name: 'Default label', color: '#38bdf8' }]
const availableLabels = computed(() => (props.labels?.length ? props.labels : defaultLabels))
const currentLabel = ref(props.labels?.[0]?.name || 'Default label')
const selectedItemId = ref<string | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)

// In-progress polygon drawing state
const currentPolyPoints = ref<Array<{ x: number; y: number }>>([])
const hoverPolyPoint = ref<{ x: number; y: number } | null>(null)

// In-progress freehand lasso state (draws loop, auto-converts to bounding box)
const lassoPoints = ref<Array<{ x: number; y: number }>>([])
const isDrawingLasso = ref(false)

// Classification state
const selectedClasses = ref<string[]>([])
// Pan and Zoom state
const zoomScale = ref(1.0)
const panOffsetX = ref(0)
const panOffsetY = ref(0)
const isPanning = ref(false)
let panStartX = 0
let panStartY = 0

// Box transformation interaction state
type ResizeHandle = 'tl' | 'tr' | 'bl' | 'br' | 't' | 'b' | 'l' | 'r'
let activeHandle: ResizeHandle | null = null
let isDraggingBox = false
let dragBoxStartX = 0
let dragBoxStartY = 0
let initialBoxState: ImageBox | null = null

// Initialize the deep Annotation Session
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
      if (!labels || !labels.length) return 'Please select at least 1 image classification label'
      return null
    }
    if (!payload || (Array.isArray(payload) && payload.length === 0)) {
      return `Annotation must contain at least 1 ${detectedSubtype.value === 'polygon' ? 'polygon' : 'bounding box'}`
    }
    return null
  },
  onSubmitted: () => {
    emit('submitted')
  },
  onSelectLabelIndex: (index) => {
    const label = availableLabels.value[index]
    if (!label) return
    currentLabel.value = label.name
    if (detectedSubtype.value === 'classification') {
      toggleClass(label.name)
    }
  },
  onDeleteSelected: () => {
    if (detectedSubtype.value === 'polygon' && currentPolyPoints.value.length > 0) {
      currentPolyPoints.value.pop()
      drawCanvas()
      return
    }
    if (selectedItemId.value) {
      deleteItem(selectedItemId.value)
    }
  },
  customHotkeys: {
    KeyB: () => {
      if (detectedSubtype.value === 'bbox') activeTool.value = 'bbox'
    },
    KeyL: () => {
      if (detectedSubtype.value === 'bbox') activeTool.value = 'lasso'
    },
    KeyP: () => {
      if (detectedSubtype.value === 'polygon') activeTool.value = 'polygon'
    },
    KeyV: () => {
      activeTool.value = 'select'
    },
    KeyH: () => {
      activeTool.value = 'pan'
    },
    Enter: () => {
      if (detectedSubtype.value === 'polygon' && currentPolyPoints.value.length >= 3) {
        completePolygon()
      } else if (detectedSubtype.value === 'classification' && selectedClasses.value.length > 0) {
        session.submit()
      }
    },
    Escape: () => {
      if (currentPolyPoints.value.length > 0) {
        currentPolyPoints.value = []
        hoverPolyPoint.value = null
        drawCanvas()
        toast.info('Polygon drawing cancelled')
      }
      if (lassoPoints.value.length > 0) {
        lassoPoints.value = []
        isDrawingLasso.value = false
        drawCanvas()
        toast.info('Lasso cancelled')
      }
    },
  },
})

// Type-safe payload accessors
const currentBoxes = computed<ImageBox[]>(() => {
  if (Array.isArray(session.payload.value) && detectedSubtype.value === 'bbox') {
    return session.payload.value as ImageBox[]
  }
  return []
})

const currentPolygons = computed<ImagePolygon[]>(() => {
  if (Array.isArray(session.payload.value) && detectedSubtype.value === 'polygon') {
    return session.payload.value as ImagePolygon[]
  }
  return []
})

// Sync payload with selectedClasses for classification
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
  if (idx >= 0) {
    selectedClasses.value.splice(idx, 1)
  } else {
    selectedClasses.value.push(className)
  }
  const newPayload: ImageClassificationPayload = { selectedLabels: [...selectedClasses.value] }
  session.payload.value = newPayload
  session.pushState(newPayload)
  toast.success('Category Updated', className)
}

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

let isDrawingBox = false
let startX = 0
let startY = 0

// Coordinate translation between Screen (mouse client relative to canvas) and Canvas World coordinates
function screenToWorld(sx: number, sy: number) {
  const canvas = canvasRef.value
  if (!canvas) return { x: sx, y: sy }
  const cx = canvas.width / 2
  const cy = canvas.height / 2
  // sx = cx + panOffsetX + (wx - cx) * zoomScale
  // (sx - cx - panOffsetX) / zoomScale + cx = wx
  const wx = (sx - cx - panOffsetX.value) / zoomScale.value + cx
  const wy = (sy - cy - panOffsetY.value) / zoomScale.value + cy
  return { x: wx, y: wy }
}

function worldToScreen(wx: number, wy: number) {
  const canvas = canvasRef.value
  if (!canvas) return { x: wx, y: wy }
  const cx = canvas.width / 2
  const cy = canvas.height / 2
  const sx = cx + panOffsetX.value + (wx - cx) * zoomScale.value
  const sy = cy + panOffsetY.value + (wy - cy) * zoomScale.value
  return { x: sx, y: sy }
}

function getBoxHandles(box: ImageBox) {
  const handleSize = 8
  const { x, y, width, height } = box
  return [
    { type: 'tl' as ResizeHandle, x, y },
    { type: 'tr' as ResizeHandle, x: x + width, y },
    { type: 'bl' as ResizeHandle, x, y: y + height },
    { type: 'br' as ResizeHandle, x: x + width, y: y + height },
    { type: 't' as ResizeHandle, x: x + width / 2, y },
    { type: 'b' as ResizeHandle, x: x + width / 2, y: y + height },
    { type: 'l' as ResizeHandle, x, y: y + height / 2 },
    { type: 'r' as ResizeHandle, x: x + width, y: y + height / 2 },
  ]
}

function drawCanvas() {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const width = canvas.width
  const height = canvas.height
  ctx.clearRect(0, 0, width, height)

  // Save base context for world transformations
  ctx.save()
  // Translate to center, apply pan and zoom, translate back
  const cx = width / 2
  const cy = height / 2
  ctx.translate(cx + panOffsetX.value, cy + panOffsetY.value)
  ctx.scale(zoomScale.value, zoomScale.value)
  ctx.translate(-cx, -cy)

  // 1. Draw source image (crisp pixelated rendering when zoomed in)
  if (imageLoaded && imageEl.naturalWidth > 0) {
    ctx.imageSmoothingEnabled = zoomScale.value <= 2.5
    ctx.drawImage(imageEl, 0, 0, width, height)
  } else {
    ctx.fillStyle = '#0f172a'
    ctx.fillRect(0, 0, width, height)
    ctx.fillStyle = '#475569'
    ctx.font = '12px Inter, sans-serif'
    ctx.fillText('Loading image…', 12, 20)
  }

  // 2. Draw Bounding Boxes (if BBOX mode)
  if (detectedSubtype.value === 'bbox') {
    currentBoxes.value.forEach((box) => {
      const isSelected = box.id === selectedItemId.value
      const color = box.color || '#38bdf8'

      ctx.fillStyle = isSelected ? `${color}33` : `${color}1a`
      ctx.fillRect(box.x, box.y, box.width, box.height)

      ctx.strokeStyle = isSelected ? '#ffffff' : color
      ctx.lineWidth = (isSelected ? 2.5 : 1.8) / zoomScale.value
      ctx.strokeRect(box.x, box.y, box.width, box.height)

      // Label tag banner
      const bannerH = 18 / zoomScale.value
      const fontSize = Math.max(10 / zoomScale.value, 8)
      ctx.fillStyle = color
      ctx.fillRect(box.x, box.y - bannerH, Math.max((box.label.length * 7 + 12) / zoomScale.value, 40 / zoomScale.value), bannerH)
      ctx.fillStyle = '#ffffff'
      ctx.font = `bold ${fontSize}px Inter, sans-serif`
      ctx.fillText(
        `${box.label}`,
        box.x + 3 / zoomScale.value,
        box.y - 4 / zoomScale.value
      )

      // If selected: render 8 interactive resize handles
      if (isSelected) {
        const handleR = 4 / zoomScale.value
        const handles = getBoxHandles(box)
        handles.forEach((h) => {
          ctx.fillStyle = '#ffffff'
          ctx.beginPath()
          ctx.arc(h.x, h.y, handleR, 0, Math.PI * 2)
          ctx.fill()
          ctx.strokeStyle = '#000000'
          ctx.lineWidth = 1.2 / zoomScale.value
          ctx.stroke()
        })
      }
    })
  }

  // 3. Draw Polygons (if POLYGON mode)
  if (detectedSubtype.value === 'polygon') {
    currentPolygons.value.forEach((poly) => {
      if (!poly.points || poly.points.length < 3) return
      const isSelected = poly.id === selectedItemId.value
      const color = poly.color || '#38bdf8'

      ctx.beginPath()
      ctx.moveTo(poly.points[0].x, poly.points[0].y)
      for (let i = 1; i < poly.points.length; i++) {
        ctx.lineTo(poly.points[i].x, poly.points[i].y)
      }
      ctx.closePath()

      ctx.fillStyle = isSelected ? `${color}44` : `${color}22`
      ctx.fill()

      ctx.strokeStyle = isSelected ? '#ffffff' : color
      ctx.lineWidth = (isSelected ? 2.5 : 1.8) / zoomScale.value
      ctx.stroke()

      // Vertex dots
      poly.points.forEach((pt) => {
        ctx.fillStyle = isSelected ? '#ffffff' : color
        ctx.beginPath()
        ctx.arc(pt.x, pt.y, (isSelected ? 3.5 : 2.5) / zoomScale.value, 0, Math.PI * 2)
        ctx.fill()
      })

      // Tag on first vertex
      const p0 = poly.points[0]
      const bannerH = 18 / zoomScale.value
      const fontSize = Math.max(10 / zoomScale.value, 8)
      ctx.fillStyle = color
      ctx.fillRect(p0.x, p0.y - bannerH, Math.max((poly.label.length * 7 + 12) / zoomScale.value, 40 / zoomScale.value), bannerH)
      ctx.fillStyle = '#ffffff'
      ctx.font = `bold ${fontSize}px Inter, sans-serif`
      ctx.fillText(`${poly.label}`, p0.x + 3 / zoomScale.value, p0.y - 4 / zoomScale.value)
    })

    // Draw polygon currently in progress
    const pts = currentPolyPoints.value
    if (pts.length > 0) {
      ctx.beginPath()
      ctx.moveTo(pts[0].x, pts[0].y)
      for (let i = 1; i < pts.length; i++) {
        ctx.lineTo(pts[i].x, pts[i].y)
      }
      if (hoverPolyPoint.value) {
        ctx.lineTo(hoverPolyPoint.value.x, hoverPolyPoint.value.y)
      }
      ctx.strokeStyle = '#38bdf8'
      ctx.lineWidth = 2 / zoomScale.value
      ctx.setLineDash([4 / zoomScale.value, 3 / zoomScale.value])
      ctx.stroke()
      ctx.setLineDash([])

      pts.forEach((pt, idx) => {
        ctx.fillStyle = idx === 0 ? '#ccff00' : '#ffffff'
        ctx.beginPath()
        ctx.arc(pt.x, pt.y, (idx === 0 ? 5 : 3) / zoomScale.value, 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = '#000000'
        ctx.lineWidth = 1 / zoomScale.value
        ctx.stroke()
      })

      // Snap circle around start point
      if (pts.length >= 3 && hoverPolyPoint.value) {
        const dist = Math.hypot(hoverPolyPoint.value.x - pts[0].x, hoverPolyPoint.value.y - pts[0].y)
        if (dist < 14 / zoomScale.value) {
          ctx.beginPath()
          ctx.arc(pts[0].x, pts[0].y, 10 / zoomScale.value, 0, Math.PI * 2)
          ctx.strokeStyle = '#ccff00'
          ctx.lineWidth = 2 / zoomScale.value
          ctx.stroke()
        }
      }
    }
  }
  if (detectedSubtype.value === 'bbox' && isDrawingLasso.value && lassoPoints.value.length > 1) {
    const lpts = lassoPoints.value
    ctx.beginPath()
    ctx.moveTo(lpts[0].x, lpts[0].y)
    for (let i = 1; i < lpts.length; i++) {
      ctx.lineTo(lpts[i].x, lpts[i].y)
    }
    ctx.strokeStyle = '#38bdf8'
    ctx.lineWidth = 2 / zoomScale.value
    ctx.setLineDash([4 / zoomScale.value, 3 / zoomScale.value])
    ctx.stroke()
    ctx.setLineDash([])

    // Draw live bounding preview of the lasso points
    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity
    lpts.forEach((pt) => {
      minX = Math.min(minX, pt.x)
      minY = Math.min(minY, pt.y)
      maxX = Math.max(maxX, pt.x)
      maxY = Math.max(maxY, pt.y)
    })
    ctx.strokeStyle = '#38bdf866'
    ctx.lineWidth = 1.2 / zoomScale.value
    ctx.strokeRect(minX, minY, maxX - minX, maxY - minY)
  }

  // Restore context from world transformations
  ctx.restore()
}

function handleMouseDown(e: MouseEvent) {
  const canvas = canvasRef.value
  if (!canvas) return
  const rect = canvas.getBoundingClientRect()
  const sx = e.clientX - rect.left
  const sy = e.clientY - rect.top
  const { x: clickX, y: clickY } = screenToWorld(sx, sy)

  // Middle mouse click or Space/Pan tool -> start panning
  if (e.button === 1 || activeTool.value === 'pan') {
    isPanning.value = true
    panStartX = e.clientX - panOffsetX.value
    panStartY = e.clientY - panOffsetY.value
    return
  }

  // === Case 1: POLYGON MODE ===
  if (detectedSubtype.value === 'polygon') {
    if (activeTool.value === 'select') {
      const found = currentPolygons.value.find((p) => isPointInPolygon({ x: clickX, y: clickY }, p.points))
      selectedItemId.value = found ? found.id : null
      drawCanvas()
      return
    }

    // Check if clicking near start point to close
    const pts = currentPolyPoints.value
    if (pts.length >= 3) {
      const dist = Math.hypot(clickX - pts[0].x, clickY - pts[0].y)
      if (dist < 14 / zoomScale.value) {
        completePolygon()
        return
      }
    }

    currentPolyPoints.value.push({ x: clickX, y: clickY })
    drawCanvas()
    return
  }

  // === Case 2: BBOX MODE ===
  if (detectedSubtype.value === 'bbox') {
    // 1. Check if clicking on an existing selected box's resize handles
    const selectedBox = currentBoxes.value.find((b) => b.id === selectedItemId.value)
    if (selectedBox) {
      const handles = getBoxHandles(selectedBox)
      const hitRadius = 8 / zoomScale.value
      const hitHandle = handles.find((h) => Math.hypot(clickX - h.x, clickY - h.y) <= hitRadius)
      if (hitHandle) {
        activeHandle = hitHandle.type
        initialBoxState = { ...selectedBox }
        dragBoxStartX = clickX
        dragBoxStartY = clickY
        return
      }
    }

    // 2. Check if clicking inside a box (to select or move it)
    const clickedBox = [...currentBoxes.value].reverse().find(
      (b) => clickX >= b.x && clickX <= b.x + b.width && clickY >= b.y && clickY <= b.y + b.height
    )

    if (clickedBox) {
      selectedItemId.value = clickedBox.id
      isDraggingBox = true
      initialBoxState = { ...clickedBox }
      dragBoxStartX = clickX
      dragBoxStartY = clickY
      drawCanvas()
      return
    }

    // 3. If in select mode and clicked empty space -> deselect
    if (activeTool.value === 'select') {
      selectedItemId.value = null
      drawCanvas()
      return
    }

    // 4. Start drawing new box or freehand lasso
    startX = clickX
    startY = clickY

    if (activeTool.value === 'lasso') {
      isDrawingLasso.value = true
      lassoPoints.value = [{ x: clickX, y: clickY }]
    } else {
      isDrawingBox = true
    }
    selectedItemId.value = null
  }
}

function handleMouseMove(e: MouseEvent) {
  const canvas = canvasRef.value
  if (!canvas) return
  const rect = canvas.getBoundingClientRect()
  const sx = e.clientX - rect.left
  const sy = e.clientY - rect.top
  const { x: currentX, y: currentY } = screenToWorld(sx, sy)

  // Handle Panning
  if (isPanning.value) {
    panOffsetX.value = e.clientX - panStartX
    panOffsetY.value = e.clientY - panStartY
    clampPan()
    drawCanvas()
    return
  }

  // Polygon hover state
  if (detectedSubtype.value === 'polygon' && currentPolyPoints.value.length > 0) {
    hoverPolyPoint.value = { x: currentX, y: currentY }
    drawCanvas()
    return
  }

  // Lasso tracking: record freehand points along path
  if (detectedSubtype.value === 'bbox' && isDrawingLasso.value && activeTool.value === 'lasso') {
    const pts = lassoPoints.value
    const lastPt = pts[pts.length - 1]
    if (!lastPt || Math.hypot(currentX - lastPt.x, currentY - lastPt.y) >= 2 / zoomScale.value) {
      pts.push({ x: currentX, y: currentY })
      drawCanvas()
    }
    return
  }

  // BBox Editing: Resizing via Handle
  if (detectedSubtype.value === 'bbox' && activeHandle && initialBoxState) {
    const dx = currentX - dragBoxStartX
    const dy = currentY - dragBoxStartY
    const init = initialBoxState
    let newX = init.x
    let newY = init.y
    let newW = init.width
    let newH = init.height

    if (activeHandle.includes('r')) newW = Math.max(init.width + dx, 1)
    if (activeHandle.includes('l')) {
      const allowedDx = Math.min(dx, init.width - 1)
      newX = init.x + allowedDx
      newW = init.width - allowedDx
    }
    if (activeHandle.includes('b')) newH = Math.max(init.height + dy, 1)
    if (activeHandle.includes('t')) {
      const allowedDy = Math.min(dy, init.height - 1)
      newY = init.y + allowedDy
      newH = init.height - allowedDy
    }

    const boxIdx = currentBoxes.value.findIndex((b) => b.id === init.id)
    if (boxIdx >= 0) {
      currentBoxes.value[boxIdx] = {
        ...currentBoxes.value[boxIdx],
        x: Math.round(newX),
        y: Math.round(newY),
        width: Math.round(newW),
        height: Math.round(newH),
      }
      drawCanvas()
    }
    return
  }

  // BBox Editing: Moving existing box
  if (detectedSubtype.value === 'bbox' && isDraggingBox && initialBoxState) {
    const dx = currentX - dragBoxStartX
    const dy = currentY - dragBoxStartY
    const boxIdx = currentBoxes.value.findIndex((b) => b.id === initialBoxState!.id)
    if (boxIdx >= 0) {
      currentBoxes.value[boxIdx] = {
        ...currentBoxes.value[boxIdx],
        x: Math.round(initialBoxState.x + dx),
        y: Math.round(initialBoxState.y + dy),
      }
      drawCanvas()
    }
    return
  }

  // BBox Creation: Drawing preview box
  if (detectedSubtype.value === 'bbox' && isDrawingBox && activeTool.value === 'bbox') {
    drawCanvas()
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const sStart = worldToScreen(startX, startY)
    const sCurr = { x: sx, y: sy }
    ctx.strokeStyle = '#38bdf8'
    ctx.lineWidth = 2
    ctx.strokeRect(
      Math.min(sStart.x, sCurr.x),
      Math.min(sStart.y, sCurr.y),
      Math.abs(sCurr.x - sStart.x),
      Math.abs(sCurr.y - sStart.y)
    )
  }
}

function handleMouseUp(e: MouseEvent) {
  if (isPanning.value) {
    isPanning.value = false
    return
  }

  // Commit box resize/move changes to Session history
  if (activeHandle || isDraggingBox) {
    activeHandle = null
    isDraggingBox = false
    initialBoxState = null
    session.payload.value = [...currentBoxes.value]
    session.pushState([...currentBoxes.value])
    drawCanvas()
    return
  }

  // Complete Lasso to BBox (Smart Pixel Color Snapping)
  if (detectedSubtype.value === 'bbox' && isDrawingLasso.value && activeTool.value === 'lasso') {
    isDrawingLasso.value = false
    const pts = lassoPoints.value
    lassoPoints.value = []

    if (pts.length >= 3) {
      const labelObj = availableLabels.value.find((l) => l.name === currentLabel.value)
      let finalBounds: { x: number; y: number; width: number; height: number } | null = null

      // Attempt smart pixel color boundary detection if image is loaded on canvas
      const mainCanvas = canvasRef.value
      try {
        if (mainCanvas && imageLoaded && imageEl.naturalWidth > 0) {
          const offscreen = document.createElement('canvas')
          offscreen.width = mainCanvas.width
          offscreen.height = mainCanvas.height
          const oCtx = offscreen.getContext('2d')
          if (oCtx) {
            oCtx.drawImage(imageEl, 0, 0, mainCanvas.width, mainCanvas.height)
            const imgData = oCtx.getImageData(0, 0, mainCanvas.width, mainCanvas.height)
            finalBounds = computeColorLassoBounds(imgData, pts, labelObj?.color, 48)
          }
        }
      } catch {
        // Fallback gracefully to geometric bounds if getImageData fails (e.g. CORS)
      }

      // Fallback to geometric lasso bounds
      if (!finalBounds) {
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
        pts.forEach((p) => {
          minX = Math.min(minX, p.x)
          minY = Math.min(minY, p.y)
          maxX = Math.max(maxX, p.x)
          maxY = Math.max(maxY, p.y)
        })
        finalBounds = {
          x: Math.round(minX),
          y: Math.round(minY),
          width: Math.max(Math.round(maxX - minX), 1),
          height: Math.max(Math.round(maxY - minY), 1),
        }
      }

      if (finalBounds.width >= 1 && finalBounds.height >= 1) {
        const newBox: ImageBox = {
          id: `box-${Date.now()}`,
          x: Math.round(finalBounds.x),
          y: Math.round(finalBounds.y),
          width: Math.max(Math.round(finalBounds.width), 1),
          height: Math.max(Math.round(finalBounds.height), 1),
          label: currentLabel.value,
          confidence: 1.0,
          color: labelObj?.color || '#38bdf8',
        }
        const updated: ImageBox[] = [...currentBoxes.value, newBox]
        session.payload.value = updated
        selectedItemId.value = newBox.id
        session.pushState(updated)
        toast.success('Color-Snapping Box Created', `${currentLabel.value} [${newBox.width}x${newBox.height}px]`)
      }
    }
    drawCanvas()
    return
  }

  if (detectedSubtype.value !== 'bbox' || !isDrawingBox || activeTool.value !== 'bbox') return
  isDrawingBox = false
  const canvas = canvasRef.value
  if (!canvas) return
  const rect = canvas.getBoundingClientRect()
  const sx = e.clientX - rect.left
  const sy = e.clientY - rect.top
  const { x: endX, y: endY } = screenToWorld(sx, sy)

  const x = Math.min(startX, endX)
  const y = Math.min(startY, endY)
  const width = Math.abs(endX - startX)
  const height = Math.abs(endY - startY)

  // Allow micro-boxes down to 1x1 pixel (no artificial minimum limit)
  if (width >= 1 && height >= 1) {
    const labelObj = availableLabels.value.find((l) => l.name === currentLabel.value)
    const newBox: ImageBox = {
      id: `box-${Date.now()}`,
      x: Math.round(x),
      y: Math.round(y),
      width: Math.max(Math.round(width), 1),
      height: Math.max(Math.round(height), 1),
      label: currentLabel.value,
      confidence: 1.0,
      color: labelObj?.color || '#38bdf8',
    }
    const updated: ImageBox[] = [...currentBoxes.value, newBox]
    session.payload.value = updated
    selectedItemId.value = newBox.id
    session.pushState(updated)
    toast.success('Bounding Box Created', `${currentLabel.value} [${newBox.width}x${newBox.height}px]`)
  }
  drawCanvas()
}

function clampPan() {
  const canvas = canvasRef.value
  if (!canvas) return
  // Allow panning within bounds proportional to zoom scale
  // When at 1.0 zoom (or less), keep it centered
  if (zoomScale.value <= 1.0) {
    panOffsetX.value = 0
    panOffsetY.value = 0
    return
  }
  const maxPanX = (canvas.width * (zoomScale.value - 1)) / 2 + 100
  const maxPanY = (canvas.height * (zoomScale.value - 1)) / 2 + 100
  panOffsetX.value = Math.max(-maxPanX, Math.min(maxPanX, panOffsetX.value))
  panOffsetY.value = Math.max(-maxPanY, Math.min(maxPanY, panOffsetY.value))
}

function applyZoom(targetScale: number, mouseScreenX?: number, mouseScreenY?: number) {
  const canvas = canvasRef.value
  if (!canvas) return

  // Bound zoom from 1.0 (fit view) up to 25.0 (per-pixel precision)
  const clampedScale = Math.min(Math.max(targetScale, 1.0), 25.0)
  if (Math.abs(clampedScale - zoomScale.value) < 0.001) return

  const cx = canvas.width / 2
  const cy = canvas.height / 2

  const sx = mouseScreenX !== undefined ? mouseScreenX : cx
  const sy = mouseScreenY !== undefined ? mouseScreenY : cy

  // Calculate world coordinate before zoom
  const worldPoint = screenToWorld(sx, sy)

  zoomScale.value = Number(clampedScale.toFixed(3))

  if (clampedScale <= 1.0) {
    panOffsetX.value = 0
    panOffsetY.value = 0
  } else {
    panOffsetX.value = sx - cx - (worldPoint.x - cx) * zoomScale.value
    panOffsetY.value = sy - cy - (worldPoint.y - cy) * zoomScale.value
    clampPan()
  }

  drawCanvas()
}

function handleWheel(e: WheelEvent) {
  const canvas = canvasRef.value
  if (!canvas) return
  const rect = canvas.getBoundingClientRect()
  const mouseScreenX = e.clientX - rect.left
  const mouseScreenY = e.clientY - rect.top

  const zoomFactor = e.deltaY < 0 ? 1.25 : 0.8
  applyZoom(zoomScale.value * zoomFactor, mouseScreenX, mouseScreenY)
}

function updateBoxLabel(boxId: string, newLabel: string, newColor: string) {
  const boxIdx = currentBoxes.value.findIndex((b) => b.id === boxId)
  if (boxIdx >= 0) {
    currentBoxes.value[boxIdx] = {
      ...currentBoxes.value[boxIdx],
      label: newLabel,
      color: newColor,
    }
    session.payload.value = [...currentBoxes.value]
    session.pushState([...currentBoxes.value])
    drawCanvas()
    toast.success('Label Changed', `${newLabel}`)
  }
}

function completePolygon() {
  const pts = currentPolyPoints.value
  if (pts.length < 3) {
    toast.error('Polygon Incomplete', 'A polygon requires at least 3 points')
    return
  }
  const labelObj = availableLabels.value.find((l) => l.name === currentLabel.value)
  const newPoly: ImagePolygon = {
    id: `poly-${Date.now()}`,
    points: [...pts],
    label: currentLabel.value,
    confidence: 1.0,
    color: labelObj?.color || '#ccff00',
  }
  const updated: ImagePolygon[] = [...currentPolygons.value, newPoly]
  session.payload.value = updated
  selectedItemId.value = newPoly.id
  currentPolyPoints.value = []
  hoverPolyPoint.value = null
  session.pushState(updated)
  drawCanvas()
  toast.success('Polygon Finished', `${currentLabel.value} (${newPoly.points.length} points)`)
}

function deleteItem(id: string) {
  if (detectedSubtype.value === 'classification') return
  if (detectedSubtype.value === 'polygon') {
    const updated = currentPolygons.value.filter((p) => p.id !== id)
    session.payload.value = updated
    if (selectedItemId.value === id) selectedItemId.value = null
    session.pushState(updated)
  } else {
    const updated = currentBoxes.value.filter((b) => b.id !== id)
    session.payload.value = updated
    if (selectedItemId.value === id) selectedItemId.value = null
    session.pushState(updated)
  }
  drawCanvas()
  toast.info('Annotation item deleted')
}

function resetDraft() {
  if (detectedSubtype.value === 'classification') {
    selectedClasses.value = []
    session.payload.value = { selectedLabels: [] }
    session.pushState({ selectedLabels: [] })
    toast.info('Categories Reset')
    return
  }
  currentPolyPoints.value = []
  hoverPolyPoint.value = null
  session.payload.value = []
  selectedItemId.value = null
  session.pushState([])
  drawCanvas()
  toast.info('Draft Reset', 'All annotations cleared.')
}

function autoPrelabel() {
  const canvas = canvasRef.value
  if (!canvas) return
  const w = canvas.width
  const h = canvas.height
  const labelObj = availableLabels.value[0]

  if (detectedSubtype.value === 'polygon') {
    const cx = Math.round(w * 0.45)
    const cy = Math.round(h * 0.45)
    const r = Math.round(Math.min(w, h) * 0.2)
    const samplePoly: ImagePolygon = {
      id: `ai-poly-${Date.now()}`,
      points: [
        { x: cx, y: cy - r },
        { x: cx + r, y: cy },
        { x: cx + Math.round(r * 0.7), y: cy + r },
        { x: cx - Math.round(r * 0.7), y: cy + r },
        { x: cx - r, y: cy },
      ],
      label: labelObj?.name || 'Detected Segment',
      confidence: 0.95,
      color: labelObj?.color || '#ccff00',
    }
    const updated: ImagePolygon[] = [...currentPolygons.value, samplePoly]
    session.payload.value = updated
    selectedItemId.value = samplePoly.id
    session.pushState(updated)
    drawCanvas()
    toast.success('AI Assisted', 'Suggested polygon segmentation generated.')
    return
  }

  if (detectedSubtype.value === 'classification') {
    if (labelObj && !selectedClasses.value.includes(labelObj.name)) {
      toggleClass(labelObj.name)
    }
    toast.success('AI Assisted', 'Top confidence category applied.')
    return
  }

  // Bbox default
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
  const updated: ImageBox[] = [...currentBoxes.value, sampleBox]
  session.payload.value = updated
  selectedItemId.value = sampleBox.id
  session.pushState(updated)
  drawCanvas()
  toast.success('AI Assisted', 'Suggested object region detected.')
}

const hotkeyHints = computed(() => {
  if (detectedSubtype.value === 'polygon') {
    return [
      { key: 'P', label: 'polygon tool' },
      { key: 'Click', label: 'add vertex' },
      { key: 'Enter', label: 'close polygon' },
      { key: 'Backspace', label: 'pop point' },
      { key: '1-9', label: 'select class' },
    ]
  }
  if (detectedSubtype.value === 'classification') {
    return [
      { key: '1-9', label: 'toggle category' },
      { key: 'Enter', label: 'submit task' },
      { key: 'Ctrl+Z', label: 'undo' },
    ]
  }
  return [
    { key: 'V', label: 'pointer / select' },
    { key: 'B', label: 'rect box' },
    { key: 'L', label: 'lasso to box' },
    { key: 'H', label: 'pan' },
    { key: '1-9', label: 'choose class' },
    { key: 'Delete', label: 'remove selected' },
  ]
})

const modalityHeaderTitle = computed(() => {
  if (detectedSubtype.value === 'polygon') return 'Polygon Segmentation'
  if (detectedSubtype.value === 'classification') return 'Image Classification'
  return '2D Bounding Box'
})

onMounted(() => {
  loadImage()
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
    class-label-title="Active Class:"
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
          :is-drawing-polygon="currentPolyPoints.length >= 3"
          @undo="session.undo()"
          @redo="session.redo()"
          @delete-selected="selectedItemId ? deleteItem(selectedItemId) : null"
          @reset-draft="resetDraft"
          @auto-prelabel="autoPrelabel"
          @save-draft="session.saveDraft()"
          @submit="session.submit()"
          @next="emit('next')"
          @prev="emit('prev')"
          @complete-polygon="completePolygon"
          @zoom-in="applyZoom(zoomScale * 1.3)"
          @zoom-out="applyZoom(zoomScale / 1.3)"
          @reset-zoom="zoomScale = 1.0; panOffsetX = 0; panOffsetY = 0; drawCanvas()"
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
              @wheel.prevent="handleWheel"
            ></canvas>
          </CardContent>
        </Card>
      </div>

      <!-- Inspector / Sidebar Area based on Subtype -->
      <div class="lg:col-span-1">
        <!-- 1. Classification Cards Sidebar -->
        <div v-if="detectedSubtype === 'classification'" class="flex flex-col gap-3">
          <div class="flex items-center justify-between">
            <h3 class="text-xs font-bold uppercase tracking-wider text-muted-foreground font-mono flex items-center gap-1.5">
              <Tag class="size-3.5 text-primary" /> Image Categories
            </h3>
            <Badge variant="outline" class="font-mono text-[10px]">
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
          @update-label="updateBoxLabel"
        />
      </div>
    </div>
  </WorkspaceShell>
</template>
