import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import Select from '../Select.vue'

describe('Select.vue', () => {
  const options = [
    { value: 'admin', label: 'Administrator', description: 'Full system access' },
    { value: 'editor', label: 'Editor', description: 'Can edit content' },
    { value: 'viewer', label: 'Viewer', description: 'Read-only access', disabled: true },
  ]

  function mountSelect(props: Record<string, any> = {}) {
    return mount(Select, {
      props: {
        options,
        ...props,
      },
      global: {
        stubs: {
          Teleport: true,
        },
      },
    })
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders trigger button with placeholder when no value is selected', () => {
    const wrapper = mountSelect({
      placeholder: 'Pick a role',
    })

    expect(wrapper.text()).toContain('Pick a role')
    expect(wrapper.find('button[role="combobox"]').exists()).toBe(true)
  })

  it('renders selected label when modelValue matches an option', () => {
    const wrapper = mountSelect({
      modelValue: 'admin',
    })

    expect(wrapper.text()).toContain('Administrator')
  })

  it('toggles dropdown listbox on click', async () => {
    const wrapper = mountSelect()

    expect(wrapper.find('[role="listbox"]').exists()).toBe(false)

    await wrapper.find('button[role="combobox"]').trigger('click')
    expect(wrapper.find('[role="listbox"]').exists()).toBe(true)

    expect(wrapper.text()).toContain('Administrator')
    expect(wrapper.text()).toContain('Full system access')

    await wrapper.find('button[role="combobox"]').trigger('click')
    expect(wrapper.find('[role="listbox"]').exists()).toBe(false)
  })

  it('emits update:modelValue and change when an enabled option is clicked', async () => {
    const wrapper = mountSelect()

    await wrapper.find('button[role="combobox"]').trigger('click')

    const optionElements = wrapper.findAll('[role="option"]')
    await optionElements[1].trigger('click')

    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['editor'])
    expect(wrapper.emitted('change')?.[0]).toEqual(['editor'])
    expect(wrapper.find('[role="listbox"]').exists()).toBe(false)
  })

  it('does not select a disabled option when clicked', async () => {
    const wrapper = mountSelect()

    await wrapper.find('button[role="combobox"]').trigger('click')

    const optionElements = wrapper.findAll('[role="option"]')
    await optionElements[2].trigger('click')

    expect(wrapper.emitted('update:modelValue')).toBeFalsy()
  })

  it('supports numeric and null values cleanly', async () => {
    const numericOptions = [
      { value: null, label: 'None' },
      { value: 10, label: 'Ten' },
      { value: 20, label: 'Twenty' },
    ]

    const wrapper = mountSelect({
      modelValue: 10,
      options: numericOptions,
    })

    expect(wrapper.text()).toContain('Ten')

    await wrapper.find('button[role="combobox"]').trigger('click')
    const optionElements = wrapper.findAll('[role="option"]')
    await optionElements[0].trigger('click')

    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([null])
  })

  it('teleports to body when teleport prop is enabled', async () => {
    const wrapper = mount(Select, {
      props: {
        options,
        teleport: true,
      },
    })

    await wrapper.find('button[role="combobox"]').trigger('click')
    const bodyListbox = document.body.querySelector('[role="listbox"]')
    expect(bodyListbox).not.toBeNull()
    wrapper.unmount()
  })
})
