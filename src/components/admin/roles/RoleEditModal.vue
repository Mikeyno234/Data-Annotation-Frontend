<script setup lang="ts">
import { computed } from 'vue'
import Modal from '@/components/ui/Modal.vue'
import Button from '@/components/ui/Button.vue'
import Input from '@/components/ui/Input.vue'
import Select, { type SelectOption } from '@/components/ui/Select.vue'

const props = defineProps<{
  showModal: boolean
  editingRoleId: number | null
  isSavingRole: boolean
  roleForm: {
    name: string
    description: string
    organization_id: number | null
  }
  organizationList: Array<{ id: number; name: string }>
}>()

const emit = defineEmits<{
  (e: 'update:showModal', val: boolean): void
  (e: 'save'): void
}>()

const orgOptions = computed<SelectOption<number | null>[]>(() => [
  { value: null, label: 'Global (System-wide)', description: 'Accessible across all organizations' },
  ...props.organizationList.map((org) => ({
    value: org.id,
    label: org.name,
  })),
])
</script>

<template>
  <Modal
    :open="showModal"
    :title="editingRoleId ? 'Edit Role' : 'Create Role'"
    @close="emit('update:showModal', false)"
  >
    <form class="space-y-4" @submit.prevent="emit('save')">
      <div class="space-y-1.5">
        <label class="text-xs font-medium text-foreground">Role Name *</label>
        <Input v-model="roleForm.name" placeholder="e.g. Data Reviewer" class-name="h-9 text-xs rounded-lg" required />
      </div>

      <div class="space-y-1.5">
        <label class="text-xs font-medium text-foreground">Organization Scope</label>
        <Select
          v-model="roleForm.organization_id"
          :options="orgOptions"
          placeholder="Select organization scope"
        />
      </div>

      <div class="space-y-1.5">
        <label class="text-xs font-medium text-foreground">Description</label>
        <textarea
          v-model="roleForm.description"
          rows="3"
          placeholder="Brief summary of role permissions and access..."
          class="w-full rounded-lg border border-border bg-card p-2.5 text-xs text-foreground placeholder:text-muted-foreground/50 focus-visible:border-foreground/40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-foreground/15 resize-none transition-all"
        ></textarea>
      </div>

      <div class="flex items-center justify-end gap-2 pt-3 border-t border-border">
        <Button variant="ghost" size="sm" type="button" class-name="rounded-lg text-xs" @click="emit('update:showModal', false)">
          Cancel
        </Button>
        <Button size="sm" type="submit" :disabled="isSavingRole" class-name="rounded-lg text-xs font-medium shadow-2xs">
          {{ isSavingRole ? 'Saving...' : editingRoleId ? 'Save Changes' : 'Create Role' }}
        </Button>
      </div>
    </form>
  </Modal>
</template>
