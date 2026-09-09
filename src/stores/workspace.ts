import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { DataItem } from '@/types'

export interface WorkspaceDraft<T = unknown> {
  payload: T
  savedAt: string
}

/**
 * Global workspace store for cross-task lifecycle and checkout state.
 * Transient session state (undo/redo history, timer, draft autosave) is delegated to useAnnotationSession.
 */
export const useWorkspaceStore = defineStore('workspace', () => {
  const currentItem = ref<DataItem | null>(null)
  const isSaving = ref(false)
  const isDraftSaving = ref(false)
  const lastDraftSavedAt = ref<Date | null>(null)
  const draftRestoredAt = ref<Date | null>(null)

  function setCurrentItem(item: DataItem | null) {
    currentItem.value = item
  }

  function setIsSaving(saving: boolean) {
    isSaving.value = saving
  }

  function setIsDraftSaving(saving: boolean) {
    isDraftSaving.value = saving
  }

  function setLastDraftSavedAt(date: Date | null) {
    lastDraftSavedAt.value = date
  }

  function setDraftRestoredAt(date: Date | null) {
    draftRestoredAt.value = date
  }

  function clearDraft(taskId: number | string) {
    localStorage.removeItem(`draft_task_${taskId}`)
    lastDraftSavedAt.value = null
    draftRestoredAt.value = null
  }

  function resetWorkspace() {
    currentItem.value = null
    isSaving.value = false
    isDraftSaving.value = false
    lastDraftSavedAt.value = null
    draftRestoredAt.value = null
  }

  return {
    currentItem,
    isSaving,
    isDraftSaving,
    lastDraftSavedAt,
    draftRestoredAt,
    setCurrentItem,
    setIsSaving,
    setIsDraftSaving,
    setLastDraftSavedAt,
    setDraftRestoredAt,
    clearDraft,
    resetWorkspace,
  }
})
