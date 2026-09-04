import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAnnotationSession } from '../useAnnotationSession'
import type { DataItem } from '@/types'

vi.mock('@/api/annotations', () => ({
  annotationsApi: {
    saveDraft: vi.fn().mockResolvedValue({}),
    submitAnnotation: vi.fn().mockResolvedValue({ id: 999, status: 'SUBMITTED' }),
  },
}))

describe('useAnnotationSession', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  const baseItem: DataItem = {
    id: 42,
    project_id: 1,
    batch_id: 1,
    file_name: 'test_sample.png',
    source_url: 'uploads/test_sample.png',
    modality: 'IMAGE',
    status: 'IN_PROGRESS',
    created_at: new Date().toISOString(),
  }

  it('resolves default initial payload when no draft or prelabel exists', () => {
    const session = useAnnotationSession({
      item: baseItem,
      initialPayload: [{ id: 'default-1', x: 0, y: 0 }],
    })

    expect(session.payload.value).toEqual([{ id: 'default-1', x: 0, y: 0 }])
    expect(session.isDraftRestored.value).toBe(false)
    expect(session.hasPrelabel.value).toBe(false)
  })

  it('restores backend draft payload when present on item', () => {
    const itemWithDraft: DataItem = {
      ...baseItem,
      draft_payload: [{ id: 'draft-remote', x: 50, y: 50 }],
      draft_saved_at: '2026-09-02T08:00:00Z',
    }

    const session = useAnnotationSession({
      item: itemWithDraft,
      initialPayload: [],
    })

    expect(session.payload.value).toEqual([{ id: 'draft-remote', x: 50, y: 50 }])
    expect(session.isDraftRestored.value).toBe(true)
  })

  it('restores local storage draft when remote draft is absent', () => {
    const cachedData = { payload: [{ id: 'draft-local', x: 99 }], savedAt: '2026-09-02T08:05:00Z' }
    localStorage.setItem(`draft_task_${baseItem.id}`, JSON.stringify(cachedData))

    const session = useAnnotationSession({
      item: baseItem,
      initialPayload: [],
    })

    expect(session.payload.value).toEqual([{ id: 'draft-local', x: 99 }])
    expect(session.isDraftRestored.value).toBe(true)
  })

  it('manages undo and redo transitions with duplicate suppression', () => {
    const session = useAnnotationSession({
      item: baseItem,
      initialPayload: [{ id: '1' }],
    })

    expect(session.canUndo.value).toBe(false)
    expect(session.canRedo.value).toBe(false)

    // State 1 -> State 2
    session.payload.value = [{ id: '1' }, { id: '2' }]
    session.pushState([{ id: '1' }, { id: '2' }])

    // Duplicate push should be ignored
    session.pushState([{ id: '1' }, { id: '2' }])

    expect(session.canUndo.value).toBe(true)
    expect(session.canRedo.value).toBe(false)

    // Undo
    const undone = session.undo()
    expect(undone).toEqual([{ id: '1' }])
    expect(session.payload.value).toEqual([{ id: '1' }])
    expect(session.canUndo.value).toBe(false)
    expect(session.canRedo.value).toBe(true)

    // Redo
    const redone = session.redo()
    expect(redone).toEqual([{ id: '1' }, { id: '2' }])
    expect(session.payload.value).toEqual([{ id: '1' }, { id: '2' }])
    expect(session.canUndo.value).toBe(true)
    expect(session.canRedo.value).toBe(false)
  })

  it('handles submission validation errors without calling API', async () => {
    const onSubmitted = vi.fn()
    const session = useAnnotationSession({
      item: baseItem,
      initialPayload: [],
      validatePayload: (data) => {
        if (!data || data.length === 0) return 'Cannot submit empty annotation'
        return null
      },
      onSubmitted,
    })

    await session.submit()
    expect(onSubmitted).not.toHaveBeenCalled()
    expect(session.isSaving.value).toBe(false)
  })

  it('submits successfully and clears drafts when validation passes', async () => {
    const onSubmitted = vi.fn()
    const session = useAnnotationSession({
      item: baseItem,
      initialPayload: [{ id: 'valid-box' }],
      validatePayload: () => null,
      onSubmitted,
    })

    // Setup local storage draft
    localStorage.setItem(`draft_task_${baseItem.id}`, 'some-draft')

    await session.submit()
    expect(onSubmitted).toHaveBeenCalled()
    expect(localStorage.getItem(`draft_task_${baseItem.id}`)).toBeNull()
  })

  it('tracks elapsed timer ticking accurately', () => {
    vi.useFakeTimers()
    const session = useAnnotationSession({
      item: baseItem,
      initialPayload: [],
    })

    session.startTimer()
    expect(session.elapsedTimeSeconds.value).toBe(0)

    vi.advanceTimersByTime(4000)
    expect(session.elapsedTimeSeconds.value).toBe(4)

    session.stopTimer()
    vi.advanceTimersByTime(2000)
    expect(session.elapsedTimeSeconds.value).toBe(4)
  })
})
