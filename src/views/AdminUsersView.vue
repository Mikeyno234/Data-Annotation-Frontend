<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { adminApi } from '@/api/admin'
import type { User, Role, Organization } from '@/types'
import { useAuthStore } from '@/stores/auth'
import { toast } from '@/utils/toast'
import UserMetricsBar from '@/components/admin/users/UserMetricsBar.vue'
import UserFilterBar from '@/components/admin/users/UserFilterBar.vue'
import UserDirectoryTable from '@/components/admin/users/UserDirectoryTable.vue'
import CreateUserModal from '@/components/admin/users/CreateUserModal.vue'
import EditUserModal from '@/components/admin/users/EditUserModal.vue'
import Button from '@/components/ui/Button.vue'
import { Users, UserPlus } from 'lucide-vue-next'

const authStore = useAuthStore()
const users = ref<User[]>([])
const roles = ref<Role[]>([])
const organizations = ref<Organization[]>([])
const isLoading = ref(true)
const showCreateModal = ref(false)
const showEditModal = ref(false)
const selectedUserForEdit = ref<User | null>(null)
const searchQuery = ref('')
const selectedRoleFilter = ref<string>('ALL')
const selectedStatusFilter = ref<string>('ALL')

const canCreateUser = computed(
  () => authStore.isSuperAdmin || authStore.hasPermission('user.create')
)

const currentPage = ref(1)
const pageLimit = ref(20)
const totalUsers = ref(0)
const totalPages = ref(1)

let searchDebounceTimer: any = null

async function fetchUsersData() {
  isLoading.value = true
  try {
    const roleId = selectedRoleFilter.value !== 'ALL' ? Number(selectedRoleFilter.value) : undefined
    const [usersRes, rolesRes]: any = await Promise.allSettled([
      adminApi.getUsers({
        page: currentPage.value,
        limit: pageLimit.value,
        search: searchQuery.value.trim() || undefined,
        role_id: roleId,
        status: selectedStatusFilter.value !== 'ALL' ? selectedStatusFilter.value : undefined,
      }),
      adminApi.getRoles(),
    ])

    if (usersRes.status === 'fulfilled' && usersRes.value) {
      const uRes = usersRes.value
      const payload = uRes?.data?.data || uRes?.data || uRes
      users.value = Array.isArray(payload) ? payload : []
      const pagination = uRes?.pagination || uRes?.data?.pagination
      if (pagination) {
        totalUsers.value = pagination.total ?? users.value.length
        totalPages.value = pagination.total_pages ?? 1
      } else {
        totalUsers.value = users.value.length
        totalPages.value = 1
      }
    }
    if (rolesRes.status === 'fulfilled' && rolesRes.value.data) {
      roles.value = rolesRes.value.data.data || rolesRes.value.data
    }

    if (authStore.isSuperAdmin && organizations.value.length === 0) {
      try {
        const orgRes: any = await adminApi.getOrganizations()
        const orgPayload = orgRes?.data?.data || orgRes?.data
        if (Array.isArray(orgPayload)) {
          organizations.value = orgPayload
        }
      } catch (err) {
        console.error('Failed to load organizations', err)
      }
    }
  } catch (err: any) {
    toast.error('Failed to load user directory', err?.message)
  } finally {
    isLoading.value = false
  }
}

function handleSearchInput(val: string) {
  searchQuery.value = val
  if (searchDebounceTimer) clearTimeout(searchDebounceTimer)
  searchDebounceTimer = setTimeout(() => {
    currentPage.value = 1
    fetchUsersData()
  }, 300)
}

function handleFilterChange() {
  currentPage.value = 1
  fetchUsersData()
}

function handlePageChange(page: number) {
  currentPage.value = page
  fetchUsersData()
}

function handleLimitChange(limit: number) {
  pageLimit.value = limit
  currentPage.value = 1
  fetchUsersData()
}

const activeUsersCount = computed(() => users.value.filter((u) => u.status === 'ACTIVE').length)

function handleEditUser(user: User) {
  selectedUserForEdit.value = user
  showEditModal.value = true
}

async function toggleUserStatus(user: User) {
  const newStatus = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
  try {
    await adminApi.updateUserAccess(user.id, { status: newStatus })
    user.status = newStatus
    toast.success('Status updated', `${user.full_name} is now ${newStatus}`)
  } catch (err: any) {
    toast.error('Failed to update status', err?.message)
  }
}

onMounted(fetchUsersData)
</script>

<template>
  <div class="flex flex-col gap-6 max-w-7xl mx-auto">
    <!-- Top Header -->
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <div class="flex items-center gap-2">
          <Users class="size-6 text-primary" />
          <h1 class="text-2xl font-bold tracking-tight text-foreground">User Management</h1>
        </div>
        <p class="text-sm text-muted-foreground mt-1">
          Manage enterprise workforce accounts, assign operational roles, and monitor account activity.
        </p>
      </div>

      <div class="flex items-center gap-2">
        <Button
          v-if="canCreateUser"
          variant="default"
          size="sm"
          class-name="gap-1.5 rounded-lg text-xs shadow-xs"
          @click="showCreateModal = true"
        >
          <UserPlus class="size-3.5" :stroke-width="1.8" />
          <span>Add User</span>
        </Button>
      </div>
    </div>

    <!-- Metric Cards -->
    <UserMetricsBar
      :total-count="totalUsers"
      :active-count="activeUsersCount"
      :roles-count="roles.length"
    />

    <!-- Filter Bar -->
    <UserFilterBar
      :search-query="searchQuery"
      :selected-role-filter="selectedRoleFilter"
      :selected-status-filter="selectedStatusFilter"
      :roles="roles"
      @update:search-query="handleSearchInput"
      @update:selected-role-filter="selectedRoleFilter = $event"
      @update:selected-status-filter="selectedStatusFilter = $event"
      @filter-change="handleFilterChange"
    />

    <!-- Users Table -->
    <UserDirectoryTable
      :users="users"
      :roles="roles"
      :current-user-id="authStore.user?.id"
      :current-page="currentPage"
      :page-limit="pageLimit"
      :total-users="totalUsers"
      :total-pages="totalPages"
      :is-loading="isLoading"
      @edit-user="handleEditUser"
      @toggle-status="toggleUserStatus"
      @page-change="handlePageChange"
      @limit-change="handleLimitChange"
    />

    <!-- Create User Modal -->
    <CreateUserModal
      v-model:open="showCreateModal"
      :roles="roles"
      :organizations="organizations"
      :is-super-admin="authStore.isSuperAdmin"
      :default-organization-id="authStore.user?.organization_id"
      @created="fetchUsersData"
    />

    <!-- Edit User Modal -->
    <EditUserModal
      v-model:open="showEditModal"
      :user="selectedUserForEdit"
      :roles="roles"
      :organizations="organizations"
      :is-super-admin="authStore.isSuperAdmin"
      @updated="fetchUsersData"
    />
  </div>
</template>
