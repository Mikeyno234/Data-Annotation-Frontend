import { ref, type Ref, type ComputedRef } from 'vue'
import type { ImagePolygon, LabelOption } from '@/types'
import { isPointInPolygon } from '@/utils/annotation'
import { toast } from '@/utils/toast'

export interface UsePolygonDrawingOptions {
  currentPolygons: ComputedRef<ImagePolygon[]>
  selectedItemId: Ref<string | null>
  currentLabel: Ref<string>
  availableLabels: ComputedRef<LabelOption[]>
  zoomScale: Ref<number>
  onCommit: (polygons: ImagePolygon[]) => void
  onRedraw: () => void
}

/**
 * ponytail: Clean composable for polygon segmentation drawing, vertex appending, snapping, and closing.
 */
export function usePolygonDrawing(options: UsePolygonDrawingOptions) {
  const {
    currentPolygons,
    selectedItemId,
    currentLabel,
    availableLabels,
    zoomScale,
    onCommit,
    onRedraw,
  } = options

  const currentPolyPoints = ref<Array<{ x: number; y: number }>>([])
  const hoverPolyPoint = ref<{ x: number; y: number } | null>(null)

  function startPolygonMouseDown(clickX: number, clickY: number, activeTool: string): boolean {
    if (activeTool === 'select') {
      const found = currentPolygons.value.find((p) => isPointInPolygon({ x: clickX, y: clickY }, p.points))
      selectedItemId.value = found ? found.id : null
      onRedraw()
      return true
    }

    // Check if clicking near start point to close
    const pts = currentPolyPoints.value
    if (pts.length >= 3) {
      const dist = Math.hypot(clickX - pts[0].x, clickY - pts[0].y)
      if (dist < 14 / zoomScale.value) {
        completePolygon()
        return true
      }
    }

    currentPolyPoints.value.push({ x: clickX, y: clickY })
    onRedraw()
    return true
  }

  function handlePolygonMouseMove(currentX: number, currentY: number) {
    if (currentPolyPoints.value.length > 0) {
      hoverPolyPoint.value = { x: currentX, y: currentY }
      onRedraw()
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
    selectedItemId.value = newPoly.id
    currentPolyPoints.value = []
    hoverPolyPoint.value = null
    onCommit(updated)
    onRedraw()
    toast.success('Polygon Finished', `${currentLabel.value} (${newPoly.points.length} points)`)
  }

  function popLastPoint() {
    if (currentPolyPoints.value.length > 0) {
      currentPolyPoints.value.pop()
      onRedraw()
    }
  }

  function cancelPolygon() {
    if (currentPolyPoints.value.length > 0) {
      currentPolyPoints.value = []
      hoverPolyPoint.value = null
      onRedraw()
      toast.info('Polygon drawing cancelled')
    }
  }

  function deletePolygon(id: string) {
    const updated = currentPolygons.value.filter((p) => p.id !== id)
    if (selectedItemId.value === id) selectedItemId.value = null
    onCommit(updated)
    onRedraw()
    toast.info('Annotation item deleted')
  }

  return {
    currentPolyPoints,
    hoverPolyPoint,
    startPolygonMouseDown,
    handlePolygonMouseMove,
    completePolygon,
    popLastPoint,
    cancelPolygon,
    deletePolygon,
  }
}
