import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import CreateUserModal from '../CreateUserModal.vue'
import Select from '@/components/ui/Select.vue'
import { adminApi } from '@/api/admin'
import type { Role, Organization } from '@/types'

vi.mock('@/api/admin', () => ({
  adminApi: {
    createUser: vi.fn(),
  },
}))

vi.mock('@/utils/toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

describe('CreateUserModal.vue', () => {
  const mockRoles: Role[] = [
    { id: 1, name: 'Super Admin', description: 'System Administrator', is_system: true },
    { id: 2, name: 'Annotator', description: 'Data annotator', is_system: false },
  ]

  const mockOrgs: Organization[] = [
    { id: 10, name: 'Acme Corp', slug: 'acme', status: 'ACTIVE' },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders modal when open is true', () => {
    const wrapper = mount(CreateUserModal, {
      props: {
        open: true,
        roles: mockRoles,
        organizations: mockOrgs,
        isSuperAdmin: false,
      },
      global: {
        stubs: {
          Teleport: true,
        },
      },
    })

    expect(wrapper.find('input[placeholder="e.g. Jane Doe"]').exists()).toBe(true)
    expect(wrapper.find('input[type="email"]').exists()).toBe(true)
    expect(wrapper.find('input[placeholder="Minimum 6 characters"]').exists()).toBe(true)
    expect(wrapper.findComponent(Select).exists()).toBe(true)
  })

  it('displays organization selection only for Super Admin', () => {
    const regularWrapper = mount(CreateUserModal, {
      props: {
        open: true,
        roles: mockRoles,
        organizations: mockOrgs,
        isSuperAdmin: false,
      },
      global: {
        stubs: {
          Teleport: true,
        },
      },
    })
    expect(regularWrapper.text()).not.toContain('Organization Scope')

    const superAdminWrapper = mount(CreateUserModal, {
      props: {
        open: true,
        roles: mockRoles,
        organizations: mockOrgs,
        isSuperAdmin: true,
      },
      global: {
        stubs: {
          Teleport: true,
        },
      },
    })
    expect(superAdminWrapper.text()).toContain('Organization Scope')
  })

  it('submits form payload and emits created event on success', async () => {
    vi.mocked(adminApi.createUser).mockResolvedValueOnce({
      data: {
        data: {
          id: 99,
          email: 'test@example.com',
          full_name: 'Test User',
          role_id: 2,
          status: 'ACTIVE',
        },
      },
    } as any)

    const wrapper = mount(CreateUserModal, {
      props: {
        open: true,
        roles: mockRoles,
        organizations: mockOrgs,
        isSuperAdmin: false,
        defaultOrganizationId: 10,
      },
      global: {
        stubs: {
          Teleport: true,
        },
      },
    })

    const nameInput = wrapper.find('input[placeholder="e.g. Jane Doe"]')
    await nameInput.setValue('Test User')

    const emailInput = wrapper.find('input[type="email"]')
    await emailInput.setValue('test@example.com')

    const passInput = wrapper.find('input[placeholder="Minimum 6 characters"]')
    await passInput.setValue('secret123')

    const selectComponent = wrapper.findComponent<any>(Select)
    ;(selectComponent as any).vm.$emit('update:modelValue', 2)
    await wrapper.vm.$nextTick()

    await wrapper.find('form').trigger('submit.prevent')

    expect(adminApi.createUser).toHaveBeenCalledWith({
      full_name: 'Test User',
      email: 'test@example.com',
      password: 'secret123',
      role_id: 2,
      organization_id: undefined,
    })

    expect(wrapper.emitted('created')).toBeTruthy()
  })
})
