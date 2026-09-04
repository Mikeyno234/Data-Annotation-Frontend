/**
 * Core annotation math, geometry, and formatting utilities.
 * Pure functions designed for maximum testability and reuse across all workspace modalities.
 */

import type { LabelOption } from '@/types'

export interface BoxCoords {
  x: number
  y: number
  width: number
  height: number
}

const DEFAULT_LABEL_PALETTE = [
  '#38bdf8', '#10b981', '#f59e0b', '#ec4899',
  '#8b5cf6', '#06b6d4', '#f97316', '#14b8a6'
]

/**
 * Parses Label Studio XML configuration string into structured LabelOption array.
 * Supports <Label>, <Choice> elements with background colors.
 */
export function parseLabelConfigXml(config?: string, fallbackPalette = DEFAULT_LABEL_PALETTE): LabelOption[] {
  if (!config || !config.trim()) return []

  try {
    const doc = new DOMParser().parseFromString(config, 'application/xml')
    const nodes = Array.from(doc.querySelectorAll('Label, Choice'))
    if (nodes.length > 0) {
      return nodes.map((label, index) => ({
        name: label.getAttribute('value')?.trim() || label.getAttribute('alias')?.trim() || '',
        color: label.getAttribute('background') || fallbackPalette[index % fallbackPalette.length],
      })).filter((l) => l.name)
    }
  } catch {}

  // Fallback regex in case DOMParser errors on malformed XML
  const matches = [...config.matchAll(/<(?:Label|Choice)[^>]*?(?:value|alias)=["']([^"']+)["'][^>]*?>/gi)]
  return matches.map((m, idx) => {
    const name = m[1] || ''
    const bgMatch = m[0].match(/background=["']([^"']+)["']/i)
    const color = bgMatch ? bgMatch[1] : fallbackPalette[idx % fallbackPalette.length]
    return { name: name.trim(), color }
  }).filter((l) => l.name)
}

/**
 * Clamps a number between min and max bounds.
 */
export function clamp(value: number, min: number, max: number): number {
  if (min > max) throw new Error('min cannot be greater than max')
  return Math.min(Math.max(value, min), max)
}

/**
 * Calculates area of a bounding box.
 */
export function calculateBBoxArea(width: number, height: number): number {
  return Math.max(0, width) * Math.max(0, height)
}

/**
 * Formats lead time seconds into human-readable MM:SS format.
 */
export function formatLeadTime(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds))
  const minutes = Math.floor(safeSeconds / 60)
  const remainingSeconds = safeSeconds % 60
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
}

/**
 * Formats audio playback seconds with milliseconds precision (MM:SS.ms).
 */
export function formatAudioTimestamp(seconds: number): string {
  const safeSec = Math.max(0, seconds)
  const mins = Math.floor(safeSec / 60)
  const secs = (safeSec % 60).toFixed(2)
  const paddedSecs = Number(secs) < 10 ? `0${secs}` : secs
  return `${mins.toString().padStart(2, '0')}:${paddedSecs}`
}

/**
 * Normalizes bounding box coordinates to 0..1 scale relative to image dimensions.
 */
export function normalizeBoxCoordinates(box: BoxCoords, imgWidth: number, imgHeight: number): BoxCoords {
  if (imgWidth <= 0 || imgHeight <= 0) {
    return { x: 0, y: 0, width: 0, height: 0 }
  }

  const x = clamp(box.x / imgWidth, 0, 1)
  const y = clamp(box.y / imgHeight, 0, 1)
  const width = clamp(box.width / imgWidth, 0, 1 - x)
  const height = clamp(box.height / imgHeight, 0, 1 - y)

  return { x, y, width, height }
}

/**
 * Denormalizes 0..1 bounding box coordinates back to pixel space.
 */
export function denormalizeBoxCoordinates(box: BoxCoords, imgWidth: number, imgHeight: number): BoxCoords {
  const x = box.x * imgWidth
  const y = box.y * imgHeight
  const width = box.width * imgWidth
  const height = box.height * imgHeight

  return { x, y, width, height }
}

/**
 * Ray-casting algorithm to test if a 2D point is inside a polygon.
 */
export function isPointInPolygon(point: { x: number; y: number }, vertices: Array<{ x: number; y: number }>): boolean {
  if (vertices.length < 3) return false
  let inside = false
  for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
    const xi = vertices[i].x, yi = vertices[i].y
    const xj = vertices[j].x, yj = vertices[j].y
    const intersect = yi > point.y !== yj > point.y && point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi
    if (intersect) inside = !inside
  }
  return inside
}

export interface RGB {
  r: number
  g: number
  b: number
}

/**
 * Converts a hex color string (#fff or #ffffff) to RGB object.
 */
export function hexToRgb(hex: string): RGB | null {
  const cleanHex = hex.replace('#', '').trim()
  if (cleanHex.length === 3) {
    const r = parseInt(cleanHex[0] + cleanHex[0], 16)
    const g = parseInt(cleanHex[1] + cleanHex[1], 16)
    const b = parseInt(cleanHex[2] + cleanHex[2], 16)
    return isNaN(r) || isNaN(g) || isNaN(b) ? null : { r, g, b }
  }
  if (cleanHex.length === 6) {
    const r = parseInt(cleanHex.substring(0, 2), 16)
    const g = parseInt(cleanHex.substring(2, 4), 16)
    const b = parseInt(cleanHex.substring(4, 6), 16)
    return isNaN(r) || isNaN(g) || isNaN(b) ? null : { r, g, b }
  }
  return null
}

/**
 * Computes Euclidean color distance in RGB space.
 */
export function colorDistance(c1: RGB, c2: RGB): number {
  const dr = c1.r - c2.r
  const dg = c1.g - c2.g
  const db = c1.b - c2.b
  return Math.sqrt(dr * dr + dg * dg + db * db)
}

/**
 * Snaps a freehand lasso region to the precise pixels matching the target color (within tolerance),
 * or foreground contrast if no target color is given.
 */
export function computeColorLassoBounds(
  imgData: ImageData,
  lassoVertices: Array<{ x: number; y: number }>,
  targetColorHex?: string,
  tolerance = 48
): BoxCoords | null {
  if (lassoVertices.length < 3) return null

  // 1. Compute bounding envelope of the user's lasso
  let minLx = Infinity, minLy = Infinity, maxLx = -Infinity, maxLy = -Infinity
  lassoVertices.forEach((p) => {
    minLx = Math.min(minLx, p.x)
    minLy = Math.min(minLy, p.y)
    maxLx = Math.max(maxLx, p.x)
    maxLy = Math.max(maxLy, p.y)
  })

  const startX = clamp(Math.floor(minLx), 0, imgData.width - 1)
  const startY = clamp(Math.floor(minLy), 0, imgData.height - 1)
  const endX = clamp(Math.ceil(maxLx), 0, imgData.width - 1)
  const endY = clamp(Math.ceil(maxLy), 0, imgData.height - 1)

  const targetRgb = targetColorHex ? hexToRgb(targetColorHex) : null

  // If no target hex specified, sample the median color inside the lasso
  let sampleRgb = targetRgb
  if (!sampleRgb) {
    const cx = Math.round((minLx + maxLx) / 2)
    const cy = Math.round((minLy + maxLy) / 2)
    const sampleIdx = (cy * imgData.width + cx) * 4
    sampleRgb = {
      r: imgData.data[sampleIdx],
      g: imgData.data[sampleIdx + 1],
      b: imgData.data[sampleIdx + 2],
    }
  }

  let boundMinX = Infinity
  let boundMinY = Infinity
  let boundMaxX = -Infinity
  let boundMaxY = -Infinity
  let matchingPixelCount = 0

  const { width, data } = imgData

  // Scan pixels strictly inside the lasso envelope
  for (let py = startY; py <= endY; py++) {
    for (let px = startX; px <= endX; px++) {
      // Must be inside the lasso polygon
      if (!isPointInPolygon({ x: px, y: py }, lassoVertices)) continue

      const idx = (py * width + px) * 4
      const r = data[idx]
      const g = data[idx + 1]
      const b = data[idx + 2]
      const a = data[idx + 3]

      // Ignore fully transparent pixels
      if (a < 20) continue

      const dist = colorDistance({ r, g, b }, sampleRgb)
      if (dist <= tolerance) {
        matchingPixelCount++
        boundMinX = Math.min(boundMinX, px)
        boundMinY = Math.min(boundMinY, py)
        boundMaxX = Math.max(boundMaxX, px)
        boundMaxY = Math.max(boundMaxY, py)
      }
    }
  }

  // If enough matching pixels found (at least 4 pixels), snap tight to those pixels!
  if (matchingPixelCount >= 4 && boundMinX <= boundMaxX && boundMinY <= boundMaxY) {
    return {
      x: boundMinX,
      y: boundMinY,
      width: Math.max(boundMaxX - boundMinX + 1, 1),
      height: Math.max(boundMaxY - boundMinY + 1, 1),
    }
  }

  // Fallback to geometric lasso bounds if color variance inside was too wide
  return {
    x: Math.round(minLx),
    y: Math.round(minLy),
    width: Math.max(Math.round(maxLx - minLx), 1),
    height: Math.max(Math.round(maxLy - minLy), 1),
  }
}
