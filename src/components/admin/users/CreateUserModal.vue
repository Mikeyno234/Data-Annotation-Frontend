<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { adminApi } from '@/api/admin'
import type { Role, Organization } from '@/types'
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
} from 'lucide-vue-next'

const props = defineProps<{
  open: boolean
  roles: Role[]
  organizations?: Organization[]
  isSuperAdmin?: boolean
  defaultOrganizationId?: number
}>()

const emit = defineEmits<{
  (e: 'update:open', val: boolean): void
  (e: 'close'): void
  (e: 'created'): void
}>()

const isSubmitting = ref(false)
const showPassword = ref(false)

const form = ref({
  fullName: '',
  email: '',
  password: '',
  roleId: 0,
  organizationId: null as number | null,
})

const errors = ref({
  fullName: '',
  email: '',
  password: '',
  roleId: '',
})

// Initialize or reset form when modal opens
watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      form.value = {
        fullName: '',
        email: '',
        password: '',
        roleId: props.roles.length > 0 ? props.roles[0].id : 0,
        organizationId: props.isSuperAdmin
          ? props.defaultOrganizationId || null
          : props.defaultOrganizationId || null,
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
  if (!form.value.password) {
    errors.value.password = 'Password is required'
    return false
  }
  if (form.value.password.length < 6) {
    errors.value.password = 'Password must be at least 6 characters'
    return false
  }
  errors.value.password = ''
  return true
}

function validateRoleId(): boolean {
  if (!form.value.roleId || form.value.roleId <= 0) {
    errors.value.roleId = 'Please select a role'
    return false
  }
  errors.value.roleId = ''
  return true
}

const isFormValid = computed(() => {
  return (
    form.value.fullName.trim().length >= 2 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.email.trim()) &&
    form.value.password.length >= 6 &&
    form.value.roleId > 0
  )
})

const roleOptions = computed<SelectOption<number>[]>(() =>
  props.roles.map((r) => ({
    value: r.id,
    label: r.name,
    description: r.description,
  }))
)

const organizationOptions = computed<SelectOption<number | null>[]>(() => [
  { value: null, label: 'Default Organization', description: 'Bound to caller organization scope' },
  ...(props.organizations || []).map((org) => ({
    value: org.id,
    label: org.name,
    description: org.slug ? `@${org.slug}` : undefined,
  })),
])

async function handleSubmit() {
  const isNameOk = validateFullName()
  const isEmailOk = validateEmail()
  const isPassOk = validatePassword()
  const isRoleOk = validateRoleId()

  if (!isNameOk || !isEmailOk || !isPassOk || !isRoleOk) {
    return
  }

  isSubmitting.value = true
  try {
    const payload = {
      full_name: form.value.fullName.trim(),
      email: form.value.email.trim().toLowerCase(),
      password: form.value.password,
      role_id: Number(form.value.roleId),
      organization_id:
        props.isSuperAdmin && form.value.organizationId
          ? Number(form.value.organizationId)
          : undefined,
    }

    const res: any = await adminApi.createUser(payload)
    const newUserName = res?.data?.data?.full_name || payload.full_name
    toast.success('User created', `${newUserName} has been successfully registered.`)

    emit('created')
    emit('update:open', false)
    emit('close')
  } catch (err: any) {
    const message =
      err?.response?.data?.message || err?.message || 'Failed to create user'
    toast.error('Registration failed', message)
  } finally {
    isSubmitting.value = false
  }
}

function handleClose() {
  if (!isSubmitting.value) {
    emit('update:open', false)
    emit('close')
  }
}
</script>

<template>
  <Modal
    :open="open"
    title="Add New User"
    description="Register a new workforce member and configure their operational privileges."
    max-width="max-w-md"
    @close="handleClose"
  >
    <form class="space-y-4" @submit.prevent="handleSubmit">
      <!-- Full Name -->
      <div class="space-y-1.5">
        <label class="flex items-center gap-1.5 text-xs font-medium text-foreground">
          <UserIcon class="size-3.5 text-muted-foreground" :stroke-width="1.6" />
          <span>Full Name <span class="text-destructive">*</span></span>
        </label>
        <Input
          v-model="form.fullName"
          placeholder="e.g. Jane Doe"
          class-name="h-9 text-xs rounded-lg"
          :disabled="isSubmitting"
          @blur="validateFullName"
        />
        <p v-if="errors.fullName" class="text-[11px] text-destructive font-medium">
          {{ errors.fullName }}
        </p>
      </div>

      <!-- Email Address -->
      <div class="space-y-1.5">
        <label class="flex items-center gap-1.5 text-xs font-medium text-foreground">
          <Mail class="size-3.5 text-muted-foreground" :stroke-width="1.6" />
          <span>Email Address <span class="text-destructive">*</span></span>
        </label>
        <Input
          v-model="form.email"
          type="email"
          placeholder="name@company.com"
          class-name="h-9 text-xs rounded-lg"
          :disabled="isSubmitting"
          @blur="validateEmail"
        />
        <p v-if="errors.email" class="text-[11px] text-destructive font-medium">
          {{ errors.email }}
        </p>
      </div>

      <!-- Password Field with Generator & Visibility Toggle -->
      <div class="space-y-1.5">
        <div class="flex items-center justify-between">
          <label class="flex items-center gap-1.5 text-xs font-medium text-foreground">
            <Lock class="size-3.5 text-muted-foreground" :stroke-width="1.6" />
            <span>Initial Password <span class="text-destructive">*</span></span>
          </label>
          <button
            type="button"
            class="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:text-primary/80 transition-colors cursor-pointer"
            :disabled="isSubmitting"
            @click="generateStrongPassword"
          >
            <Sparkles class="size-3" />
            <span>Generate</span>
          </button>
        </div>
        <div class="relative">
          <input
            v-model="form.password"
            :type="showPassword ? 'text' : 'password'"
            placeholder="Minimum 6 characters"
            :disabled="isSubmitting"
            class="flex h-9 w-full rounded-lg border border-border bg-card pl-3 pr-9 py-1.5 text-xs transition-all placeholder:text-muted-foreground/50 focus-visible:border-foreground/40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-foreground/15 disabled:cursor-not-allowed disabled:opacity-40 text-foreground"
            @blur="validatePassword"
          />
          <button
            type="button"
            class="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            tabindex="-1"
            :aria-label="showPassword ? 'Hide password' : 'Show password'"
            @click="showPassword = !showPassword"
          >
            <EyeOff v-if="showPassword" class="size-3.5" :stroke-width="1.6" />
            <Eye v-else class="size-3.5" :stroke-width="1.6" />
          </button>
        </div>
        <p v-if="errors.password" class="text-[11px] text-destructive font-medium">
          {{ errors.password }}
        </p>
      </div>

      <!-- Role Selection -->
      <div class="space-y-1.5">
        <label class="flex items-center gap-1.5 text-xs font-medium text-foreground">
          <Shield class="size-3.5 text-muted-foreground" :stroke-width="1.6" />
          <span>Assigned Role <span class="text-destructive">*</span></span>
        </label>
        <Select
          v-model="form.roleId"
          :options="roleOptions"
          placeholder="Select an operational role"
          :disabled="isSubmitting"
          :error="!!errors.roleId"
          @change="validateRoleId"
        />
        <p v-if="errors.roleId" class="text-[11px] text-destructive font-medium">
          {{ errors.roleId }}
        </p>
      </div>

      <!-- Organization Scope (Super Admin only) -->
      <div v-if="isSuperAdmin" class="space-y-1.5">
        <label class="flex items-center gap-1.5 text-xs font-medium text-foreground">
          <Building2 class="size-3.5 text-muted-foreground" :stroke-width="1.6" />
          <span>Organization Scope</span>
        </label>
        <Select
          v-model="form.organizationId"
          :options="organizationOptions"
          placeholder="Choose organization affiliation"
          :disabled="isSubmitting"
        />
      </div>

      <!-- Actions -->
      <div class="flex items-center justify-end gap-2.5 pt-3 border-t border-border mt-5">
        <Button
          variant="outline"
          size="sm"
          type="button"
          class-name="rounded-lg text-xs"
          :disabled="isSubmitting"
          @click="handleClose"
        >
          Cancel
        </Button>
        <Button
          variant="default"
          size="sm"
          type="submit"
          class-name="gap-1.5 rounded-lg text-xs shadow-xs"
          :disabled="isSubmitting || !isFormValid"
        >
          <RefreshCw v-if="isSubmitting" class="size-3.5 animate-spin" />
          <span>{{ isSubmitting ? 'Creating User...' : 'Create User' }}</span>
        </Button>
      </div>
    </form>
  </Modal>
</template>
