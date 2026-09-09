import { ref, type Ref, type ComputedRef } from 'vue'
import type { ImageBox, LabelOption } from '@/types'
import { computeColorLassoBounds } from '@/utils/annotation'
import { toast } from '@/utils/toast'

export type ResizeHandle = 'tl' | 'tr' | 'bl' | 'br' | 't' | 'b' | 'l' | 'r'

export interface UseBBoxInteractionOptions {
  canvasRef: Ref<HTMLCanvasElement | null>
  currentBoxes: ComputedRef<ImageBox[]>
  selectedItemId: Ref<string | null>
  currentLabel: Ref<string>
  availableLabels: ComputedRef<LabelOption[]>
  zoomScale: Ref<number>
  screenToWorld: (sx: number, sy: number) => { x: number; y: number }
  worldToScreen: (wx: number, wy: number) => { x: number; y: number }
  onCommit: (boxes: ImageBox[]) => void
  onRedraw: () => void
  getImageElement?: () => HTMLImageElement | null
  isImageLoaded?: () => boolean
}

export function getBoxHandles(box: ImageBox): Array<{ type: ResizeHandle; x: number; y: number }> {
  const { x, y, width, height } = box
  return [
    { type: 'tl' as const, x, y },
    { type: 'tr' as const, x: x + width, y },
    { type: 'bl' as const, x, y: y + height },
    { type: 'br' as const, x: x + width, y: y + height },
    { type: 't' as const, x: x + width / 2, y },
    { type: 'b' as const, x: x + width / 2, y: y + height },
    { type: 'l' as const, x, y: y + height / 2 },
    { type: 'r' as const, x: x + width, y: y + height / 2 },
  ]
}

/**
 * ponytail: Clean composable for Bounding Box interactions (creation, handle resizing, dragging, color lasso).
 */
export function useBBoxInteraction(options: UseBBoxInteractionOptions) {
  const {
    canvasRef,
    currentBoxes,
    selectedItemId,
    currentLabel,
    availableLabels,
    zoomScale,
    screenToWorld,
    worldToScreen,
    onCommit,
    onRedraw,
    getImageElement,
    isImageLoaded,
  } = options

  // Dragging & Resizing state
  let activeHandle: ResizeHandle | null = null
  let isDraggingBox = false
  let dragBoxStartX = 0
  let dragBoxStartY = 0
  let initialBoxState: ImageBox | null = null

  // Creation state
  const isDrawingBox = ref(false)
  let startX = 0
  let startY = 0

  // Lasso state
  const lassoPoints = ref<Array<{ x: number; y: number }>>([])
  const isDrawingLasso = ref(false)

  function startBBoxMouseDown(clickX: number, clickY: number, activeTool: string): boolean {
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
        return true
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
      onRedraw()
      return true
    }

    // 3. If in select tool and clicked empty space -> deselect
    if (activeTool === 'select') {
      selectedItemId.value = null
      onRedraw()
      return true
    }

    // 4. Start drawing new box or freehand lasso
    startX = clickX
    startY = clickY

    if (activeTool === 'lasso') {
      isDrawingLasso.value = true
      lassoPoints.value = [{ x: clickX, y: clickY }]
    } else {
      isDrawingBox.value = true
    }
    selectedItemId.value = null
    return true
  }

  function handleBBoxMouseMove(currentX: number, currentY: number, sx: number, sy: number, activeTool: string) {
    // Lasso tracking: record freehand points along path
    if (isDrawingLasso.value && activeTool === 'lasso') {
      const pts = lassoPoints.value
      const lastPt = pts[pts.length - 1]
      if (!lastPt || Math.hypot(currentX - lastPt.x, currentY - lastPt.y) >= 2 / zoomScale.value) {
        pts.push({ x: currentX, y: currentY })
        onRedraw()
      }
      return
    }

    // BBox Editing: Resizing via Handle
    if (activeHandle && initialBoxState) {
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
        onRedraw()
      }
      return
    }

    // BBox Editing: Moving existing box
    if (isDraggingBox && initialBoxState) {
      const dx = currentX - dragBoxStartX
      const dy = currentY - dragBoxStartY
      const boxIdx = currentBoxes.value.findIndex((b) => b.id === initialBoxState!.id)
      if (boxIdx >= 0) {
        currentBoxes.value[boxIdx] = {
          ...currentBoxes.value[boxIdx],
          x: Math.round(initialBoxState.x + dx),
          y: Math.round(initialBoxState.y + dy),
        }
        onRedraw()
      }
      return
    }

    // BBox Creation: Drawing preview box
    if (isDrawingBox.value && activeTool === 'bbox') {
      onRedraw()
      const canvas = canvasRef.value
      if (!canvas) return
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

  function handleBBoxMouseUp(e: MouseEvent, activeTool: string) {
    // Commit box resize/move changes
    if (activeHandle || isDraggingBox) {
      activeHandle = null
      isDraggingBox = false
      initialBoxState = null
      onCommit([...currentBoxes.value])
      onRedraw()
      return
    }

    // Complete Lasso to BBox (Smart Pixel Color Snapping)
    if (isDrawingLasso.value && activeTool === 'lasso') {
      isDrawingLasso.value = false
      const pts = lassoPoints.value
      lassoPoints.value = []

      if (pts.length >= 3) {
        const labelObj = availableLabels.value.find((l) => l.name === currentLabel.value)
        let finalBounds: { x: number; y: number; width: number; height: number } | null = null

        const mainCanvas = canvasRef.value
        const imageEl = getImageElement ? getImageElement() : null
        const loaded = isImageLoaded ? isImageLoaded() : false

        try {
          if (mainCanvas && loaded && imageEl && imageEl.naturalWidth > 0) {
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
        } catch {}

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
          selectedItemId.value = newBox.id
          onCommit(updated)
          toast.success('Color-Snapping Box Created', `${currentLabel.value} [${newBox.width}x${newBox.height}px]`)
        }
      }
      onRedraw()
      return
    }

    if (!isDrawingBox.value || activeTool !== 'bbox') return
    isDrawingBox.value = false
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
      selectedItemId.value = newBox.id
      onCommit(updated)
      toast.success('Bounding Box Created', `${currentLabel.value} [${newBox.width}x${newBox.height}px]`)
    }
    onRedraw()
  }

  function updateBoxLabel(boxId: string, newLabel: string, newColor: string) {
    const boxIdx = currentBoxes.value.findIndex((b) => b.id === boxId)
    if (boxIdx >= 0) {
      currentBoxes.value[boxIdx] = {
        ...currentBoxes.value[boxIdx],
        label: newLabel,
        color: newColor,
      }
      onCommit([...currentBoxes.value])
      onRedraw()
      toast.success('Label Changed', newLabel)
    }
  }

  function deleteBox(id: string) {
    const updated = currentBoxes.value.filter((b) => b.id !== id)
    if (selectedItemId.value === id) selectedItemId.value = null
    onCommit(updated)
    onRedraw()
    toast.info('Annotation item deleted')
  }

  function cancelLasso() {
    if (lassoPoints.value.length > 0) {
      lassoPoints.value = []
      isDrawingLasso.value = false
      onRedraw()
      toast.info('Lasso cancelled')
    }
  }

  return {
    isDrawingBox,
    lassoPoints,
    isDrawingLasso,
    startBBoxMouseDown,
    handleBBoxMouseMove,
    handleBBoxMouseUp,
    updateBoxLabel,
    deleteBox,
    cancelLasso,
  }
}
