import { ref, computed, type Ref, type ComputedRef } from 'vue'
import type { DataItem } from '@/types'
import { annotationsApi } from '@/api/annotations'

export interface AnnotationDraft<T = unknown> {
  payload: T
  savedAt: string
}

export interface UseDraftStorageReturn<T> {
  draftRestoredAt: Ref<Date | null>
  isDraftRestored: ComputedRef<boolean>
  hasPrelabel: ComputedRef<boolean>
  isDraftSaving: Ref<boolean>
  lastDraftSavedAt: Ref<Date | null>
  resolveInitialPayload: (item: DataItem, fallbackPayload: T) => T
  saveDraft: (itemId: string | number, data: T) => Promise<void>
  clearDraft: (itemId: string | number) => void
  startAutosave: (itemId: string | number, getPayload: () => T) => void
  stopAutosave: () => void
}

/**
 * Fast deep clone utility for plain JSON state objects
 */
export function cloneDeep<T>(obj: T): T {
  if (obj === undefined || obj === null) return obj
  return JSON.parse(JSON.stringify(obj)) as T
}

/**
 * Composable for managing annotation draft persistence (localStorage + API autosave).
 */
export function useDraftStorage<T>(item: DataItem): UseDraftStorageReturn<T> {
  const draftRestoredAt = ref<Date | null>(null)
  const isDraftRestored = computed(() => draftRestoredAt.value !== null)
  const hasPrelabel = computed(() => (item.annotations?.length ?? 0) > 0 && !isDraftRestored.value)

  const isDraftSaving = ref(false)
  const lastDraftSavedAt = ref<Date | null>(null)
  let autosaveInterval: ReturnType<typeof setInterval> | null = null

  function resolveInitialPayload(currentItem: DataItem, fallbackPayload: T): T {
    // 1. Backend-persisted draft
    if (currentItem.draft_payload) {
      if (currentItem.draft_saved_at) {
        draftRestoredAt.value = new Date(currentItem.draft_saved_at)
      } else {
        draftRestoredAt.value = new Date()
      }
      return cloneDeep(currentItem.draft_payload as T)
    }

    // 2. localStorage cached draft
    try {
      const localKey = `draft_task_${currentItem.id}`
      const raw = localStorage.getItem(localKey)
      if (raw) {
        const parsed = JSON.parse(raw) as AnnotationDraft<T>
        if (parsed?.payload !== undefined && parsed?.payload !== null) {
          draftRestoredAt.value = parsed.savedAt ? new Date(parsed.savedAt) : new Date()
          return cloneDeep(parsed.payload)
        }
      }
    } catch {
      // ignore parse errors
    }

    // 3. Pre-existing latest annotation payload
    if (currentItem.annotations && currentItem.annotations.length > 0 && currentItem.annotations[0]?.payload) {
      return cloneDeep(currentItem.annotations[0].payload as T)
    }

    // 4. Default fallback
    return cloneDeep(fallbackPayload)
  }

  async function saveDraft(itemId: string | number, data: T): Promise<void> {
    if (!data) return
    isDraftSaving.value = true
    try {
      const localKey = `draft_task_${itemId}`
      localStorage.setItem(
        localKey,
        JSON.stringify({ payload: data, savedAt: new Date().toISOString() })
      )
      await annotationsApi.saveDraft(itemId, data)
      lastDraftSavedAt.value = new Date()
    } catch {
      // Silently ignore — local storage acts as safety net
    } finally {
      isDraftSaving.value = false
    }
  }

  function clearDraft(itemId: string | number): void {
    localStorage.removeItem(`draft_task_${itemId}`)
    lastDraftSavedAt.value = null
    draftRestoredAt.value = null
  }

  function startAutosave(itemId: string | number, getPayload: () => T) {
    stopAutosave()
    autosaveInterval = setInterval(() => {
      saveDraft(itemId, getPayload())
    }, 30_000)
  }

  function stopAutosave() {
    if (autosaveInterval !== null) {
      clearInterval(autosaveInterval)
      autosaveInterval = null
    }
  }

  return {
    draftRestoredAt,
    isDraftRestored,
    hasPrelabel,
    isDraftSaving,
    lastDraftSavedAt,
    resolveInitialPayload,
    saveDraft,
    clearDraft,
    startAutosave,
    stopAutosave,
  }
}
