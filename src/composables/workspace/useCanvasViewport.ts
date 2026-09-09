import { ref, type Ref } from 'vue'

export interface Point {
  x: number
  y: number
}

export interface UseCanvasViewportOptions {
  canvasRef: Ref<HTMLCanvasElement | null>
  onViewportChange?: () => void
}

/**
 * Composable for viewport transformation math: zoom clamping, pan bounds, and world-to-screen coordinate mapping.
 */
export function useCanvasViewport(options: UseCanvasViewportOptions) {
  const { canvasRef, onViewportChange } = options

  const zoomScale = ref(1.0)
  const panOffsetX = ref(0)
  const panOffsetY = ref(0)
  const isPanning = ref(false)

  let panStartX = 0
  let panStartY = 0

  function screenToWorld(sx: number, sy: number): Point {
    const canvas = canvasRef.value
    if (!canvas) return { x: sx, y: sy }
    const cx = canvas.width / 2
    const cy = canvas.height / 2
    const wx = (sx - cx - panOffsetX.value) / zoomScale.value + cx
    const wy = (sy - cy - panOffsetY.value) / zoomScale.value + cy
    return { x: wx, y: wy }
  }

  function worldToScreen(wx: number, wy: number): Point {
    const canvas = canvasRef.value
    if (!canvas) return { x: wx, y: wy }
    const cx = canvas.width / 2
    const cy = canvas.height / 2
    const sx = cx + panOffsetX.value + (wx - cx) * zoomScale.value
    const sy = cy + panOffsetY.value + (wy - cy) * zoomScale.value
    return { x: sx, y: sy }
  }

  function clampPan() {
    const canvas = canvasRef.value
    if (!canvas) return
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

    const clampedScale = Math.min(Math.max(targetScale, 1.0), 25.0)
    if (Math.abs(clampedScale - zoomScale.value) < 0.001) return

    const cx = canvas.width / 2
    const cy = canvas.height / 2
    const sx = mouseScreenX !== undefined ? mouseScreenX : cx
    const sy = mouseScreenY !== undefined ? mouseScreenY : cy

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

    onViewportChange?.()
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

  function startPan(clientX: number, clientY: number) {
    isPanning.value = true
    panStartX = clientX - panOffsetX.value
    panStartY = clientY - panOffsetY.value
  }

  function updatePan(clientX: number, clientY: number) {
    if (!isPanning.value) return
    panOffsetX.value = clientX - panStartX
    panOffsetY.value = clientY - panStartY
    clampPan()
    onViewportChange?.()
  }

  function endPan() {
    isPanning.value = false
  }

  function resetViewport() {
    zoomScale.value = 1.0
    panOffsetX.value = 0
    panOffsetY.value = 0
    onViewportChange?.()
  }

  return {
    zoomScale,
    panOffsetX,
    panOffsetY,
    isPanning,
    screenToWorld,
    worldToScreen,
    clampPan,
    applyZoom,
    handleWheel,
    startPan,
    updatePan,
    endPan,
    resetViewport,
  }
}
