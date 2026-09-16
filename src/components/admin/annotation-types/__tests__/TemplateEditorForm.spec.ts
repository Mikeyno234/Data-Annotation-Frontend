import { describe, it, expect, vi } from 'vitest'
import { useTemplateForm } from '../useTemplateForm'
import type { AnnotationType } from '@/types'

vi.mock('@/api/annotationTypes', () => ({
  annotationTypesApi: {
    updateAnnotationType: vi.fn().mockResolvedValue({ data: {} }),
    createAnnotationType: vi.fn().mockResolvedValue({ data: {} }),
  },
}))

describe('Template Schema Editor Form (Task Catalog Integrity)', () => {
  it('initializes in create mode with default image modality and synced presets', () => {
    const onSuccess = vi.fn()
    const { form, openCreateModal, visualLabels } = useTemplateForm(onSuccess)

    openCreateModal()

    expect(form.modality).toBe('IMAGE')
    expect(form.tool_type).toBe('BBOX')
    expect(form.instructions).toContain('rectangular bounding boxes')
    expect(visualLabels.value.length).toBeGreaterThan(0)
  })

  it('synchronizes guidelines, tool type, and presets when switching modality on create', () => {
    const onSuccess = vi.fn()
    const { form, openCreateModal, onModalityChange, visualLabels } = useTemplateForm(onSuccess)

    openCreateModal()

    // Switch to VIDEO
    form.modality = 'VIDEO'
    onModalityChange()

    expect(form.tool_type).toBe('TIMELINE')
    expect(form.instructions).toContain('video timeline')
    expect(form.instructions).not.toContain('speaker')
    expect(visualLabels.value.some((l) => l.name === 'Ball Dribble')).toBe(true)

    // Switch to AUDIO
    form.modality = 'AUDIO'
    onModalityChange()

    expect(form.tool_type).toBe('DIARIZATION')
    expect(form.instructions).toContain('multi-speaker conversation')
    expect(visualLabels.value.some((l) => l.name.startsWith('Speaker'))).toBe(true)
  })

  it('locks modality and does NOT alter modality or reset guidelines when editing an existing schema', () => {
    const onSuccess = vi.fn()
    const { form, openEditModal, onModalityChange, editingId, visualLabels } = useTemplateForm(onSuccess)

    const existingSchema: AnnotationType = {
      id: 2,
      code: 'BOUNDING_BOX',
      name: 'BOUNDING_BOX',
      modality: 'IMAGE',
      tool_type: 'BBOX',
      status: 'ACTIVE',
      instructions: 'Custom specific instructions for vehicle bboxes',
      label_config: '<View><Labels name="label" toName="image"><Label value="mobil" background="#38bdf8"/><Label value="motor" background="#050000"/></Labels></View>',
      description: 'Image bounding boxes',
      badges: ['Car', 'Motorcycle'],
      preview_image_url: '',
      preview_data: null,
      sub_options: [],
    }

    openEditModal(existingSchema)

    expect(editingId.value).toBe(2)
    expect(form.code).toBe('BOUNDING_BOX')
    expect(form.modality).toBe('IMAGE')
    expect(form.instructions).toBe('Custom specific instructions for vehicle bboxes')
    expect(visualLabels.value).toEqual([
      { name: 'mobil', color: '#38bdf8' },
      { name: 'motor', color: '#050000' },
    ])

    // If an attempt to change modality is made, onModalityChange is a no-op when editingId is set
    form.modality = 'VIDEO'
    onModalityChange()

    // Form instructions must NOT be overwritten with video defaults
    expect(form.instructions).toBe('Custom specific instructions for vehicle bboxes')
  })
})
