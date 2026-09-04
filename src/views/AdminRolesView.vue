<script setup lang="ts">
import { onMounted } from 'vue'
import Button from '@/components/ui/Button.vue'
import RoleListSidebar from '@/components/admin/roles/RoleListSidebar.vue'
import PermissionMatrix from '@/components/admin/roles/PermissionMatrix.vue'
import RoleEditModal from '@/components/admin/roles/RoleEditModal.vue'
import OrgFilterBar from '@/components/admin/roles/OrgFilterBar.vue'
import { useRoleManagement } from '@/components/admin/roles/useRoleManagement'
import { ShieldAlert, Plus } from 'lucide-vue-next'

const {
  roles,
  organizations,
  isLoading,
  selectedRoleId,
  autoSaveStatus,
  selectedOrgFilter,
  roleSearchQuery,
  showRoleModal,
  editingRoleId,
  roleForm,
  isSavingRole,
  organizationList,
  filteredRoles,
  selectedRole,
  isSelectedRoleSuperAdmin,
  menuGroups,
  setOrgFilter,
  fetchRolesData,
  selectRole,
  handleToggleGroup,
  handleToggleMenuLevel,
  openCreateRole,
  openEditRole,
  handleSaveRole,
  handleDeleteRole,
} = useRoleManagement()

onMounted(fetchRolesData)
</script>

<template>
  <div class="flex flex-col gap-6 max-w-7xl mx-auto w-full pb-10">
    <!-- Top Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <div class="flex items-center gap-2.5">
          <div class="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <ShieldAlert class="size-5" />
          </div>
          <h1 class="text-2xl font-bold tracking-tight text-foreground font-sans">Roles & Permissions</h1>
        </div>
        <p class="text-xs text-muted-foreground mt-1 font-sans">
          Manage RBAC security access matrix, menu policies, and feature scopes across tenant organizations.
        </p>
      </div>

      <Button
        variant="default"
        class="gap-1.5 text-xs font-semibold rounded-xl h-9 px-4 cursor-pointer btn-tactile shadow-xs"
        @click="openCreateRole"
      >
        <Plus class="size-4" />
        <span>Create Role</span>
      </Button>
    </div>

    <!-- Organization Scope Filter Bar -->
    <OrgFilterBar
      :selected-org-filter="selectedOrgFilter"
      :organization-list="organizationList"
      :roles="roles"
      @select-org="setOrgFilter"
    />

    <!-- Main Workspace: Unbreakable Responsive Master-Detail Layout -->
    <div class="flex flex-col md:flex-row gap-6 items-start w-full">
      <!-- Left: Role Profiles Master Sidebar -->
      <div class="w-full md:w-72 lg:w-80 xl:w-84 shrink-0">
        <RoleListSidebar
          :roles="roles"
          :filtered-roles="filteredRoles"
          :selected-role-id="selectedRoleId"
          :search-query="roleSearchQuery"
          :is-super-admin="isSelectedRoleSuperAdmin"
          :is-loading="isLoading"
          @update:search-query="roleSearchQuery = $event"
          @select-role="selectRole"
          @edit-role="openEditRole"
          @delete-role="handleDeleteRole"
        />
      </div>

      <!-- Right: Permissions Matrix Detail Panel -->
      <div class="flex-1 min-w-0 w-full">
        <PermissionMatrix
          :selected-role="selectedRole"
          :is-selected-role-super-admin="isSelectedRoleSuperAdmin"
          :menu-groups="menuGroups"
          :auto-save-status="autoSaveStatus"
          :is-loading="isLoading"
          @edit-role="openEditRole"
          @toggle-group="handleToggleGroup"
          @toggle-menu-level="handleToggleMenuLevel"
        />
      </div>
    </div>

    <!-- Create / Edit Role Modal -->
    <RoleEditModal
      :show-modal="showRoleModal"
      :editing-role-id="editingRoleId"
      :role-form="roleForm"
      :organization-list="organizationList"
      :is-saving-role="isSavingRole"
      @update:show-modal="showRoleModal = $event"
      @save="handleSaveRole"
    />
  </div>
</template>
