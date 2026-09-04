import { describe, it, expect } from 'vitest'
import {
  clamp,
  calculateBBoxArea,
  formatLeadTime,
  formatAudioTimestamp,
  normalizeBoxCoordinates,
  denormalizeBoxCoordinates,
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
})
