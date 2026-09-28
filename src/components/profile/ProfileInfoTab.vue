<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { getAvatarUrl } from '@/api/auth'
import { toast } from '@/utils/toast'
import Button from '@/components/ui/Button.vue'
import Input from '@/components/ui/Input.vue'
import Badge from '@/components/ui/Badge.vue'
import {
  HardDrive,
  Camera,
  LoaderCircle,
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
    toast.success('Avatar updated', 'Your profile photo has been updated.')
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
  if (!dateStr) return 'N/A'
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

    <!-- Left Main Card (Berry MainCard style with circular accent) -->
    <div class="md:col-span-2 rounded-2xl border border-border/80 bg-card overflow-hidden shadow-xs relative before:absolute before:size-52 before:rounded-full before:bg-primary/5 before:-top-20 before:-right-20 before:pointer-events-none">
      <div class="px-6 py-4 flex items-center justify-between border-b border-border/70 relative z-10">
        <div>
          <h2 class="text-sm font-bold text-foreground">Profile & Avatar</h2>
          <p class="text-xs text-muted-foreground mt-0.5">Update your display photo and personal details.</p>
        </div>
      </div>

      <div class="p-6 pt-5 flex flex-col gap-6 relative z-10">
        <!-- Avatar Upload Area -->
        <div class="flex flex-col sm:flex-row items-start sm:items-center gap-5 p-5 rounded-2xl bg-muted/30 border border-border/60 shadow-2xs">
          <div
            class="relative group cursor-pointer"
            :class="isDraggingOver ? 'ring-2 ring-primary ring-offset-2' : ''"
            @click="triggerFileInput"
            @dragover.prevent="isDraggingOver = true"
            @dragleave.prevent="isDraggingOver = false"
            @drop.prevent="handleDrop"
          >
            <div class="size-20 rounded-2xl overflow-hidden shadow-xs bg-card flex items-center justify-center relative border border-border/70">
              <img
                v-if="userAvatarUrl && !avatarLoadError"
                :src="userAvatarUrl"
                :alt="authStore.user?.full_name"
                class="size-full object-cover"
                @error="avatarLoadError = true"
              />
              <div v-else class="size-full flex items-center justify-center bg-primary/10 text-primary font-bold text-xl">
                {{ authStore.user?.full_name?.slice(0, 2).toUpperCase() || 'U' }}
              </div>
              <div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[10px] gap-1 backdrop-blur-[1px]">
                <Camera class="size-4" />
                <span class="font-medium">Change</span>
              </div>
              <div v-if="isUploadingAvatar || isDeletingAvatar" class="absolute inset-0 bg-background/80 flex items-center justify-center">
                <LoaderCircle class="size-5 text-primary animate-spin" />
              </div>
            </div>

            <div class="absolute -bottom-1 -right-1 size-6.5 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-xs border-2 border-background">
              <Camera class="size-3.5" :stroke-width="1.8" />
            </div>
          </div>

          <div class="flex-1 min-w-0">
            <h3 class="text-sm font-bold text-foreground">{{ authStore.user?.full_name || 'User Profile' }}</h3>
            <p class="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5 truncate">
              <Mail class="size-3.5 shrink-0 opacity-70" />
              <span>{{ authStore.user?.email }}</span>
            </p>
            <div class="mt-3 flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                class="gap-1.5 text-xs h-8.5 px-3.5 rounded-xl font-medium shadow-xs"
                :disabled="isUploadingAvatar || isDeletingAvatar"
                @click="triggerFileInput"
              >
                <UploadCloud class="size-3.5" :stroke-width="1.8" />
                <span>{{ isUploadingAvatar ? 'Uploading...' : 'Upload Image' }}</span>
              </Button>

              <Button
                v-if="authStore.user?.avatar"
                variant="outline"
                size="sm"
                class="gap-1.5 text-xs h-8.5 px-3 rounded-xl text-destructive hover:bg-destructive/10"
                :disabled="isUploadingAvatar || isDeletingAvatar"
                @click="handleRemoveAvatar"
              >
                <Trash2 class="size-3.5" :stroke-width="1.8" />
                <span>Remove</span>
              </Button>
            </div>
            <p class="text-[11px] text-muted-foreground mt-2">
              Supports JPG, PNG, WEBP, GIF, or SVG up to 5MB.
            </p>
          </div>
        </div>

        <!-- Profile Input Form -->
        <div class="space-y-4">
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-semibold text-foreground">Full Name *</label>
            <Input v-model="profileForm.full_name" placeholder="Your display name" class="rounded-xl h-9.5 text-xs" />
          </div>

          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-semibold text-foreground">Email Address</label>
            <Input v-model="profileForm.email" disabled class="rounded-xl h-9.5 text-xs cursor-not-allowed opacity-80" />
            <span class="text-[11px] text-muted-foreground">Primary email address managed by organization administrator.</span>
          </div>

          <div class="pt-2 flex items-center justify-end">
            <Button size="sm" class="gap-2 text-xs rounded-xl font-semibold shadow-xs h-9 px-4" :disabled="isSavingProfile" @click="handleUpdateProfile">
              <Save class="size-4" :stroke-width="1.8" />
              <span>{{ isSavingProfile ? 'Saving Changes...' : 'Save Profile' }}</span>
            </Button>
          </div>
        </div>
      </div>
    </div>

    <!-- Account Metadata Card (Berry Right Column Card) -->
    <div class="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-xs h-fit relative before:absolute before:size-36 before:rounded-full before:bg-primary/5 before:-top-12 before:-right-12 before:pointer-events-none">
      <div class="px-5 py-4 border-b border-border/70 relative z-10">
        <h2 class="text-sm font-bold text-foreground">Role & Access</h2>
      </div>
      <div class="p-5 flex flex-col gap-4 text-xs relative z-10">
        <div>
          <span class="text-xs text-muted-foreground font-medium">Assigned role</span>
          <div class="mt-1.5 flex items-center gap-2">
            <ShieldCheck class="size-4 text-primary" :stroke-width="1.8" />
            <Badge variant="secondary" class="text-xs font-semibold rounded-full px-2.5">{{ authStore.user?.role?.name || authStore.currentRole }}</Badge>
          </div>
        </div>

        <div class="pt-3 border-t border-border/60">
          <span class="text-xs text-muted-foreground font-medium">Organization</span>
          <div class="mt-1.5 flex items-center gap-2 text-foreground font-semibold">
            <Building2 class="size-4 text-primary" :stroke-width="1.8" />
            <span>{{ authStore.user?.organization?.name || authStore.organization?.name || 'N/A' }}</span>
          </div>
        </div>

        <div class="pt-3 border-t border-border/60">
          <span class="text-xs text-muted-foreground font-medium">Status</span>
          <div class="mt-1.5">
            <Badge
              :variant="authStore.user?.status === 'ACTIVE' ? 'success' : 'outline'"
              class="text-xs font-semibold rounded-full px-2.5 uppercase"
            >
              {{ authStore.user?.status === 'ACTIVE' ? 'Active' : (authStore.user?.status?.toLowerCase() || 'active') }}
            </Badge>
          </div>
        </div>

        <div class="pt-3 border-t border-border/60">
          <span class="text-xs text-muted-foreground font-medium">Member since</span>
          <div class="mt-1.5 flex items-center gap-2 text-muted-foreground tabular-nums font-medium">
            <Calendar class="size-3.5" :stroke-width="1.8" />
            <span>{{ formatDate(authStore.user?.created_at) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
