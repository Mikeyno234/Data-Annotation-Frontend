import type { ImageBox, ImagePolygon } from '@/types'
import { getBoxHandles } from './useBBoxInteraction'

export interface DrawCanvasContext {
  canvas: HTMLCanvasElement
  imageEl: HTMLImageElement
  imageLoaded: boolean
  zoomScale: number
  panOffsetX: number
  panOffsetY: number
  subtype: 'bbox' | 'polygon' | 'classification'
  boxes: ImageBox[]
  polygons: ImagePolygon[]
  selectedItemId: string | null
  polyPoints: Array<{ x: number; y: number }>
  hoverPolyPoint: { x: number; y: number } | null
  lassoPoints: Array<{ x: number; y: number }>
  isDrawingLasso: boolean
}

/**
 * ponytail: Pure 2D canvas renderer for image, bounding boxes, and polygon layers.
 */
export function renderCanvasWorkspace(ctx: CanvasRenderingContext2D, c: DrawCanvasContext) {
  const { width, height } = c.canvas
  ctx.clearRect(0, 0, width, height)

  ctx.save()
  const cx = width / 2
  const cy = height / 2
  ctx.translate(cx + c.panOffsetX, cy + c.panOffsetY)
  ctx.scale(c.zoomScale, c.zoomScale)
  ctx.translate(-cx, -cy)

  // 1. Source Image Layer
  if (c.imageLoaded && c.imageEl.naturalWidth > 0) {
    ctx.imageSmoothingEnabled = c.zoomScale <= 2.5
    ctx.drawImage(c.imageEl, 0, 0, width, height)
  } else {
    ctx.fillStyle = '#0f172a'
    ctx.fillRect(0, 0, width, height)
    ctx.fillStyle = '#475569'
    ctx.font = '12px Inter, sans-serif'
    ctx.fillText('Loading image…', 12, 20)
  }

  // 2. Bounding Boxes Layer
  if (c.subtype === 'bbox') {
    c.boxes.forEach((box) => {
      const isSelected = box.id === c.selectedItemId
      const color = box.color || '#38bdf8'
      ctx.fillStyle = isSelected ? `${color}33` : `${color}1a`
      ctx.fillRect(box.x, box.y, box.width, box.height)
      ctx.strokeStyle = isSelected ? '#ffffff' : color
      ctx.lineWidth = (isSelected ? 2.5 : 1.8) / c.zoomScale
      ctx.strokeRect(box.x, box.y, box.width, box.height)

      const bannerH = 18 / c.zoomScale
      const fontSize = Math.max(10 / c.zoomScale, 8)
      ctx.fillStyle = color
      ctx.fillRect(box.x, box.y - bannerH, Math.max((box.label.length * 7 + 12) / c.zoomScale, 40 / c.zoomScale), bannerH)
      ctx.fillStyle = '#ffffff'
      ctx.font = `bold ${fontSize}px Inter, sans-serif`
      ctx.fillText(`${box.label}`, box.x + 3 / c.zoomScale, box.y - 4 / c.zoomScale)

      if (isSelected) {
        const handleR = 4 / c.zoomScale
        getBoxHandles(box).forEach((h) => {
          ctx.fillStyle = '#ffffff'
          ctx.beginPath()
          ctx.arc(h.x, h.y, handleR, 0, Math.PI * 2)
          ctx.fill()
          ctx.strokeStyle = '#000000'
          ctx.lineWidth = 1.2 / c.zoomScale
          ctx.stroke()
        })
      }
    })

    if (c.isDrawingLasso && c.lassoPoints.length > 1) {
      ctx.beginPath()
      ctx.moveTo(c.lassoPoints[0].x, c.lassoPoints[0].y)
      for (let i = 1; i < c.lassoPoints.length; i++) ctx.lineTo(c.lassoPoints[i].x, c.lassoPoints[i].y)
      ctx.strokeStyle = '#38bdf8'
      ctx.lineWidth = 2 / c.zoomScale
      ctx.setLineDash([4 / c.zoomScale, 3 / c.zoomScale])
      ctx.stroke()
      ctx.setLineDash([])
    }
  }

  // 3. Polygons Layer
  if (c.subtype === 'polygon') {
    c.polygons.forEach((poly) => {
      if (!poly.points || poly.points.length < 3) return
      const isSelected = poly.id === c.selectedItemId
      const color = poly.color || '#38bdf8'

      ctx.beginPath()
      ctx.moveTo(poly.points[0].x, poly.points[0].y)
      for (let i = 1; i < poly.points.length; i++) ctx.lineTo(poly.points[i].x, poly.points[i].y)
      ctx.closePath()
      ctx.fillStyle = isSelected ? `${color}44` : `${color}22`
      ctx.fill()
      ctx.strokeStyle = isSelected ? '#ffffff' : color
      ctx.lineWidth = (isSelected ? 2.5 : 1.8) / c.zoomScale
      ctx.stroke()

      poly.points.forEach((pt) => {
        ctx.fillStyle = isSelected ? '#ffffff' : color
        ctx.beginPath()
        ctx.arc(pt.x, pt.y, (isSelected ? 3.5 : 2.5) / c.zoomScale, 0, Math.PI * 2)
        ctx.fill()
      })

      const p0 = poly.points[0]
      const bannerH = 18 / c.zoomScale
      const fontSize = Math.max(10 / c.zoomScale, 8)
      ctx.fillStyle = color
      ctx.fillRect(p0.x, p0.y - bannerH, Math.max((poly.label.length * 7 + 12) / c.zoomScale, 40 / c.zoomScale), bannerH)
      ctx.fillStyle = '#ffffff'
      ctx.font = `bold ${fontSize}px Inter, sans-serif`
      ctx.fillText(`${poly.label}`, p0.x + 3 / c.zoomScale, p0.y - 4 / c.zoomScale)
    })

    const pts = c.polyPoints
    if (pts.length > 0) {
      ctx.beginPath()
      ctx.moveTo(pts[0].x, pts[0].y)
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y)
      if (c.hoverPolyPoint) ctx.lineTo(c.hoverPolyPoint.x, c.hoverPolyPoint.y)
      ctx.strokeStyle = '#38bdf8'
      ctx.lineWidth = 2 / c.zoomScale
      ctx.setLineDash([4 / c.zoomScale, 3 / c.zoomScale])
      ctx.stroke()
      ctx.setLineDash([])

      pts.forEach((pt, idx) => {
        ctx.fillStyle = idx === 0 ? '#ccff00' : '#ffffff'
        ctx.beginPath()
        ctx.arc(pt.x, pt.y, (idx === 0 ? 5 : 3) / c.zoomScale, 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = '#000000'
        ctx.lineWidth = 1 / c.zoomScale
        ctx.stroke()
      })

      if (pts.length >= 3 && c.hoverPolyPoint) {
        const dist = Math.hypot(c.hoverPolyPoint.x - pts[0].x, c.hoverPolyPoint.y - pts[0].y)
        if (dist < 14 / c.zoomScale) {
          ctx.beginPath()
          ctx.arc(pts[0].x, pts[0].y, 10 / c.zoomScale, 0, Math.PI * 2)
          ctx.strokeStyle = '#ccff00'
          ctx.lineWidth = 2 / c.zoomScale
          ctx.stroke()
        }
      }
    }
  }

  ctx.restore()
}
