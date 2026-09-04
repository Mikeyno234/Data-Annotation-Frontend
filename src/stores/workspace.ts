import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { DataItem } from '@/types'
import { annotationsApi } from '@/api/annotations'

export interface WorkspaceDraft<T = unknown> {
  payload: T
  savedAt: string
}

export const useWorkspaceStore = defineStore('workspace', () => {
  const currentItem = ref<DataItem | null>(null)
  const isSaving = ref(false)
  const isDraftSaving = ref(false)
  const lastDraftSavedAt = ref<Date | null>(null)
  const draftRestoredAt = ref<Date | null>(null)
  const startTime = ref<number>(Date.now())
  const elapsedTimeSeconds = ref<number>(0)
  
  let timerInterval: ReturnType<typeof setInterval> | null = null
  let autosaveInterval: ReturnType<typeof setInterval> | null = null
  let pendingDraftPayload: unknown = null
  let pendingDraftType: string = ''

  // Undo/Redo stack for current annotation payload
  const history = ref<string[]>([])
  const historyIndex = ref<number>(-1)

  const canUndo = computed(() => historyIndex.value > 0)
  const canRedo = computed(() => historyIndex.value < history.value.length - 1)

  function startTimer() {
    stopTimer()
    startTime.value = Date.now()
    elapsedTimeSeconds.value = 0
    timerInterval = setInterval(() => {
      elapsedTimeSeconds.value = Math.floor((Date.now() - startTime.value) / 1000)
    }, 1000)
  }

  function stopTimer() {
    if (timerInterval !== null) {
      clearInterval(timerInterval)
      timerInterval = null
    }
  }

  function setCurrentItem(item: DataItem) {
    currentItem.value = item
    history.value = []
    historyIndex.value = -1
    startTimer()
  }

  function pushState<T>(state: T): void {
    const serialized = JSON.stringify(state)
    // Avoid duplicate pushes
    if (history.value[historyIndex.value] === serialized) return

    // Slice any redo stack ahead
    history.value = history.value.slice(0, historyIndex.value + 1)
    history.value.push(serialized)
    historyIndex.value = history.value.length - 1
  }

  function undo<T = unknown>(): T | null {
    if (!canUndo.value) return null
    historyIndex.value--
    return JSON.parse(history.value[historyIndex.value]) as T
  }

  function redo<T = unknown>(): T | null {
    if (!canRedo.value) return null
    historyIndex.value++
    return JSON.parse(history.value[historyIndex.value]) as T
  }

  // ─── Draft: backend-persisted + localStorage fallback ────────────────────────

  /** Register current payload for autosave (called by workspace components on change) */
  function registerDraftPayload<T = unknown>(payload: T, annotationType: string) {
    pendingDraftPayload = payload
    pendingDraftType = annotationType
  }

  /** Manually or auto-save draft to backend. Silently fails — never blocks annotator. */
  async function saveDraft<T = unknown>(payload?: T, _annotationType?: string): Promise<void> {
    if (!currentItem.value) return
    const data = payload ?? pendingDraftPayload
    if (!data) return

    isDraftSaving.value = true
    try {
      // Optimistic local cache
      const key = `draft_task_${currentItem.value.id}`
      localStorage.setItem(key, JSON.stringify({ payload: data, savedAt: new Date().toISOString() }))

      // Persist to backend
      await annotationsApi.saveDraft(currentItem.value.id, data)
      lastDraftSavedAt.value = new Date()
    } catch {
      // Silently ignore — localStorage copy is the safety net
    } finally {
      isDraftSaving.value = false
    }
  }

  /**
   * Try to load draft for a given task.
   * Priority: backend response (item.draft_payload) → localStorage cache.
   * Returns { payload, savedAt } | null
   */
  function loadDraft<T = unknown>(item: DataItem): WorkspaceDraft<T> | null {
    // 1. Backend-persisted draft (via item preload)
    if (item.draft_payload && item.draft_saved_at) {
      draftRestoredAt.value = new Date(item.draft_saved_at)
      return { payload: item.draft_payload as T, savedAt: item.draft_saved_at }
    }
    // 2. localStorage fallback
    try {
      const raw = localStorage.getItem(`draft_task_${item.id}`)
      if (raw) {
        const cached = JSON.parse(raw) as WorkspaceDraft<T>
        if (cached?.payload) {
          draftRestoredAt.value = cached.savedAt ? new Date(cached.savedAt) : new Date()
          return cached
        }
      }
    } catch {
      // ignore JSON parse errors gracefully
    }
    return null
  }

  function clearDraft(taskId: number) {
    localStorage.removeItem(`draft_task_${taskId}`)
    lastDraftSavedAt.value = null
    draftRestoredAt.value = null
  }

  /** Start autosaving every 30 seconds. Call in workspace onMounted. */
  function startAutosave() {
    stopAutosave()
    autosaveInterval = setInterval(() => {
      saveDraft()
    }, 30_000)
  }

  function stopAutosave() {
    if (autosaveInterval !== null) {
      clearInterval(autosaveInterval)
      autosaveInterval = null
    }
  }

  /** Reset workspace state and clear active timers / intervals */
  function resetWorkspace() {
    stopTimer()
    stopAutosave()
    currentItem.value = null
    history.value = []
    historyIndex.value = -1
    pendingDraftPayload = null
    pendingDraftType = ''
    elapsedTimeSeconds.value = 0
    lastDraftSavedAt.value = null
    draftRestoredAt.value = null
  }

  // ─── Final submit ─────────────────────────────────────────────────────────────

  async function submitTaskAnnotation<T = unknown>(payload: T, annotationType: string) {
    if (!currentItem.value) throw new Error('No task selected')

    isSaving.value = true
    try {
      const leadTime = Math.max(elapsedTimeSeconds.value, 2.5) // Anti-bot threshold validation
      const res = await annotationsApi.submitAnnotation(currentItem.value.id, {
        annotation_type: annotationType,
        payload,
        lead_time_seconds: leadTime,
      })
      stopTimer()
      stopAutosave()
      clearDraft(currentItem.value.id)
      return res
    } finally {
      isSaving.value = false
    }
  }

  return {
    currentItem,
    isSaving,
    isDraftSaving,
    lastDraftSavedAt,
    draftRestoredAt,
    elapsedTimeSeconds,
    canUndo,
    canRedo,
    startTimer,
    stopTimer,
    setCurrentItem,
    pushState,
    undo,
    redo,
    registerDraftPayload,
    saveDraft,
    loadDraft,
    clearDraft,
    startAutosave,
    stopAutosave,
    resetWorkspace,
    submitTaskAnnotation,
  }
})

