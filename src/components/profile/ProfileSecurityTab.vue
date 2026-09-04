<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { toast } from '@/utils/toast'
import Card from '@/components/ui/Card.vue'
import CardContent from '@/components/ui/CardContent.vue'
import Button from '@/components/ui/Button.vue'
import Input from '@/components/ui/Input.vue'
import { Lock, Save } from 'lucide-vue-next'

const authStore = useAuthStore()

const securityForm = reactive({
  current_password: '',
  new_password: '',
  confirm_password: '',
})
const isSavingPassword = ref(false)

async function handleUpdatePassword() {
  if (!securityForm.current_password) {
    toast.error('Validation error', 'Please enter your current password.')
    return
  }
  if (!securityForm.new_password || securityForm.new_password.length < 6) {
    toast.error('Validation error', 'New password must be at least 6 characters.')
    return
  }
  if (securityForm.new_password !== securityForm.confirm_password) {
    toast.error('Validation error', 'New password and confirmation do not match.')
    return
  }

  isSavingPassword.value = true
  try {
    await authStore.updatePassword({
      current_password: securityForm.current_password,
      new_password: securityForm.new_password,
    })
    toast.success('Password changed', 'Your password has been updated securely.')
    securityForm.current_password = ''
    securityForm.new_password = ''
    securityForm.confirm_password = ''
  } catch (err: any) {
    toast.error('Password change failed', err?.message)
  } finally {
    isSavingPassword.value = false
  }
}
</script>

<template>
  <div class="max-w-2xl">
    <Card class="bg-card/90 shadow-sm">
      <div class="px-6 py-4">
        <h2 class="text-sm font-bold text-foreground">Password & Security</h2>
        <p class="text-xs text-muted-foreground mt-0.5">Ensure your account uses a strong, complex password.</p>
      </div>

      <CardContent class="p-6 pt-2">
        <form class="space-y-4" @submit.prevent="handleUpdatePassword">
          <div class="space-y-1.5">
            <label class="text-xs font-semibold text-foreground">Current Password</label>
            <Input v-model="securityForm.current_password" type="password" placeholder="••••••••" required />
          </div>

          <div class="space-y-1.5">
            <label class="text-xs font-semibold text-foreground">New Password</label>
            <Input v-model="securityForm.new_password" type="password" placeholder="At least 6 characters" required />
          </div>

          <div class="space-y-1.5">
            <label class="text-xs font-semibold text-foreground">Confirm New Password</label>
            <Input v-model="securityForm.confirm_password" type="password" placeholder="••••••••" required />
          </div>

          <div class="pt-2 flex justify-end">
            <Button
              type="submit"
              size="sm"
              class="gap-1.5 text-xs rounded-xl font-semibold shadow-xs h-9 px-4"
              :disabled="isSavingPassword"
            >
              <Save class="size-3.5" />
              <span>{{ isSavingPassword ? 'Updating Password...' : 'Update Password' }}</span>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  </div>
</template>
