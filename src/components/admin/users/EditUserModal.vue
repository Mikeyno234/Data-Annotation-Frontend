<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { adminApi } from '@/api/admin'
import type { User, Role, Organization, UpdateUserPayload } from '@/types'
import { toast } from '@/utils/toast'
import Modal from '@/components/ui/Modal.vue'
import Button from '@/components/ui/Button.vue'
import Input from '@/components/ui/Input.vue'
import Select, { type SelectOption } from '@/components/ui/Select.vue'
import {
  User as UserIcon,
  Mail,
  Lock,
  Shield,
  Building2,
  Eye,
  EyeOff,
  RefreshCw,
  Sparkles,
  Activity,
} from 'lucide-vue-next'

const props = defineProps<{
  open: boolean
  user: User | null
  roles: Role[]
  organizations?: Organization[]
  isSuperAdmin?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:open', val: boolean): void
  (e: 'close'): void
  (e: 'updated'): void
}>()

const isSubmitting = ref(false)
const showPassword = ref(false)

const form = ref({
  fullName: '',
  email: '',
  password: '',
  roleId: 0,
  organizationId: null as number | null,
  status: 'ACTIVE',
})

const errors = ref({
  fullName: '',
  email: '',
  password: '',
  roleId: '',
})

// Populate form when modal opens or user prop changes
watch(
  () => [props.open, props.user] as const,
  ([isOpen, u]) => {
    if (isOpen && u) {
      form.value = {
        fullName: u.full_name || '',
        email: u.email || '',
        password: '',
        roleId: u.role_id || (props.roles.length > 0 ? props.roles[0].id : 0),
        organizationId: u.organization_id ?? null,
        status: u.status || 'ACTIVE',
      }
      errors.value = { fullName: '', email: '', password: '', roleId: '' }
      showPassword.value = false
    }
  },
  { immediate: true }
)

function generateStrongPassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*'
  let pwd = ''
  for (let i = 0; i < 12; i++) {
    pwd += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  form.value.password = pwd
  showPassword.value = true
  validatePassword()
}

function validateFullName(): boolean {
  if (!form.value.fullName.trim()) {
    errors.value.fullName = 'Full name is required'
    return false
  }
  if (form.value.fullName.trim().length < 2) {
    errors.value.fullName = 'Name must be at least 2 characters'
    return false
  }
  errors.value.fullName = ''
  return true
}

function validateEmail(): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const email = form.value.email.trim()
  if (!email) {
    errors.value.email = 'Email address is required'
    return false
  }
  if (!emailRegex.test(email)) {
    errors.value.email = 'Please enter a valid email address'
    return false
  }
  errors.value.email = ''
  return true
}

function validatePassword(): boolean {
  // Password is completely optional when editing
  if (!form.value.password) {
    errors.value.password = ''
    return true
  }
  if (form.value.password.length < 6) {
    errors.value.password = 'Password must be at least 6 characters'
    return false
  }
  errors.value.password = ''
  return true
}

function validateForm(): boolean {
  const isNameValid = validateFullName()
  const isEmailValid = validateEmail()
  const isPwdValid = validatePassword()
  const isRoleValid = form.value.roleId > 0

  if (!isRoleValid) {
    errors.value.roleId = 'Please select a system role'
  } else {
    errors.value.roleId = ''
  }

  return isNameValid && isEmailValid && isPwdValid && isRoleValid
}

const roleOptions = computed<SelectOption<number>[]>(() =>
  props.roles.map((r) => ({
    value: r.id,
    label: r.name,
    description: r.description,
  }))
)

const organizationOptions = computed<SelectOption<number | null>[]>(() => {
  const orgs: SelectOption<number | null>[] = (props.organizations || []).map((o) => ({
    value: o.id,
    label: o.name,
    description: o.slug ? `@${o.slug}` : undefined,
  }))
  orgs.unshift({
    value: null,
    label: 'Global / None (Super Admin default)',
    description: 'Not assigned to a specific tenant organization',
  })
  return orgs
})

const statusOptions: SelectOption<string>[] = [
  {
    value: 'ACTIVE',
    label: 'Active',
    description: 'Account is operational and allowed system login',
  },
  {
    value: 'INACTIVE',
    label: 'Inactive',
    description: 'Account is deactivated and cannot log in',
  },
  {
    value: 'SUSPENDED',
    label: 'Suspended',
    description: 'Access suspended due to policy or administrative hold',
  },
]

async function handleSubmit() {
  if (!props.user) return
  if (!validateForm()) return

  isSubmitting.value = true
  try {
    const payload: UpdateUserPayload = {
      full_name: form.value.fullName.trim(),
      email: form.value.email.trim().toLowerCase(),
      role_id: form.value.roleId,
      status: form.value.status,
    }

    if (props.isSuperAdmin) {
      payload.organization_id = form.value.organizationId
    }

    if (form.value.password.trim()) {
      payload.password = form.value.password.trim()
    }

    await adminApi.updateUser(props.user.id, payload)
    toast.success('User updated successfully', `${form.value.fullName}'s account profile has been saved.`)
    emit('updated')
    handleClose()
  } catch (err: any) {
    const message = err.response?.data?.error?.message || err.response?.data?.message || err.message || 'Failed to update user'
    toast.error('Failed to update user', message)
  } finally {
    isSubmitting.value = false
  }
}

function handleClose() {
  emit('update:open', false)
  emit('close')
}
</script>

<template>
  <Modal
    :open="open"
    title="Edit User Account"
    description="Update enterprise account credentials, role assignments, and organizational access."
    size="lg"
    @update:open="emit('update:open', $event)"
    @close="handleClose"
  >
    <form @submit.prevent="handleSubmit" class="space-y-4 text-xs">
      <!-- Full Name -->
      <div class="space-y-1.5">
        <label for="edit-user-fullname" class="font-medium text-foreground flex items-center gap-1.5">
          <UserIcon class="size-3.5 text-muted-foreground" />
          <span>Full Name <span class="text-destructive">*</span></span>
        </label>
        <Input
          id="edit-user-fullname"
          v-model="form.fullName"
          placeholder="e.g. Jane Doe"
          :class-name="errors.fullName ? 'border-destructive focus-visible:border-destructive' : ''"
          @blur="validateFullName"
        />
        <p v-if="errors.fullName" class="text-[11px] text-destructive">{{ errors.fullName }}</p>
      </div>

      <!-- Email Address -->
      <div class="space-y-1.5">
        <label for="edit-user-email" class="font-medium text-foreground flex items-center gap-1.5">
          <Mail class="size-3.5 text-muted-foreground" />
          <span>Corporate Email <span class="text-destructive">*</span></span>
        </label>
        <Input
          id="edit-user-email"
          v-model="form.email"
          type="email"
          placeholder="e.g. jane.doe@enterprise.com"
          :class-name="errors.email ? 'border-destructive focus-visible:border-destructive' : ''"
          @blur="validateEmail"
        />
        <p v-if="errors.email" class="text-[11px] text-destructive">{{ errors.email }}</p>
      </div>

      <!-- Password Reset (Optional) -->
      <div class="space-y-1.5">
        <div class="flex items-center justify-between">
          <label for="edit-user-password" class="font-medium text-foreground flex items-center gap-1.5">
            <Lock class="size-3.5 text-muted-foreground" />
            <span>New Password <span class="text-[11px] font-normal text-muted-foreground">(leave blank to keep unchanged)</span></span>
          </label>
          <button
            type="button"
            class="text-[11px] text-primary hover:underline flex items-center gap-1 font-medium transition-colors"
            @click="generateStrongPassword"
          >
            <Sparkles class="size-3" />
            <span>Generate Password</span>
          </button>
        </div>
        <div class="relative">
          <Input
            id="edit-user-password"
            v-model="form.password"
            :type="showPassword ? 'text' : 'password'"
            placeholder="Min. 6 characters if updating"
            :class-name="errors.password ? 'border-destructive focus-visible:border-destructive pr-9' : 'pr-9'"
            @input="validatePassword"
          />
          <button
            type="button"
            class="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            @click="showPassword = !showPassword"
          >
            <EyeOff v-if="showPassword" class="size-3.5" />
            <Eye v-else class="size-3.5" />
          </button>
        </div>
        <p v-if="errors.password" class="text-[11px] text-destructive">{{ errors.password }}</p>
      </div>

      <!-- Role & Status (2 Columns) -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <!-- Role Assignment -->
        <div class="space-y-1.5">
          <label class="font-medium text-foreground flex items-center gap-1.5">
            <Shield class="size-3.5 text-muted-foreground" />
            <span>System Role <span class="text-destructive">*</span></span>
          </label>
          <Select
            v-model="form.roleId"
            :options="roleOptions"
            placeholder="Select a role..."
            size="sm"
          />
          <p v-if="errors.roleId" class="text-[11px] text-destructive">{{ errors.roleId }}</p>
        </div>

        <!-- Account Status -->
        <div class="space-y-1.5">
          <label class="font-medium text-foreground flex items-center gap-1.5">
            <Activity class="size-3.5 text-muted-foreground" />
            <span>Account Status</span>
          </label>
          <Select
            v-model="form.status"
            :options="statusOptions"
            placeholder="Select status..."
            size="sm"
          />
        </div>
      </div>

      <!-- Organization Assignment (Super Admin Only) -->
      <div v-if="isSuperAdmin" class="space-y-1.5">
        <label class="font-medium text-foreground flex items-center gap-1.5">
          <Building2 class="size-3.5 text-muted-foreground" />
          <span>Organization Tenant</span>
        </label>
        <Select
          v-model="form.organizationId"
          :options="organizationOptions"
          placeholder="Select an organization..."
          size="sm"
        />
        <p class="text-[11px] text-muted-foreground">
          Assigning a tenant scopes this user's project and review workspace visibility.
        </p>
      </div>

      <!-- Modal Footer -->
      <div class="flex items-center justify-end gap-2 pt-4 border-t border-border">
        <Button
          type="button"
          variant="outline"
          size="sm"
          :disabled="isSubmitting"
          @click="handleClose"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="default"
          size="sm"
          class-name="gap-1.5"
          :disabled="isSubmitting"
        >
          <RefreshCw v-if="isSubmitting" class="size-3.5 animate-spin" />
          <span>{{ isSubmitting ? 'Saving...' : 'Save Changes' }}</span>
        </Button>
      </div>
    </form>
  </Modal>
</template>
