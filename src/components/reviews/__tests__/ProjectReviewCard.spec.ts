import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ProjectReviewCard from '../ProjectReviewCard.vue'
import type { ReviewProjectSummary } from '@/types'

describe('ProjectReviewCard.vue', () => {
  const mockProject: ReviewProjectSummary = {
    project_id: 101,
    project_name: 'Autonomous Vehicle Detection',
    modality: 'IMAGE',
    annotation_type: 'BOUNDING_BOX',
    pending_count: 5,
    approved_count: 15,
    rejected_count: 2,
    total_reviews: 22,
  }

  it('renders project details, modality, and status counts accurately', () => {
    const wrapper = mount(ProjectReviewCard, {
      props: {
        project: mockProject,
        canApprove: true,
      },
    })

    expect(wrapper.text()).toContain('Autonomous Vehicle Detection')
    expect(wrapper.text()).toContain('image')
    expect(wrapper.text()).toContain('Bounding Box')
    expect(wrapper.text()).toContain('5 pending')
    expect(wrapper.text()).toContain('15')
    expect(wrapper.text()).toContain('2')
  })

  it('computes completion rate correctly (17 / 22 = 77%)', () => {
    const wrapper = mount(ProjectReviewCard, {
      props: {
        project: mockProject,
        canApprove: true,
      },
    })

    expect(wrapper.text()).toContain('77%')
    expect(wrapper.text()).toContain('(17/22)')
  })

  it('emits "open" when clicking the review queue button', async () => {
    const wrapper = mount(ProjectReviewCard, {
      props: {
        project: mockProject,
        canApprove: true,
      },
    })

    const buttons = wrapper.findAll('button')
    const openBtn = buttons.find((b) => b.text().includes('Review Queue'))
    expect(openBtn?.exists()).toBe(true)
    await openBtn!.trigger('click')

    expect(wrapper.emitted('open')).toBeTruthy()
    expect(wrapper.emitted('open')?.[0]).toEqual([mockProject])
  })

  it('emits "approveAll" when clicking Approve All button', async () => {
    const wrapper = mount(ProjectReviewCard, {
      props: {
        project: mockProject,
        canApprove: true,
      },
    })

    const buttons = wrapper.findAll('button')
    const approveAllBtn = buttons.find((b) => b.text().includes('Approve All'))
    expect(approveAllBtn?.exists()).toBe(true)
    await approveAllBtn!.trigger('click')

    expect(wrapper.emitted('approveAll')).toBeTruthy()
    expect(wrapper.emitted('approveAll')?.[0]).toEqual([mockProject])
  })

  it('hides Approve All button when pending_count is 0 or canApprove is false', () => {
    const completedProject: ReviewProjectSummary = {
      ...mockProject,
      pending_count: 0,
      approved_count: 22,
      total_reviews: 22,
    }

    const wrapper = mount(ProjectReviewCard, {
      props: {
        project: completedProject,
        canApprove: true,
      },
    })

    const buttons = wrapper.findAll('button')
    const approveAllBtn = buttons.find((b) => b.text().includes('Approve All'))
    expect(approveAllBtn).toBeUndefined()
    expect(wrapper.text()).toContain('All reviewed')

    const wrapperNoPerm = mount(ProjectReviewCard, {
      props: {
        project: mockProject,
        canApprove: false,
      },
    })
    const buttonsNoPerm = wrapperNoPerm.findAll('button')
    const approveAllNoPerm = buttonsNoPerm.find((b) => b.text().includes('Approve All'))
    expect(approveAllNoPerm).toBeUndefined()
  })
})
