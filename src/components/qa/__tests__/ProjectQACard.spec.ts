import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ProjectQACard from '../ProjectQACard.vue'
import type { QAProjectSummary } from '@/types'

describe('ProjectQACard.vue', () => {
  const mockProject: QAProjectSummary = {
    project_id: 202,
    project_name: 'Speech Dataset Evaluation',
    modality: 'AUDIO',
    annotation_type: 'AUDIO_TRANSCRIPTION',
    pending_count: 4,
    passed_count: 12,
    failed_count: 1,
    total_tasks: 17,
    avg_score: 94.2,
  }

  it('renders project details, modality, and status counts accurately', () => {
    const wrapper = mount(ProjectQACard, {
      props: {
        project: mockProject,
        canEvaluate: true,
      },
    })

    expect(wrapper.text()).toContain('Speech Dataset Evaluation')
    expect(wrapper.text()).toContain('audio')
    expect(wrapper.text()).toContain('Audio Transcription')
    expect(wrapper.text()).toContain('4 pending QA')
    expect(wrapper.text()).toContain('12')
    expect(wrapper.text()).toContain('1')
    expect(wrapper.text()).toContain('94.2%')
  })

  it('computes completion rate correctly (13 / 17 = 76%)', () => {
    const wrapper = mount(ProjectQACard, {
      props: {
        project: mockProject,
        canEvaluate: true,
      },
    })

    expect(wrapper.text()).toContain('76%')
    expect(wrapper.text()).toContain('(13/17)')
  })

  it('emits "open" when clicking the evaluate queue button', async () => {
    const wrapper = mount(ProjectQACard, {
      props: {
        project: mockProject,
        canEvaluate: true,
      },
    })

    const buttons = wrapper.findAll('button')
    const openBtn = buttons.find((b) => b.text().includes('Evaluate Queue'))
    expect(openBtn?.exists()).toBe(true)
    await openBtn!.trigger('click')

    expect(wrapper.emitted('open')).toBeTruthy()
    expect(wrapper.emitted('open')?.[0]).toEqual([mockProject])
  })

  it('emits "passAll" when clicking Pass All button', async () => {
    const wrapper = mount(ProjectQACard, {
      props: {
        project: mockProject,
        canEvaluate: true,
      },
    })

    const buttons = wrapper.findAll('button')
    const passAllBtn = buttons.find((b) => b.text().includes('Pass All'))
    expect(passAllBtn?.exists()).toBe(true)
    await passAllBtn!.trigger('click')

    expect(wrapper.emitted('passAll')).toBeTruthy()
    expect(wrapper.emitted('passAll')?.[0]).toEqual([mockProject])
  })

  it('hides Pass All button when pending_count is 0 or canEvaluate is false', () => {
    const completedProject: QAProjectSummary = {
      ...mockProject,
      pending_count: 0,
      passed_count: 17,
      total_tasks: 17,
    }

    const wrapper = mount(ProjectQACard, {
      props: {
        project: completedProject,
        canEvaluate: true,
      },
    })

    const buttons = wrapper.findAll('button')
    const passAllBtn = buttons.find((b) => b.text().includes('Pass All'))
    expect(passAllBtn).toBeUndefined()
    expect(wrapper.text()).toContain('All evaluated')

    const wrapperNoPerm = mount(ProjectQACard, {
      props: {
        project: mockProject,
        canEvaluate: false,
      },
    })
    const buttonsNoPerm = wrapperNoPerm.findAll('button')
    const passAllNoPerm = buttonsNoPerm.find((b) => b.text().includes('Pass All'))
    expect(passAllNoPerm).toBeUndefined()
  })
})
