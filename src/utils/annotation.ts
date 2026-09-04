/**
 * Core annotation math, geometry, and formatting utilities.
 * Pure functions designed for maximum testability and reuse across all workspace modalities.
 */

export interface BoxCoords {
  x: number
  y: number
  width: number
  height: number
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
