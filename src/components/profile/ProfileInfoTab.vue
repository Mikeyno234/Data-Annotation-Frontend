<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { getAvatarUrl } from '@/api/auth'
import { toast } from '@/utils/toast'
import Button from '@/components/ui/Button.vue'
import Input from '@/components/ui/Input.vue'
import Card from '@/components/ui/Card.vue'
import CardContent from '@/components/ui/CardContent.vue'
import Badge from '@/components/ui/Badge.vue'
import {
  HardDrive,
  Camera,
  Loader2,
  Mail,
  UploadCloud,
  Trash2,
  Save,
  ShieldCheck,
  Building2,
  Calendar,
} from 'lucide-vue-next'

const authStore = useAuthStore()

const fileInput = ref<HTMLInputElement | null>(null)
const isUploadingAvatar = ref(false)
const isDeletingAvatar = ref(false)
const avatarLoadError = ref(false)
const isDraggingOver = ref(false)

const userAvatarUrl = computed(() => {
  if (avatarLoadError.value) return ''
  return getAvatarUrl(authStore.user)
})

const profileForm = reactive({
  full_name: authStore.user?.full_name || '',
  email: authStore.user?.email || '',
})
const isSavingProfile = ref(false)

function triggerFileInput() {
  fileInput.value?.click()
}

async function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return
  await processAvatarUpload(file)
  target.value = ''
}

function handleDrop(event: DragEvent) {
  isDraggingOver.value = false
  const file = event.dataTransfer?.files?.[0]
  if (file) processAvatarUpload(file)
}

async function processAvatarUpload(file: File) {
  const validFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
  if (!validFormats.includes(file.type)) {
    toast.error('Invalid image type', 'Please upload a JPG, PNG, WEBP, GIF, or SVG image.')
    return
  }
  if (file.size > 5 * 1024 * 1024) {
    toast.error('File too large', 'Avatar image must be smaller than 5MB.')
    return
  }

  isUploadingAvatar.value = true
  avatarLoadError.value = false
  try {
    await authStore.uploadAvatar(file)
    toast.success('Avatar updated', 'Your new profile photo was uploaded to MinIO storage.')
  } catch (err: any) {
    toast.error('Upload failed', err?.message || 'Could not upload avatar image')
  } finally {
    isUploadingAvatar.value = false
  }
}

async function handleRemoveAvatar() {
  if (!authStore.user?.avatar) return
  isDeletingAvatar.value = true
  try {
    await authStore.deleteAvatar()
    avatarLoadError.value = false
    toast.success('Avatar removed', 'Default user initials badge restored.')
  } catch (err: any) {
    toast.error('Failed to remove avatar', err?.message)
  } finally {
    isDeletingAvatar.value = false
  }
}

async function handleUpdateProfile() {
  if (!profileForm.full_name.trim()) {
    toast.error('Validation error', 'Full name is required')
    return
  }
  isSavingProfile.value = true
  try {
    await authStore.updateProfile({ full_name: profileForm.full_name })
    toast.success('Profile updated', 'Your display name has been updated successfully.')
  } catch (err: any) {
    toast.error('Failed to update profile', err?.message)
  } finally {
    isSavingProfile.value = false
  }
}

function formatDate(dateStr?: string) {
  if (!dateStr) return '—'
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return dateStr
  }
}
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
    <input
      ref="fileInput"
      type="file"
      accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,image/svg+xml"
      class="hidden"
      @change="handleFileChange"
    />

    <Card class="md:col-span-2 bg-card/90 shadow-sm">
      <div class="px-6 py-4 flex items-center justify-between">
        <div>
          <h2 class="text-sm font-bold text-foreground">Profile & Avatar</h2>
          <p class="text-xs text-muted-foreground mt-0.5">Upload a customized user picture to MinIO S3 storage.</p>
        </div>
        <Badge variant="outline" class="gap-1 text-[10px] font-semibold">
          <HardDrive class="size-3 text-primary" />
          MinIO S3
        </Badge>
      </div>

      <CardContent class="p-6 pt-2 flex flex-col gap-6">
        <!-- Avatar Upload Area -->
        <div class="flex flex-col sm:flex-row items-start sm:items-center gap-5 p-5 rounded-2xl bg-muted/40 shadow-inner">
          <div
            class="relative group cursor-pointer"
            :class="isDraggingOver ? 'ring-2 ring-primary ring-offset-2' : ''"
            @click="triggerFileInput"
            @dragover.prevent="isDraggingOver = true"
            @dragleave.prevent="isDraggingOver = false"
            @drop.prevent="handleDrop"
          >
            <div class="size-20 rounded-3xl overflow-hidden shadow-md bg-card flex items-center justify-center relative">
              <img
                v-if="userAvatarUrl && !avatarLoadError"
                :src="userAvatarUrl"
                :alt="authStore.user?.full_name"
                class="size-full object-cover"
                @error="avatarLoadError = true"
              />
              <div v-else class="size-full flex items-center justify-center bg-primary/15 text-primary font-bold text-2xl">
                {{ authStore.user?.full_name?.slice(0, 2).toUpperCase() || 'U' }}
              </div>
              <div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[10px] gap-1 backdrop-blur-[1px]">
                <Camera class="size-5" />
                <span class="font-medium">Change</span>
              </div>
              <div v-if="isUploadingAvatar || isDeletingAvatar" class="absolute inset-0 bg-background/80 flex items-center justify-center">
                <Loader2 class="size-6 text-primary animate-spin" />
              </div>
            </div>

            <div class="absolute -bottom-1 -right-1 size-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md border-2 border-background">
              <Camera class="size-3.5" />
            </div>
          </div>

          <div class="flex-1 min-w-0">
            <h3 class="text-sm font-bold text-foreground">{{ authStore.user?.full_name || 'User Profile' }}</h3>
            <p class="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5 truncate">
              <Mail class="size-3 shrink-0" />
              <span>{{ authStore.user?.email }}</span>
            </p>
            <div class="mt-3 flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                class="gap-1.5 text-xs h-8 rounded-xl font-semibold shadow-xs"
                :disabled="isUploadingAvatar || isDeletingAvatar"
                @click="triggerFileInput"
              >
                <UploadCloud class="size-3.5" />
                <span>{{ isUploadingAvatar ? 'Uploading...' : 'Upload Image' }}</span>
              </Button>

              <Button
                v-if="authStore.user?.avatar"
                variant="outline"
                size="sm"
                class="gap-1.5 text-xs h-8 rounded-xl text-destructive hover:bg-destructive/10"
                :disabled="isUploadingAvatar || isDeletingAvatar"
                @click="handleRemoveAvatar"
              >
                <Trash2 class="size-3.5" />
                <span>Remove</span>
              </Button>
            </div>
            <p class="text-[11px] text-muted-foreground mt-2">
              Supports JPG, PNG, WEBP, GIF, SVG up to 5MB. Persisted in MinIO Object Storage.
            </p>
          </div>
        </div>

        <!-- Profile Input Form -->
        <div class="space-y-4">
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-semibold text-foreground">Full Name *</label>
            <Input v-model="profileForm.full_name" placeholder="Your display name" />
          </div>

          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-semibold text-foreground">Email Address</label>
            <Input v-model="profileForm.email" disabled class="cursor-not-allowed opacity-80" />
            <span class="text-[11px] text-muted-foreground">Primary email address managed by organization administrator.</span>
          </div>

          <div class="pt-2 flex items-center justify-end">
            <Button size="sm" class="gap-1.5 text-xs rounded-xl font-semibold shadow-md h-9 px-4" :disabled="isSavingProfile" @click="handleUpdateProfile">
              <Save class="size-3.5" />
              <span>{{ isSavingProfile ? 'Saving Changes...' : 'Save Profile' }}</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Account Metadata Card -->
    <Card class="bg-card/90 shadow-sm h-fit">
      <div class="px-6 py-4">
        <h2 class="text-sm font-bold text-foreground">Role & Access</h2>
      </div>
      <CardContent class="p-6 pt-0 flex flex-col gap-4 text-xs">
        <div>
          <span class="text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">Assigned Role</span>
          <div class="mt-1.5 flex items-center gap-2">
            <ShieldCheck class="size-4 text-primary" />
            <Badge variant="secondary" class="text-xs font-bold">{{ authStore.user?.role?.name || authStore.currentRole }}</Badge>
          </div>
        </div>

        <div class="pt-2">
          <span class="text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">Organization</span>
          <div class="mt-1.5 flex items-center gap-2 text-foreground font-semibold">
            <Building2 class="size-4 text-primary" />
            <span>{{ authStore.user?.organization?.name || authStore.organization?.name || '—' }}</span>
          </div>
        </div>

        <div class="pt-2">
          <span class="text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">Account Status</span>
          <div class="mt-1.5">
            <Badge
              :variant="authStore.user?.status === 'ACTIVE' ? 'success' : 'outline'"
              :dot="authStore.user?.status === 'ACTIVE'"
              class="text-xs font-bold"
            >
              {{ authStore.user?.status === 'ACTIVE' ? 'Active' : (authStore.user?.status || 'Active') }}
            </Badge>
          </div>
        </div>

        <div class="pt-2">
          <span class="text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">Member Since</span>
          <div class="mt-1.5 flex items-center gap-2 text-muted-foreground">
            <Calendar class="size-3.5" />
            <span>{{ formatDate(authStore.user?.created_at) }}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
