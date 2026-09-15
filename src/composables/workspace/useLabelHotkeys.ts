import { computed, type Ref, type ComputedRef } from 'vue'
import type { LabelOption } from '@/types'

/**
 * Extracts candidate mnemonic shortcut letters from a label name in prioritized order:
 * 1. Initial letters of each word (e.g. "Sexual Harassment" -> ['S', 'H'])
 * 2. Remaining alphanumeric characters in each word (e.g. ['E', 'X', 'U', 'A', 'L', ...])
 *
 * Uses O(1) set operations to eliminate duplicates while maintaining priority order.
 */
export function extractCandidateLetters(name: string): string[] {
  const trimmed = name.trim()
  if (!trimmed) return []

  const words = trimmed.split(/[\s_/-]+/).filter(Boolean)
  const seen = new Set<string>()
  const candidates: string[] = []

  const addCandidate = (char: string) => {
    const upper = char.toUpperCase()
    if (/^[A-Z]$/.test(upper) && !seen.has(upper)) {
      seen.add(upper)
      candidates.push(upper)
    }
  }

  // Phase 1: Initial letter of each constituent word
  for (const word of words) {
    addCandidate(word.charAt(0))
  }

  // Phase 2: Subsequent letters across the words
  for (const word of words) {
    for (let i = 1; i < word.length; i++) {
      addCandidate(word.charAt(i))
    }
  }

  return candidates
}

/**
 * Resolves a unique single-letter hotkey for each label in the collection,
 * ensuring zero collision across all labels and honoring reserved keys.
 */
export function assignLabelLetters(
  labels: Array<{ name: string }>,
  reservedLetters: Set<string> = new Set(['A', 'D'])
): Record<string, string> {
  const assigned: Record<string, string> = {}
  const usedLetters = new Set<string>(reservedLetters)

  for (const label of labels) {
    const candidates = extractCandidateLetters(label.name)
    const bestLetter = candidates.find((char) => !usedLetters.has(char))
    if (bestLetter) {
      usedLetters.add(bestLetter)
      assigned[label.name] = bestLetter
    }
  }

  return assigned
}

export interface HotkeyEntry {
  key: string
  labelName: string
}

export interface LabelHotkeysResult {
  assignedLetters: Record<string, string>
  labelHotkeys: Record<string, HotkeyEntry>
  getDisplayHotkey: (labelName: string, index: number, format?: 'combo' | 'digit' | 'letter') => string
}

/**
 * Pure generator creating deterministic hotkey mappings and display badges.
 */
export function resolveLabelHotkeys(
  labels: Array<{ name: string }>,
  reservedLetters: Set<string> = new Set(['A', 'D'])
): LabelHotkeysResult {
  const assignedLetters = assignLabelLetters(labels, reservedLetters)
  const labelHotkeys: Record<string, HotkeyEntry> = {}

  labels.forEach((label, idx) => {
    // 1-indexed digit shortcuts (Digit1-9 & Numpad1-9) - guaranteed collision-free
    if (idx < 9) {
      const digitKey = String(idx + 1)
      labelHotkeys[`Digit${digitKey}`] = { key: digitKey, labelName: label.name }
      labelHotkeys[`Numpad${digitKey}`] = { key: digitKey, labelName: label.name }
    }

    // Mnemonic letter hotkey
    const letter = assignedLetters[label.name]
    if (letter) {
      labelHotkeys[`Key${letter}`] = { key: letter, labelName: label.name }
    }
  })

  const getDisplayHotkey = (
    labelName: string,
    index: number,
    format: 'combo' | 'digit' | 'letter' = 'combo'
  ): string => {
    if (format === 'digit') {
      return String(index + 1)
    }
    const letter = assignedLetters[labelName]
    if (format === 'letter') {
      return letter || String(index + 1)
    }
    if (letter && index < 9) {
      return `${index + 1} / ${letter}`
    }
    return `${index + 1}`
  }

  return {
    assignedLetters,
    labelHotkeys,
    getDisplayHotkey,
  }
}

/**
 * Vue 3 Composable wrapping label hotkey resolution with reactivity.
 */
export function useLabelHotkeys(
  labels: Ref<LabelOption[]> | ComputedRef<LabelOption[]>,
  options?: { reservedLetters?: string[] }
) {
  const reservedSet = computed(() => new Set(options?.reservedLetters || ['A', 'D']))

  const resolved = computed(() => {
    return resolveLabelHotkeys(labels.value, reservedSet.value)
  })

  const assignedLetters = computed(() => resolved.value.assignedLetters)
  const labelHotkeys = computed(() => resolved.value.labelHotkeys)
  const getDisplayHotkey = (
    labelName: string,
    index: number,
    format?: 'combo' | 'digit' | 'letter'
  ): string => {
    return resolved.value.getDisplayHotkey(labelName, index, format)
  }

  return {
    assignedLetters,
    labelHotkeys,
    getDisplayHotkey,
  }
}

