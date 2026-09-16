/**
 * Core annotation math, geometry, and formatting utilities.
 * Pure functions designed for maximum testability and reuse across all workspace modalities.
 */

import {
  TOOL_TYPES,
  type ToolType,
  type LabelOption,
  type AudioSegment,
  type ImageBox,
  type ImagePolygon,
  type ImageClassificationPayload,
  type ImageAnnotationPayload,
  type TextEntity,
  type VideoInterval,
} from '@/types'

export type { ToolType }

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

function normalizeToolType(toolType?: string): ToolType | null {
  const t = (toolType || '').trim().toUpperCase() as ToolType
  return (TOOL_TYPES as readonly string[]).includes(t) ? t : null
}

/**
 * Resolves the Image workspace editor mode. Exact-matches tool_type first
 * (BBOX/OBB -> bbox, POLYGON -> polygon, CHOICE/RADIO -> classification),
 * falling back to keyword-matching annotationType for legacy projects.
 */
export function resolveImageSubtype(toolType: string | undefined, annotationType: string | undefined): 'bbox' | 'polygon' | 'classification' {
  const exact = normalizeToolType(toolType)
  if (exact === 'BBOX' || exact === 'OBB') return 'bbox'
  if (exact === 'POLYGON') return 'polygon'
  if (exact === 'CHOICE' || exact === 'RADIO') return 'classification'

  const t = (annotationType || '').toUpperCase()
  if (t.includes('POLYGON') || t.includes('SEGMENTATION')) return 'polygon'
  if (t.includes('CHOICE') || t.includes('TAG') || t.includes('CLASSIF')) return 'classification'
  return 'bbox'
}

/**
 * Resolves the Video workspace editor mode. Exact-matches tool_type first
 * (TIMELINE -> timeline, CHOICE/RADIO -> classification), falling back to
 * keyword-matching annotationType for legacy projects.
 */
export function resolveVideoMode(toolType: string | undefined, annotationType: string | undefined): 'timeline' | 'classification' {
  const exact = normalizeToolType(toolType)
  if (exact === 'TIMELINE') return 'timeline'
  if (exact === 'CHOICE' || exact === 'RADIO') return 'classification'

  const t = (annotationType || '').toUpperCase()
  const isTimeline =
    t.includes('TIMELINE') || t.includes('INTERVAL') || t.includes('PER_DETIK') ||
    t.includes('PER-DETIK') || t.includes('TEMPORAL') || t.includes('SEGMENT') || t.includes('TRACK')
  if (isTimeline) return 'timeline'
  // Default to whole-video classification: clean, fast, zero split clutter.
  return 'classification'
}

/**
 * Resolves the Text workspace editor mode. Exact-matches tool_type first
 * (SPAN -> entities, CHOICE/RADIO -> classification), falling back to
 * keyword-matching annotationType for legacy projects.
 */
export function resolveTextMode(toolType: string | undefined, annotationType: string | undefined): 'entities' | 'classification' {
  const exact = normalizeToolType(toolType)
  if (exact === 'SPAN') return 'entities'
  if (exact === 'CHOICE' || exact === 'RADIO') return 'classification'

  const t = (annotationType || '').toUpperCase()
  const isClassification =
    t.includes('CLASSIF') || t.includes('SENTIMENT') || t.includes('INTENT') ||
    t.includes('TOPIC') || t.includes('CHOICE') || t.includes('CATEGORY')
  return isClassification ? 'classification' : 'entities'
}

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
      return nodes.map((label, index) => {
        const val = label.getAttribute('value')?.trim()
        const alias = label.getAttribute('alias')?.trim()
        const name = val || alias || ''
        return {
          name,
          color: label.getAttribute('background') || fallbackPalette[index % fallbackPalette.length],
        }
      }).filter((l) => l.name)
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

export interface SelectionOffsets {
  start: number
  end: number
  text: string
}

/**
 * Calculates exact character offsets of the current window selection relative to a container element.
 * Solves the duplicate word bug by using DOM Range coordinates instead of String.prototype.indexOf.
 * Automatically trims surrounding whitespace while maintaining offset precision.
 */
export function getSelectionCharacterOffsets(container: HTMLElement): SelectionOffsets | null {
  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return null

  const range = selection.getRangeAt(0)

  // Verify that the selection is actually inside the container
  if (!container.contains(range.startContainer) || !container.contains(range.endContainer)) {
    return null
  }

  const rawText = range.toString()
  if (!rawText || !rawText.trim()) return null

  // Calculate raw character start offset from start of container to range start
  const preCaretRange = range.cloneRange()
  preCaretRange.selectNodeContents(container)
  preCaretRange.setEnd(range.startContainer, range.startOffset)
  const rawStart = preCaretRange.toString().length

  // Calculate leading and trailing whitespace to adjust start/end to match trimmed text
  const leadingWhitespaceMatch = rawText.match(/^\s+/)
  const leadingSpaces = leadingWhitespaceMatch ? leadingWhitespaceMatch[0].length : 0
  const trimmed = rawText.trim()
  const start = rawStart + leadingSpaces
  const end = start + trimmed.length

  return {
    start,
    end,
    text: trimmed,
  }
}

export interface TextAnnotationPayload {
  entities: TextEntity[]
  sentiment?: string
  selectedLabels?: string[]
}

export interface VideoClassificationPayload {
  label: string
  notes?: string
  tags?: string[]
}

/**
 * Normalizes any incoming audio payload (whether direct array or wrapped in {segments})
 * into a well-typed AudioSegment array with direct canonical fields.
 */
export function normalizeAudioPayload(raw: unknown, fallbackSpeaker = 'Speaker 1'): AudioSegment[] {
  if (!raw) return []

  const rawObj = raw as Record<string, unknown>
  const list: Array<Record<string, unknown>> = Array.isArray(raw)
    ? (raw as Array<Record<string, unknown>>)
    : (typeof raw === 'object' && Array.isArray(rawObj.segments) ? (rawObj.segments as Array<Record<string, unknown>>) : [])

  return list.map((item, idx) => {
    const speaker = typeof item.speaker === 'string' && item.speaker ? item.speaker : fallbackSpeaker
    const transcript = typeof item.transcript === 'string' ? item.transcript : (typeof item.text === 'string' ? item.text : '')
    return {
      id: String(item.id || `seg-${Date.now()}-${idx}`),
      start: Number(item.start || 0),
      end: Number(item.end || 0),
      speaker,
      label: speaker,
      transcript,
      confidence: typeof item.confidence === 'number' ? item.confidence : 1.0,
    }
  })
}

/**
 * Serializes AudioSegments into canonical database payload structure.
 */
export function serializeAudioPayload(segments: AudioSegment[]): { segments: Array<Omit<AudioSegment, 'label'>> } {
  return {
    segments: (segments || []).map((seg) => ({
      id: seg.id,
      start: seg.start,
      end: seg.end,
      speaker: seg.speaker,
      transcript: seg.transcript || '',
      confidence: seg.confidence ?? 1.0,
    })),
  }
}

/**
 * Normalizes any incoming image payload (direct array, or wrapped in {regions} / {boxes})
 * into typed ImageBox[], ImagePolygon[], or ImageClassificationPayload with guaranteed IDs.
 */
export function normalizeImagePayload(
  raw: unknown,
  subtype: 'bbox' | 'polygon' | 'classification'
): ImageAnnotationPayload {
  if (!raw) {
    return subtype === 'classification' ? { selectedLabels: [] } : []
  }

  if (subtype === 'classification') {
    if (Array.isArray(raw)) {
      const labels = raw.map((item) => (typeof item === 'string' ? item : (item as Record<string, unknown>)?.label || '')).filter(Boolean) as string[]
      return { selectedLabels: labels }
    }
    if (typeof raw === 'object' && raw !== null) {
      const rawObj = raw as Record<string, unknown>
      if (Array.isArray(rawObj.selectedLabels)) {
        return { selectedLabels: rawObj.selectedLabels as string[] }
      }
      if (rawObj.label) {
        return { selectedLabels: [String(rawObj.label)] }
      }
    }
    return { selectedLabels: [] }
  }

  if (subtype === 'polygon') {
    const rawObj = raw as Record<string, unknown>
    const list: Array<Record<string, unknown>> = Array.isArray(raw)
      ? (raw as Array<Record<string, unknown>>)
      : (typeof raw === 'object' && Array.isArray(rawObj.polygons) ? (rawObj.polygons as Array<Record<string, unknown>>) : [])

    return list.map((item, idx): ImagePolygon => ({
      id: String(item.id || `poly-${Date.now()}-${idx}`),
      points: Array.isArray(item.points)
        ? (item.points as Array<Record<string, unknown>>).map((p) => ({ x: Number(p?.x || 0), y: Number(p?.y || 0) }))
        : [],
      label: typeof item.label === 'string' ? item.label : '',
      confidence: typeof item.confidence === 'number' ? item.confidence : 1.0,
      color: typeof item.color === 'string' ? item.color : undefined,
    }))
  }

  // Default: bbox
  const rawObj = raw as Record<string, unknown>
  const list: Array<Record<string, unknown>> = Array.isArray(raw)
    ? (raw as Array<Record<string, unknown>>)
    : (typeof raw === 'object' && Array.isArray(rawObj.regions)
        ? (rawObj.regions as Array<Record<string, unknown>>)
        : (typeof raw === 'object' && Array.isArray(rawObj.boxes) ? (rawObj.boxes as Array<Record<string, unknown>>) : []))

  return list.map((item, idx): ImageBox => ({
    id: String(item.id || `box-${Date.now()}-${idx}`),
    x: Number(item.x || 0),
    y: Number(item.y || 0),
    width: Number(item.width || 0),
    height: Number(item.height || 0),
    label: typeof item.label === 'string' ? item.label : '',
    confidence: typeof item.confidence === 'number' ? item.confidence : 1.0,
    color: typeof item.color === 'string' ? item.color : undefined,
  }))
}

/**
 * Normalizes text annotation payload to support both span tagging (NER) and text classification.
 */
export function normalizeTextPayload(raw: unknown): TextAnnotationPayload {
  if (!raw) {
    return { entities: [], sentiment: 'NEUTRAL', selectedLabels: [] }
  }

  if (Array.isArray(raw)) {
    return {
      entities: (raw as Array<Record<string, unknown>>).map((item, idx) => ({
        id: String(item.id || `ent-${Date.now()}-${idx}`),
        start: Number(item.start || 0),
        end: Number(item.end || 0),
        text: String(item.text || ''),
        label: String(item.label || ''),
        color: typeof item.color === 'string' ? item.color : undefined,
      })),
      sentiment: 'NEUTRAL',
      selectedLabels: [],
    }
  }

  if (typeof raw === 'object' && raw !== null) {
    const rawObj = raw as Record<string, unknown>
    const rawEntities = Array.isArray(rawObj.entities) ? (rawObj.entities as Array<Record<string, unknown>>) : []
    const entities = rawEntities.map((item, idx) => ({
      id: String(item.id || `ent-${Date.now()}-${idx}`),
      start: Number(item.start || 0),
      end: Number(item.end || 0),
      text: String(item.text || ''),
      label: String(item.label || ''),
      color: typeof item.color === 'string' ? item.color : undefined,
    }))

    const sentiment = String(rawObj.sentiment || 'NEUTRAL')
    let selectedLabels: string[] = []
    if (Array.isArray(rawObj.selectedLabels)) {
      selectedLabels = (rawObj.selectedLabels as unknown[]).map(String)
    } else if (rawObj.label) {
      selectedLabels = [String(rawObj.label)]
    }

    return { entities, sentiment, selectedLabels }
  }

  return { entities: [], sentiment: 'NEUTRAL', selectedLabels: [] }
}

/**
 * Normalizes video annotation payloads for timeline intervals and video-level classification.
 */
export function normalizeVideoPayload(
  raw: unknown,
  mode: 'timeline' | 'classification'
): VideoInterval[] | VideoClassificationPayload {
  if (!raw) {
    return mode === 'classification' ? { label: '', notes: '', tags: [] } : []
  }

  if (mode === 'classification') {
    if (typeof raw === 'string') {
      return { label: raw, notes: '', tags: [] }
    }
    if (typeof raw === 'object' && raw !== null && !Array.isArray(raw)) {
      const rawObj = raw as Record<string, unknown>
      const selectedLabel = Array.isArray(rawObj.selectedLabels) ? String(rawObj.selectedLabels[0] || '') : ''
      const label = rawObj.label ? String(rawObj.label) : selectedLabel
      return {
        label,
        notes: String(rawObj.notes || ''),
        tags: Array.isArray(rawObj.tags) ? (rawObj.tags as unknown[]).map(String) : [],
      }
    }
    if (Array.isArray(raw) && raw.length > 0) {
      const first = raw[0] as unknown
      const firstLabel = typeof first === 'string' ? first : ((first as Record<string, unknown>)?.label || '')
      return {
        label: String(firstLabel),
        notes: '',
        tags: (raw as unknown[]).map((r) => (typeof r === 'string' ? r : String((r as Record<string, unknown>)?.label || ''))).filter(Boolean),
      }
    }
    return { label: '', notes: '', tags: [] }
  }

  // Timeline mode
  const rawObj = raw as Record<string, unknown>
  const list: Array<Record<string, unknown>> = Array.isArray(raw)
    ? (raw as Array<Record<string, unknown>>)
    : (typeof raw === 'object' && raw !== null && Array.isArray(rawObj.intervals) ? (rawObj.intervals as Array<Record<string, unknown>>) : [])

  return list.map((item, idx): VideoInterval => ({
    id: String(item.id || `interval-${Date.now()}-${idx}`),
    start: Number(item.start || 0),
    end: Number(item.end || 0),
    label: String(item.label || ''),
    action: typeof item.action === 'string' ? item.action : undefined,
    track: typeof item.track === 'number' ? item.track : 0,
  }))
}

