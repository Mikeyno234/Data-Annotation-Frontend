import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import EditUserModal from '../EditUserModal.vue'
import Select from '@/components/ui/Select.vue'
import { adminApi } from '@/api/admin'
import type { User, Role, Organization } from '@/types'

vi.mock('@/api/admin', () => ({
  adminApi: {
    updateUser: vi.fn(),
  },
}))

vi.mock('@/utils/toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

describe('EditUserModal.vue', () => {
  const mockRoles: Role[] = [
    { id: 1, name: 'Super Admin', description: 'System Administrator', is_system: true },
    { id: 2, name: 'Annotator', description: 'Data annotator', is_system: false },
  ]

  const mockOrgs: Organization[] = [
    { id: 10, name: 'Acme Corp', slug: 'acme', status: 'ACTIVE' },
  ]

  const mockUser: User = {
    id: 5,
    full_name: 'Budi Santoso',
    email: 'budi@example.com',
    role_id: 2,
    organization_id: 10,
    status: 'ACTIVE',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('pre-fills user details when opened', () => {
    const wrapper = mount(EditUserModal, {
      props: {
        open: true,
        user: mockUser,
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

    const nameInput = wrapper.find<HTMLInputElement>('input#edit-user-fullname')
    const emailInput = wrapper.find<HTMLInputElement>('input#edit-user-email')
    expect(nameInput.element.value).toBe('Budi Santoso')
    expect(emailInput.element.value).toBe('budi@example.com')
  })

  it('allows submitting without updating password and emits updated event', async () => {
    vi.mocked(adminApi.updateUser).mockResolvedValueOnce({
      data: {
        data: {
          ...mockUser,
          full_name: 'Budi Santoso Updated',
        },
      },
    } as any)

    const wrapper = mount(EditUserModal, {
      props: {
        open: true,
        user: mockUser,
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

    const nameInput = wrapper.find('input#edit-user-fullname')
    await nameInput.setValue('Budi Santoso Updated')

    await wrapper.find('form').trigger('submit.prevent')

    expect(adminApi.updateUser).toHaveBeenCalledWith(5, {
      full_name: 'Budi Santoso Updated',
      email: 'budi@example.com',
      role_id: 2,
      status: 'ACTIVE',
    })

    expect(wrapper.emitted('updated')).toBeTruthy()
  })

  it('shows organization tenant select only when isSuperAdmin is true', () => {
    const nonAdminWrapper = mount(EditUserModal, {
      props: {
        open: true,
        user: mockUser,
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
    expect(nonAdminWrapper.text()).not.toContain('Organization Tenant')

    const superAdminWrapper = mount(EditUserModal, {
      props: {
        open: true,
        user: mockUser,
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
    expect(superAdminWrapper.text()).toContain('Organization Tenant')
  })
})
