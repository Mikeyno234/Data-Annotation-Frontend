<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { toast } from '@/utils/toast'
import Input from '@/components/ui/Input.vue'
import Button from '@/components/ui/Button.vue'
import { ArrowRight, Layers, Loader2, CheckCircle2 } from 'lucide-vue-next'

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

const email = ref('')
const password = ref('')
const rememberMe = ref(true)
const isLoading = ref(false)
const isSuccess = ref(false)

async function handleLogin() {
  if (!email.value || !password.value) {
    toast.error('Validation Error', 'Please enter both email and password')
    return
  }

  isLoading.value = true
  try {
    await authStore.login({
      email: email.value,
      password: password.value,
      rememberMe: rememberMe.value,
    })
    isSuccess.value = true
    toast.success('Welcome back!', `Signed in as ${authStore.user?.full_name}`)
    setTimeout(() => {
      const redirectTarget = (route.query.redirect as string) || '/dashboard'
      router.push(redirectTarget)
    }, 450)
  } catch (err: any) {
    toast.error('Authentication Failed', err?.message || 'Invalid email or password')
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen w-full flex flex-col lg:flex-row bg-background select-none font-sans overflow-x-hidden">
    <!-- LEFT HALF: Utilitarian Brand Identity with Coordinate Grid & Technical Architecture -->
    <div class="lg:w-1/2 w-full bg-muted/40 p-8 lg:p-16 flex flex-col justify-between relative overflow-hidden border-b lg:border-b-0 lg:border-r border-border min-h-[300px] lg:min-h-screen">
      <!-- Subtle Technical Grid Overlay -->
      <div
        class="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none"
        style="background-size: 32px 32px; background-image: linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px);"
      ></div>

      <!-- Top: Main Logo & Title -->
      <div class="relative z-10 max-w-lg pt-4 lg:pt-16">
        <div class="flex items-center gap-3 group">
          <div class="size-8 rounded-md bg-foreground text-background flex items-center justify-center border border-border shrink-0 shadow-2xs">
            <Layers class="size-4" :stroke-width="1.6" />
          </div>
          <div class="flex items-center gap-2">
            <span class="text-xl font-semibold tracking-tight text-foreground">
              Data Annotation
            </span>
            <span class="text-[11px] font-medium px-2 py-0.5 rounded-md bg-muted text-muted-foreground border border-border/60">
              Enterprise
            </span>
          </div>
        </div>

        <div class="mt-8 space-y-2">
          <h1 class="text-2xl lg:text-3xl font-semibold tracking-tight text-foreground">
            Precision labeling workforce infrastructure.
          </h1>
          <p class="text-xs text-muted-foreground leading-relaxed max-w-md">
            High-throughput annotation workflows, deterministic consensus metrics, and programmatic quality assurance.
          </p>
        </div>
      </div>

      <!-- Bottom: Quality & Security Assurance Note -->
      <div class="relative z-10 flex items-center justify-between text-xs text-muted-foreground border-t border-border/80 pt-4 font-sans">
        <span>Enterprise Data Platform</span>
        <span>ISO / SOC-2 Compliant</span>
      </div>
    </div>

    <!-- RIGHT HALF: Clean Centered Login Card -->
    <div class="lg:w-1/2 w-full bg-background flex items-center justify-center p-6 lg:p-12 relative">
      <div class="w-full max-w-sm animate-scale-in">
        <div class="rounded-lg border border-border bg-card p-7 sm:p-8 shadow-2xs">
          <div class="mb-6">
            <h2 class="text-lg font-semibold text-foreground tracking-tight">
              Sign In
            </h2>
            <p class="text-xs text-muted-foreground mt-1">
              Enter your organization credentials to access the workspace
            </p>
          </div>

          <form class="space-y-4" @submit.prevent="handleLogin">
            <!-- Email Input -->
            <div class="space-y-1.5">
              <label class="text-xs font-medium text-foreground">
                Email Address
              </label>
              <Input
                v-model="email"
                type="email"
                required
                autocomplete="email"
                placeholder="example@mail.com"
                class="h-9 text-xs"
              />
            </div>

            <!-- Password Input -->
            <div class="space-y-1.5">
              <label class="text-xs font-medium text-foreground">
                Password
              </label>
              <Input
                v-model="password"
                type="password"
                required
                autocomplete="current-password"
                placeholder="••••••••••••"
                class="h-9 text-xs"
              />
            </div>

            <!-- Keep me logged in Checkbox -->
            <div class="flex items-center justify-between pt-0.5">
              <label class="flex items-center gap-2 cursor-pointer select-none">
                <input
                  v-model="rememberMe"
                  type="checkbox"
                  class="size-3.5 rounded border-border text-foreground accent-foreground focus:ring-0 cursor-pointer"
                />
                <span class="text-xs text-muted-foreground hover:text-foreground transition-colors">
                  Remember this session
                </span>
              </label>
            </div>

            <!-- Submit Button -->
            <Button
              type="submit"
              :disabled="isLoading || isSuccess"
              class="w-full h-9 mt-2 font-medium text-xs shadow-2xs"
              :class="isSuccess ? 'bg-emerald-600 text-white border-emerald-600' : ''"
            >
              <template v-if="isLoading">
                <Loader2 class="size-3.5 animate-spin" />
                <span>Authenticating...</span>
              </template>
              <template v-else-if="isSuccess">
                <CheckCircle2 class="size-3.5" :stroke-width="1.6" />
                <span>Authenticated</span>
              </template>
              <template v-else>
                <span>Continue</span>
                <ArrowRight class="size-3.5" :stroke-width="1.6" />
              </template>
            </Button>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.96) translateY(8px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.animate-fade-in-down {
  animation: fadeInDown 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.animate-fade-in-up {
  animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.15s both;
}

.animate-scale-in {
  animation: scaleIn 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
</style>
