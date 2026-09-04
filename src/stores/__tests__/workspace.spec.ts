import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useWorkspaceStore } from '../workspace'
import type { DataItem } from '@/types'

// Mock annotations API
vi.mock('@/api/annotations', () => ({
  annotationsApi: {
    saveDraft: vi.fn().mockResolvedValue({}),
    submitAnnotation: vi.fn().mockResolvedValue({ id: 1, status: 'SUBMITTED' }),
  },
}))

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
    expect(store.canUndo).toBe(false)
    expect(store.canRedo).toBe(false)
    expect(store.isSaving).toBe(false)
  })

  it('manages undo/redo state history accurately', () => {
    const store = useWorkspaceStore()
    store.setCurrentItem(mockItem)

    store.pushState({ boxes: [{ id: 1, label: 'Car' }] })
    store.pushState({ boxes: [{ id: 1, label: 'Car' }, { id: 2, label: 'Truck' }] })

    expect(store.canUndo).toBe(true)
    expect(store.canRedo).toBe(false)

    // Undo back to first state
    const previous = store.undo()
    expect(previous).toEqual({ boxes: [{ id: 1, label: 'Car' }] })
    expect(store.canUndo).toBe(false)
    expect(store.canRedo).toBe(true)

    // Redo forward to second state
    const restored = store.redo()
    expect(restored).toEqual({ boxes: [{ id: 1, label: 'Car' }, { id: 2, label: 'Truck' }] })
    expect(store.canUndo).toBe(true)
    expect(store.canRedo).toBe(false)
  })

  it('avoids duplicate consecutive pushes in undo history', () => {
    const store = useWorkspaceStore()
    store.setCurrentItem(mockItem)

    const payload = { boxes: [{ id: 1 }] }
    store.pushState(payload)
    store.pushState(payload)

    expect(store.canUndo).toBe(false)
  })

  it('handles draft persistence and cache retrieval', async () => {
    const store = useWorkspaceStore()
    store.setCurrentItem(mockItem)

    const draftData = { regions: [{ x: 10, y: 10 }] }
    store.registerDraftPayload(draftData, 'BOUNDING_BOX')

    await store.saveDraft()

    // Check localStorage cache
    const cached = localStorage.getItem(`draft_task_${mockItem.id}`)
    expect(cached).not.toBeNull()
    expect(JSON.parse(cached!).payload).toEqual(draftData)

    // Check loading draft
    const loaded = store.loadDraft(mockItem)
    expect(loaded?.payload).toEqual(draftData)

    // Clear draft
    store.clearDraft(mockItem.id)
    expect(localStorage.getItem(`draft_task_${mockItem.id}`)).toBeNull()
  })

  it('tracks elapsed time when timer starts and stops', () => {
    vi.useFakeTimers()
    const store = useWorkspaceStore()
    store.setCurrentItem(mockItem)

    expect(store.elapsedTimeSeconds).toBe(0)

    vi.advanceTimersByTime(3500)
    expect(store.elapsedTimeSeconds).toBe(3)

    store.stopTimer()
    vi.advanceTimersByTime(2000)
    expect(store.elapsedTimeSeconds).toBe(3) // does not increment after stop
    vi.useRealTimers()
  })
})
