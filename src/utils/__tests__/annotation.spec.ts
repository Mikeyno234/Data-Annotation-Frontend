import { describe, it, expect } from 'vitest'
import {
  clamp,
  calculateBBoxArea,
  formatLeadTime,
  formatAudioTimestamp,
  normalizeBoxCoordinates,
  denormalizeBoxCoordinates,
  hexToRgb,
  isPointInPolygon,
  computeColorLassoBounds,
  getSelectionCharacterOffsets,
} from '../annotation'

describe('Annotation Utilities', () => {
  describe('clamp', () => {
    it('clamps values within bounds', () => {
      expect(clamp(5, 0, 10)).toBe(5)
      expect(clamp(-5, 0, 10)).toBe(0)
      expect(clamp(15, 0, 10)).toBe(10)
    })

    it('throws error when min > max', () => {
      expect(() => clamp(5, 10, 0)).toThrow()
    })
  })

  describe('calculateBBoxArea', () => {
    it('calculates bounding box area correctly', () => {
      expect(calculateBBoxArea(100, 50)).toBe(5000)
      expect(calculateBBoxArea(0, 50)).toBe(0)
      expect(calculateBBoxArea(-10, 50)).toBe(0)
    })
  })

  describe('formatLeadTime', () => {
    it('formats seconds into MM:SS format', () => {
      expect(formatLeadTime(0)).toBe('00:00')
      expect(formatLeadTime(65)).toBe('01:05')
      expect(formatLeadTime(3600)).toBe('60:00')
      expect(formatLeadTime(-10)).toBe('00:00')
    })
  })

  describe('formatAudioTimestamp', () => {
    it('formats audio seconds with 2 decimal precision', () => {
      expect(formatAudioTimestamp(0)).toBe('00:00.00')
      expect(formatAudioTimestamp(3.456)).toBe('00:03.46')
      expect(formatAudioTimestamp(72.1)).toBe('01:12.10')
    })
  })

  describe('normalizeBoxCoordinates', () => {
    it('normalizes pixel coordinates to 0..1 range', () => {
      const box = { x: 192, y: 108, width: 384, height: 216 }
      const normalized = normalizeBoxCoordinates(box, 1920, 1080)

      expect(normalized.x).toBeCloseTo(0.1)
      expect(normalized.y).toBeCloseTo(0.1)
      expect(normalized.width).toBeCloseTo(0.2)
      expect(normalized.height).toBeCloseTo(0.2)
    })

    it('returns zeroed box when image dimensions are invalid', () => {
      const box = { x: 10, y: 10, width: 20, height: 20 }
      expect(normalizeBoxCoordinates(box, 0, 0)).toEqual({ x: 0, y: 0, width: 0, height: 0 })
    })
  })

  describe('denormalizeBoxCoordinates', () => {
    it('denormalizes 0..1 coordinates back to pixel space', () => {
      const normalized = { x: 0.1, y: 0.1, width: 0.2, height: 0.2 }
      const pixel = denormalizeBoxCoordinates(normalized, 1920, 1080)

      expect(pixel.x).toBe(192)
      expect(pixel.y).toBe(108)
      expect(pixel.width).toBe(384)
      expect(pixel.height).toBe(216)
    })
  })

  describe('hexToRgb & isPointInPolygon & computeColorLassoBounds', () => {
    it('converts hex strings to RGB correctly', () => {
      expect(hexToRgb('#ff0000')).toEqual({ r: 255, g: 0, b: 0 })
      expect(hexToRgb('#00ff00')).toEqual({ r: 0, g: 255, b: 0 })
      expect(hexToRgb('#00f')).toEqual({ r: 0, g: 0, b: 255 })
      expect(hexToRgb('invalid')).toBeNull()
    })

    it('correctly tests point inside polygon', () => {
      const square = [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }, { x: 0, y: 10 }]
      expect(isPointInPolygon({ x: 5, y: 5 }, square)).toBe(true)
      expect(isPointInPolygon({ x: 15, y: 5 }, square)).toBe(false)
    })

    it('snaps lasso bounds to matching pixel colors tightly', () => {
      // Create small 10x10 mock image data
      const data = new Uint8ClampedArray(10 * 10 * 4)
      // Fill background black
      for (let i = 0; i < data.length; i += 4) {
        data[i] = 0; data[i+1] = 0; data[i+2] = 0; data[i+3] = 255
      }
      // Paint a 4x4 red patch at [3,3] to [6,6]
      for (let y = 3; y <= 6; y++) {
        for (let x = 3; x <= 6; x++) {
          const idx = (y * 10 + x) * 4
          data[idx] = 255; data[idx+1] = 0; data[idx+2] = 0; data[idx+3] = 255
        }
      }
      const mockImgData = { width: 10, height: 10, data } as unknown as ImageData
      const roughLasso = [{ x: 1, y: 1 }, { x: 8, y: 1 }, { x: 8, y: 8 }, { x: 1, y: 8 }]
      const snapped = computeColorLassoBounds(mockImgData, roughLasso, '#ff0000', 30)

      expect(snapped).not.toBeNull()
      expect(snapped?.x).toBe(3)
      expect(snapped?.y).toBe(3)
      expect(snapped?.width).toBe(4)
      expect(snapped?.height).toBe(4)
    })
  })

  describe('getSelectionCharacterOffsets', () => {
    it('returns exact character offsets for duplicate words across different positions', () => {
      // Create container with repetitive test string
      const container = document.createElement('div')
      const text = 'Doctor Alice and Doctor Bob visit the Doctor'
      // Character indexes:
      // "Doctor" #1: 0..6
      // "Doctor" #2: 17..23
      // "Doctor" #3: 38..44
      container.textContent = text
      document.body.appendChild(container)

      const textNode = container.firstChild as Text
      expect(textNode).toBeTruthy()

      // 1. Highlight 1st occurrence of "Doctor" (0..6)
      const range1 = document.createRange()
      range1.setStart(textNode, 0)
      range1.setEnd(textNode, 6)

      const selection = window.getSelection()!
      selection.removeAllRanges()
      selection.addRange(range1)

      const res1 = getSelectionCharacterOffsets(container)
      expect(res1).toEqual({
        start: 0,
        end: 6,
        text: 'Doctor',
      })
      expect(text.slice(res1!.start, res1!.end)).toBe('Doctor')

      // 2. Highlight 2nd occurrence of "Doctor" (17..23)
      const range2 = document.createRange()
      range2.setStart(textNode, 17)
      range2.setEnd(textNode, 23)

      selection.removeAllRanges()
      selection.addRange(range2)

      const res2 = getSelectionCharacterOffsets(container)
      expect(res2).toEqual({
        start: 17,
        end: 23,
        text: 'Doctor',
      })
      expect(text.slice(res2!.start, res2!.end)).toBe('Doctor')

      // 3. Highlight 3rd occurrence of "Doctor" (38..44)
      const range3 = document.createRange()
      range3.setStart(textNode, 38)
      range3.setEnd(textNode, 44)

      selection.removeAllRanges()
      selection.addRange(range3)

      const res3 = getSelectionCharacterOffsets(container)
      expect(res3).toEqual({
        start: 38,
        end: 44,
        text: 'Doctor',
      })
      expect(text.slice(res3!.start, res3!.end)).toBe('Doctor')

      // 4. Highlight with surrounding whitespace: " Doctor Bob " (16..28)
      // "Doctor Alice and Doctor Bob visit the Doctor"
      // Index 16 is space before Doctor, index 27 is 'b', index 28 is space after Bob
      const rangeWhitespace = document.createRange()
      rangeWhitespace.setStart(textNode, 16) // " Doctor Bob "
      rangeWhitespace.setEnd(textNode, 28)

      selection.removeAllRanges()
      selection.addRange(rangeWhitespace)

      const resWhitespace = getSelectionCharacterOffsets(container)
      expect(resWhitespace).toEqual({
        start: 17,
        end: 27,
        text: 'Doctor Bob',
      })
      expect(text.slice(resWhitespace!.start, resWhitespace!.end)).toBe('Doctor Bob')

      // 5. Non-collapsed selection outside container should return null
      const outsideContainer = document.createElement('div')
      outsideContainer.textContent = 'Outside text'
      document.body.appendChild(outsideContainer)

      const outsideRange = document.createRange()
      outsideRange.setStart(outsideContainer.firstChild!, 0)
      outsideRange.setEnd(outsideContainer.firstChild!, 7)
      selection.removeAllRanges()
      selection.addRange(outsideRange)

      expect(getSelectionCharacterOffsets(container)).toBeNull()

      // Cleanup DOM
      selection.removeAllRanges()
      document.body.removeChild(container)
      document.body.removeChild(outsideContainer)
    })
  })
})

