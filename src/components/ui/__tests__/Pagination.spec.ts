import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Pagination from '../Pagination.vue'
import Select from '@/components/ui/Select.vue'

describe('Pagination.vue', () => {
  it('renders natural results summary with tabular numbers', () => {
    const wrapper = mount(Pagination, {
      props: {
        page: 2,
        limit: 20,
        total: 85,
        totalPages: 5,
      },
    })

    expect(wrapper.text()).toContain('Showing')
    expect(wrapper.text()).toContain('21')
    expect(wrapper.text()).toContain('40')
    expect(wrapper.text()).toContain('85')
    expect(wrapper.text()).toContain('results')
    expect(wrapper.text()).toContain('Rows per page')
    expect(wrapper.text()).toContain('Page 2 of 5')
  })

  it('renders default page size options with 10, 20, 50, 70, 100', () => {
    const wrapper = mount(Pagination, {
      props: {
        page: 1,
        limit: 20,
        total: 150,
      },
    })

    const selectComponent = wrapper.findComponent<any>(Select)
    expect(selectComponent.exists()).toBe(true)
    const options = (selectComponent as any).props('options') as Array<{ value: number; label: string }>
    expect(options.map((o) => o.label)).toEqual(['10', '20', '50', '70', '100'])
  })

  it('renders clean numbers in row selector options without clumsy "/ page"', () => {
    const wrapper = mount(Pagination, {
      props: {
        page: 1,
        limit: 20,
        total: 100,
        pageSizeOptions: [10, 20, 50, 70, 100],
      },
    })

    const selectComponent = wrapper.findComponent<any>(Select)
    expect(selectComponent.exists()).toBe(true)
    const options = (selectComponent as any).props('options') as Array<{ value: number; label: string }>
    expect(options.map((o) => o.label)).toEqual(['10', '20', '50', '70', '100'])
    expect(options.some((o) => o.label.includes('/ page'))).toBe(false)
  })

  it('emits page update when navigation buttons are clicked', async () => {
    const wrapper = mount(Pagination, {
      props: {
        page: 2,
        limit: 20,
        total: 100,
        totalPages: 5,
      },
    })

    const prevButton = wrapper.find('button[title="Previous page"]')
    await prevButton.trigger('click')
    expect(wrapper.emitted('update:page')?.[0]).toEqual([1])
  })

  it('disables previous button on first page', () => {
    const wrapper = mount(Pagination, {
      props: {
        page: 1,
        limit: 20,
        total: 50,
        totalPages: 3,
      },
    })

    const prevButton = wrapper.find('button[title="Previous page"]')
    expect(prevButton.attributes('disabled')).toBeDefined()
  })
})
