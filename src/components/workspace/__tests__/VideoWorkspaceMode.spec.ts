import { describe, it, expect, beforeEach } from 'vitest'
import {
  extractCandidateLetters,
  assignLabelLetters,
  resolveLabelHotkeys,
} from '@/composables/workspace/useLabelHotkeys'

describe('Video Workspace Mode Resolution & Auto-Advance', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  // Helper mirroring detection logic from VideoWorkspace.vue (deterministic from task catalog)
  function resolveVideoMode(annotationType?: string) {
    const t = (annotationType || '').toUpperCase()
    const isTimelineType =
      t.includes('TIMELINE') ||
      t.includes('INTERVAL') ||
      t.includes('PER_DETIK') ||
      t.includes('PER-DETIK') ||
      t.includes('TEMPORAL') ||
      t.includes('SEGMENT') ||
      t.includes('TRACK')

    const isClassificationType =
      t.includes('CLASSIF') ||
      t.includes('GLOBAL') ||
      t.includes('WHOLE') ||
      t.includes('CHOICE') ||
      t.includes('TAG') ||
      t.includes('SCENE') ||
      t.includes('MODERAT') ||
      t.includes('SAFETY') ||
      t.includes('RATING') ||
      t.includes('SENTIMENT') ||
      t.includes('CATEGOR') ||
      t.includes('CLIP') ||
      t.includes('ACTION_RECOGNITION')

    if (isTimelineType) return 'timeline'
    if (isClassificationType) return 'classification'
    return 'classification'
  }

  it('correctly classifies VIDEO_GLOBAL (seeder parent category) as classification mode with NO split', () => {
    expect(resolveVideoMode('VIDEO_GLOBAL')).toBe('classification')
  })

  it('correctly classifies VIDEO_CLASSIFICATION as classification mode', () => {
    expect(resolveVideoMode('VIDEO_CLASSIFICATION')).toBe('classification')
  })

  it('correctly classifies Whole-Video Tagging and Safety Moderation as classification mode', () => {
    expect(resolveVideoMode('Whole-Video Classification')).toBe('classification')
    expect(resolveVideoMode('CONTENT_MODERATION')).toBe('classification')
    expect(resolveVideoMode('SAFETY_RATING')).toBe('classification')
  })

  it('correctly classifies VIDEO_TIMELINE_PER_DETIK as timeline mode', () => {
    expect(resolveVideoMode('VIDEO_TIMELINE_PER_DETIK')).toBe('timeline')
    expect(resolveVideoMode('TEMPORAL_INTERVALS')).toBe('timeline')
  })

  it('defaults ambiguous or empty video types to classification mode to avoid confusing users with split tools', () => {
    expect(resolveVideoMode('')).toBe('classification')
    expect(resolveVideoMode(undefined)).toBe('classification')
  })

  it('is deterministic and strictly adheres to project task catalog annotation type', () => {
    expect(resolveVideoMode('VIDEO_TIMELINE_PER_DETIK')).toBe('timeline')
    expect(resolveVideoMode('VIDEO_CLASSIFICATION')).toBe('classification')
  })

  it('persists Auto-Advance preference in localStorage', () => {
    // Default when unset is true
    expect(localStorage.getItem('video_auto_advance') !== 'false').toBe(true)

    // When toggled off
    localStorage.setItem('video_auto_advance', 'false')
    expect(localStorage.getItem('video_auto_advance') !== 'false').toBe(false)

    // When toggled on
    localStorage.setItem('video_auto_advance', 'true')
    expect(localStorage.getItem('video_auto_advance') !== 'false').toBe(true)
  })

  it('extracts candidate letters correctly', () => {
    const candidates = extractCandidateLetters('Sexual Harassment')
    expect(candidates[0]).toBe('S')
    expect(candidates[1]).toBe('H')
    expect(candidates).toContain('E')
    expect(candidates).toContain('X')
  })

  it('disambiguates letter hotkeys when multiple labels share the same initial letter', () => {
    const testLabels = [
      { name: 'Sex' },
      { name: 'Sexual Harassment' },
      { name: 'Normal' },
      { name: 'Spam' },
    ]

    const result = assignLabelLetters(testLabels)

    // 'Sex' gets first dibs on 'S'
    expect(result['Sex']).toBe('S')

    // 'Sexual Harassment' sees 'S' taken, picks 'H' (initial of second word)
    expect(result['Sexual Harassment']).toBe('H')

    // 'Normal' gets 'N'
    expect(result['Normal']).toBe('N')

    // 'Spam' sees 'S' taken, picks next available consonant 'P'
    expect(result['Spam']).toBe('P')

    // Ensure all assigned letters are strictly unique
    const values = Object.values(result)
    const uniqueValues = new Set(values)
    expect(values.length).toBe(uniqueValues.size)
  })

  it('correctly creates display hotkey badges and digit fallbacks', () => {
    const testLabels = [
      { name: 'Sex' },
      { name: 'Sexual Harassment' },
      { name: 'Normal' },
    ]

    const resolved = resolveLabelHotkeys(testLabels)

    expect(resolved.getDisplayHotkey('Sex', 0)).toBe('1 / S')
    expect(resolved.getDisplayHotkey('Sexual Harassment', 1)).toBe('2 / H')
    expect(resolved.getDisplayHotkey('Normal', 2)).toBe('3 / N')

    // Key map mappings
    expect(resolved.labelHotkeys['Digit1'].labelName).toBe('Sex')
    expect(resolved.labelHotkeys['KeyS'].labelName).toBe('Sex')
    expect(resolved.labelHotkeys['Digit2'].labelName).toBe('Sexual Harassment')
    expect(resolved.labelHotkeys['KeyH'].labelName).toBe('Sexual Harassment')
  })
})
