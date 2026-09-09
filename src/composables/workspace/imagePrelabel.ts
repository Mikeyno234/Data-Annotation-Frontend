import type { ImageBox, ImagePolygon, LabelOption } from '@/types'

export function generateAutoPrelabelData(
  subtype: 'bbox' | 'polygon' | 'classification',
  w: number,
  h: number,
  labelObj?: LabelOption
): { poly?: ImagePolygon; box?: ImageBox } {
  if (subtype === 'polygon') {
    const cx = Math.round(w * 0.45)
    const cy = Math.round(h * 0.45)
    const r = Math.round(Math.min(w, h) * 0.2)
    return {
      poly: {
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
      },
    }
  }

  if (subtype === 'bbox') {
    return {
      box: {
        id: `ai-box-${Date.now()}`,
        x: Math.round(w * 0.2),
        y: Math.round(h * 0.25),
        width: Math.round(w * 0.45),
        height: Math.round(h * 0.5),
        label: labelObj?.name || 'Detected Object',
        confidence: 0.94,
        color: labelObj?.color || '#ccff00',
      },
    }
  }

  return {}
}
