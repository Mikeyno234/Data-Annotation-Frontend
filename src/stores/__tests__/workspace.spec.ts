import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useWorkspaceStore } from '../workspace'
import type { DataItem } from '@/types'

describe('useWorkspaceStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    vi.clearAllMocks()
  })

  const mockItem: DataItem = {
    id: 101,
    project_id: 1,
    batch_id: 1,
    file_name: 'test_image.jpg',
    source_url: 'uploads/test_image.jpg',
    storage_key: 'uploads/test_image.jpg',
    modality: 'IMAGE',
    status: 'UNASSIGNED',
    created_at: new Date().toISOString(),
  }

  it('initializes with default state', () => {
    const store = useWorkspaceStore()
    expect(store.currentItem).toBeNull()
    expect(store.isSaving).toBe(false)
    expect(store.isDraftSaving).toBe(false)
    expect(store.lastDraftSavedAt).toBeNull()
    expect(store.draftRestoredAt).toBeNull()
  })

  it('sets and resets active item via explicit actions', () => {
    const store = useWorkspaceStore()
    store.setCurrentItem(mockItem)
    expect(store.currentItem).toEqual(mockItem)

    store.setIsSaving(true)
    expect(store.isSaving).toBe(true)

    store.resetWorkspace()
    expect(store.currentItem).toBeNull()
    expect(store.isSaving).toBe(false)
  })

  it('manages draft status and clearing', () => {
    const store = useWorkspaceStore()
    localStorage.setItem(`draft_task_${mockItem.id}`, JSON.stringify({ payload: 'test' }))

    store.setIsDraftSaving(true)
    const now = new Date()
    store.setLastDraftSavedAt(now)
    store.setDraftRestoredAt(now)

    expect(store.isDraftSaving).toBe(true)
    expect(store.lastDraftSavedAt).toEqual(now)
    expect(store.draftRestoredAt).toEqual(now)

    store.clearDraft(mockItem.id)
    expect(localStorage.getItem(`draft_task_${mockItem.id}`)).toBeNull()
    expect(store.lastDraftSavedAt).toBeNull()
    expect(store.draftRestoredAt).toBeNull()
  })
})
