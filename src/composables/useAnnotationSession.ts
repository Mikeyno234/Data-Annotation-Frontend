import { ref, onMounted, onUnmounted, getCurrentInstance, type Ref, type ComputedRef } from 'vue'
import type { DataItem } from '@/types'
import { annotationsApi } from '@/api/annotations'
import { useWorkspaceStore } from '@/stores/workspace'
import { toast } from '@/utils/toast'
import { useHistoryStack } from './useHistoryStack'
import { useDraftStorage, cloneDeep, type AnnotationDraft } from './useDraftStorage'
import { useLeaseLock } from './useLeaseLock'

export type { AnnotationDraft }

export interface UseAnnotationSessionOptions<T> {
  item: DataItem
  annotationType?: string
  initialPayload: T
  /** Custom validation before submission. Return error message if invalid, or null if valid. */
  validatePayload?: (payload: T) => string | null
  /** Callback fired after submission successfully finishes */
  onSubmitted?: () => void
  /** Custom keydown handlers (e.g. 'Space' -> play/pause) */
  customHotkeys?: Record<string, (event: KeyboardEvent) => void>
  /** Custom label selection callback when digits 1-9 are pressed */
  onSelectLabelIndex?: (index: number) => void
  /** Callback when delete/backspace is pressed */
  onDeleteSelected?: () => void
}

export interface UseAnnotationSessionReturn<T> {
  // State
  payload: Ref<T>
  isSaving: Ref<boolean>
  isDraftSaving: Ref<boolean>
  elapsedTimeSeconds: Ref<number>
  lastDraftSavedAt: Ref<Date | null>
  draftRestoredAt: Ref<Date | null>
  isDraftRestored: ComputedRef<boolean>
  hasPrelabel: ComputedRef<boolean>
  canUndo: ComputedRef<boolean>
  canRedo: ComputedRef<boolean>

  // History Actions
  pushState: (state?: T) => void
  undo: () => T | null
  redo: () => T | null

  // Draft Actions
  saveDraft: (customPayload?: T) => Promise<void>
  clearDraft: () => void

  // Submission
  submit: () => Promise<void>

  // Timer Controls
  startTimer: () => void
  stopTimer: () => void
  resetTimer: () => void
}

/**
 * Deep Composable for Annotation Session Lifecycle.
 * Composes lease timer, draft autosave/restore, undo/redo linear history,
 * global keyboard shortcuts, anti-bot lead time checks, and submission.
 */
export function useAnnotationSession<T>(
  options: UseAnnotationSessionOptions<T>
): UseAnnotationSessionReturn<T> {
  const {
    item,
    annotationType = 'General Annotation',
    initialPayload,
    validatePayload,
    onSubmitted,
    customHotkeys,
    onSelectLabelIndex,
    onDeleteSelected,
  } = options

  const workspaceStore = useWorkspaceStore()

  // 1. Storage & draft resolution
  const draftStorage = useDraftStorage<T>(item)
  const initialData = draftStorage.resolveInitialPayload(item, initialPayload)
  const payload = ref<T>(initialData) as Ref<T>

  // 2. Linear History Stack (Undo / Redo)
  const historyStack = useHistoryStack<T>(payload, (state) => {
    workspaceStore.registerDraftPayload(state, annotationType)
  })

  // 3. Timer & Lead Time Tracking
  const leaseLock = useLeaseLock()

  // 4. Draft wrapper actions
  async function saveDraft(customPayload?: T): Promise<void> {
    const data = customPayload !== undefined ? customPayload : payload.value
    await draftStorage.saveDraft(item.id, data)
  }

  function clearDraft(): void {
    draftStorage.clearDraft(item.id)
    workspaceStore.clearDraft(item.id)
  }

  // 5. Submission Pipeline
  const isSaving = ref(false)

  async function submit(): Promise<void> {
    if (validatePayload) {
      const error = validatePayload(payload.value)
      if (error) {
        toast.error('Submission rejected', error)
        return
      }
    }

    isSaving.value = true
    workspaceStore.isSaving = true

    try {
      const leadTime = Math.max(leaseLock.elapsedTimeSeconds.value, 2.5)
      await annotationsApi.submitAnnotation(item.id, {
        annotation_type: annotationType,
        payload: payload.value,
        lead_time_seconds: leadTime,
      })

      leaseLock.stopTimer()
      draftStorage.stopAutosave()
      clearDraft()

      toast.success('Annotation saved!', 'Task marked as ANNOTATED')
      if (onSubmitted) {
        onSubmitted()
      }
    } catch (err: any) {
      toast.error('Submission failed', err?.message || 'Network error occurred')
      throw err
    } finally {
      isSaving.value = false
      workspaceStore.isSaving = false
    }
  }

  // 6. Centralized Keyboard Shortcuts
  function handleGlobalKeyDown(event: KeyboardEvent) {
    const target = event.target as HTMLElement | null
    if (
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      target?.isContentEditable
    ) {
      return
    }

    const isCtrlOrCmd = event.ctrlKey || event.metaKey

    if (isCtrlOrCmd && event.code === 'KeyZ' && !event.shiftKey) {
      event.preventDefault()
      historyStack.undo()
      return
    }

    if ((isCtrlOrCmd && event.code === 'KeyY') || (isCtrlOrCmd && event.code === 'KeyZ' && event.shiftKey)) {
      event.preventDefault()
      historyStack.redo()
      return
    }

    if (isCtrlOrCmd && event.code === 'KeyS') {
      event.preventDefault()
      saveDraft()
      toast.info('Draft saved', 'Progress saved locally and to server')
      return
    }

    if (event.code === 'Delete' || event.code === 'Backspace') {
      if (onDeleteSelected) {
        event.preventDefault()
        onDeleteSelected()
        return
      }
    }

    if (/^Digit[1-9]$/.test(event.code)) {
      if (onSelectLabelIndex) {
        const index = Number(event.code.replace('Digit', '')) - 1
        onSelectLabelIndex(index)
        return
      }
    }

    if (customHotkeys && customHotkeys[event.code]) {
      customHotkeys[event.code](event)
    }
  }

  // 7. Lifecycle Hooks
  if (getCurrentInstance()) {
    onMounted(() => {
      workspaceStore.setCurrentItem(item)
      leaseLock.startTimer()
      draftStorage.startAutosave(item.id, () => payload.value)
      window.addEventListener('keydown', handleGlobalKeyDown)

      if (draftStorage.isDraftRestored.value) {
        toast.info('Draft restored', `Loaded progress from previous session (${draftStorage.draftRestoredAt.value?.toLocaleTimeString()})`)
      }
    })

    onUnmounted(() => {
      leaseLock.stopTimer()
      draftStorage.stopAutosave()
      window.removeEventListener('keydown', handleGlobalKeyDown)
    })
  }

  return {
    payload,
    isSaving,
    isDraftSaving: draftStorage.isDraftSaving,
    elapsedTimeSeconds: leaseLock.elapsedTimeSeconds,
    lastDraftSavedAt: draftStorage.lastDraftSavedAt,
    draftRestoredAt: draftStorage.draftRestoredAt,
    isDraftRestored: draftStorage.isDraftRestored,
    hasPrelabel: draftStorage.hasPrelabel,
    canUndo: historyStack.canUndo,
    canRedo: historyStack.canRedo,
    pushState: historyStack.pushState,
    undo: historyStack.undo,
    redo: historyStack.redo,
    saveDraft,
    clearDraft,
    submit,
    startTimer: leaseLock.startTimer,
    stopTimer: leaseLock.stopTimer,
    resetTimer: leaseLock.resetTimer,
  }
}
