<script setup lang="ts">
import Modal from '@/components/ui/Modal.vue'
import Button from '@/components/ui/Button.vue'
import Input from '@/components/ui/Input.vue'

defineProps<{
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
</script>

<template>
  <Modal
    :open="showModal"
    :title="editingRoleId ? 'Edit Role' : 'Create Role'"
    @close="emit('update:showModal', false)"
  >
    <form class="space-y-4" @submit.prevent="emit('save')">
      <div class="space-y-1.5">
        <label class="text-xs font-semibold text-foreground">Role Name *</label>
        <Input v-model="roleForm.name" placeholder="e.g. Data Reviewer" required />
      </div>

      <div class="space-y-1.5">
        <label class="text-xs font-semibold text-foreground">Organization Scope</label>
        <select
          v-model="roleForm.organization_id"
          class="w-full rounded-xl border border-border/60 bg-muted/30 px-3 py-2 text-xs font-medium text-foreground focus:bg-card focus:outline-none focus:ring-1 focus:ring-primary/40 h-10 cursor-pointer"
        >
          <option :value="null">Global (System-wide)</option>
          <option v-for="org in organizationList" :key="org.id" :value="org.id">
            {{ org.name }}
          </option>
        </select>
      </div>

      <div class="space-y-1.5">
        <label class="text-xs font-semibold text-foreground">Description</label>
        <textarea
          v-model="roleForm.description"
          rows="3"
          placeholder="Brief summary of role permissions and access..."
          class="w-full rounded-xl border border-border/60 bg-muted/30 p-3 text-xs text-foreground placeholder:text-muted-foreground/60 focus:bg-card focus:outline-none focus:ring-1 focus:ring-primary/40 shadow-inner resize-none transition-all"
        ></textarea>
      </div>

      <div class="flex items-center justify-end gap-2.5 pt-3 border-t border-border/40">
        <Button variant="ghost" type="button" class="rounded-xl text-xs cursor-pointer" @click="emit('update:showModal', false)">
          Cancel
        </Button>
        <Button type="submit" :disabled="isSavingRole" class="rounded-xl text-xs font-semibold cursor-pointer shadow-xs">
          {{ isSavingRole ? 'Saving...' : editingRoleId ? 'Save Changes' : 'Create Role' }}
        </Button>
      </div>
    </form>
  </Modal>
</template>
