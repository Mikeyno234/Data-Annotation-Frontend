<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { toast } from '@/utils/toast'
import Input from '@/components/ui/Input.vue'
import Button from '@/components/ui/Button.vue'
import AppLogo from '@/components/ui/AppLogo.vue'
import {
  LoaderCircle,
  CheckCircle2,
  Tag,
  Video,
  FileText,
  Image,
  ArrowRight,
  ChevronRight,
} from 'lucide-vue-next'

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

const capabilities = [
  {
    icon: Image,
    label: 'Image annotation',
    desc: 'Bounding box, polygon, keypoint, segmentation',
  },
  {
    icon: Video,
    label: 'Video labeling',
    desc: 'Frame-level classification and temporal events',
  },
  {
    icon: FileText,
    label: 'Text NER and classification',
    desc: 'Named entity recognition, intent tagging',
  },
  {
    icon: Tag,
    label: 'Multi-class taxonomy',
    desc: 'Hierarchical labels with consensus scoring',
  },
]

const pipelineStages = ['Annotate', 'Review', 'QA', 'Complete']
</script>

<template>
  <div class="min-h-screen w-full flex flex-col lg:flex-row bg-background select-none font-sans overflow-x-hidden">

    <!-- LEFT PANEL: Platform context -->
    <div class="lg:w-[52%] w-full bg-sidebar flex flex-col justify-between p-8 lg:p-14 relative overflow-hidden border-b lg:border-b-0 lg:border-r border-sidebar-border min-h-[320px] lg:min-h-screen">

      <!-- Top: Logo wordmark only — no badge -->
      <div class="relative z-10">
        <div class="flex items-center gap-2.5">
          <AppLogo size="lg" :show-text="true" :theme-invert="true" />
        </div>

        <!-- Headline -->
        <div class="mt-10 space-y-3 max-w-md">
          <p class="text-[11px] font-medium tracking-widest uppercase text-sidebar-muted-foreground">
            Multi-modal labeling platform
          </p>
          <h1 class="text-2xl lg:text-[28px] font-semibold leading-snug tracking-tight text-sidebar-foreground">
            Annotation infrastructure for production ML pipelines.
          </h1>
        </div>

        <!-- Capability list -->
        <ul class="mt-8 space-y-4">
          <li
            v-for="cap in capabilities"
            :key="cap.label"
            class="flex items-start gap-3"
          >
            <div class="mt-0.5 size-7 rounded-md bg-sidebar-accent flex items-center justify-center shrink-0">
              <component :is="cap.icon" class="size-3.5 text-sidebar-foreground" :stroke-width="1.6" aria-hidden="true" />
            </div>
            <div>
              <p class="text-xs font-medium text-sidebar-foreground leading-tight">{{ cap.label }}</p>
              <p class="text-[11px] text-sidebar-muted-foreground mt-0.5 leading-snug">{{ cap.desc }}</p>
            </div>
          </li>
        </ul>
      </div>

      <!-- Bottom: workflow pipeline summary -->
      <div class="relative z-10 mt-10">
        <p class="text-[10px] font-medium tracking-widest uppercase text-sidebar-muted-foreground mb-3">
          Annotation pipeline
        </p>
        <div class="flex flex-wrap items-center gap-1.5">
          <template v-for="(stage, i) in pipelineStages" :key="stage">
            <span class="text-[11px] font-medium text-sidebar-foreground">{{ stage }}</span>
            <ChevronRight
              v-if="i < pipelineStages.length - 1"
              class="size-3 text-sidebar-muted-foreground"
              :stroke-width="1.6"
              aria-hidden="true"
            />
          </template>
        </div>
        <p class="text-[11px] text-sidebar-muted-foreground mt-2 leading-snug">
          Every item moves through annotation, review, and QA with a full audit trail.
        </p>
      </div>
    </div>

    <!-- RIGHT PANEL: Login form -->
    <div class="lg:w-[48%] w-full bg-background flex items-center justify-center p-6 lg:p-12 relative">
      <div class="w-full max-w-[400px] login-form-enter">
        <div class="relative overflow-hidden rounded-2xl border border-border/80 bg-card p-8 shadow-sm before:absolute before:size-40 before:rounded-full before:bg-primary/5 before:-top-12 before:-right-12 after:absolute after:size-40 after:rounded-full after:bg-primary/5 after:-bottom-12 after:-left-12 before:pointer-events-none after:pointer-events-none">

          <!-- Form header -->
          <div class="relative z-10 mb-6 space-y-1 text-center">
            <h2 class="text-xl font-bold text-foreground tracking-tight">
              Hi, Welcome Back
            </h2>
            <p class="text-xs text-muted-foreground leading-relaxed">
              Enter your credentials to access the workspace
            </p>
          </div>

          <form class="relative z-10 space-y-4" @submit.prevent="handleLogin">
            <!-- Email -->
            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-foreground" for="login-email">
                Work email
              </label>
              <Input
                id="login-email"
                v-model="email"
                type="email"
                required
                autocomplete="email"
                placeholder="you@company.com"
                class="h-10 text-sm"
              />
            </div>

            <!-- Password -->
            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-foreground" for="login-password">
                Password
              </label>
              <Input
                id="login-password"
                v-model="password"
                type="password"
                required
                autocomplete="current-password"
                placeholder="••••••••"
                class="h-10 text-sm"
              />
            </div>

            <!-- Remember -->
            <div class="flex items-center justify-between pt-0.5">
              <label class="flex items-center gap-2 cursor-pointer select-none">
                <input
                  v-model="rememberMe"
                  type="checkbox"
                  class="size-4 rounded-md border-border text-primary cursor-pointer accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
                />
                <span class="text-xs text-muted-foreground hover:text-foreground transition-colors duration-100">
                  Keep me signed in
                </span>
              </label>
            </div>

            <!-- Submit -->
            <Button
              type="submit"
              :disabled="isLoading || isSuccess"
              class="w-full h-10 mt-2 font-semibold text-xs rounded-xl shadow-2xs"
              :class="isSuccess ? 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-600' : ''"
            >
              <template v-if="isLoading">
                <LoaderCircle class="size-4 animate-spin" aria-hidden="true" />
                <span>Signing in...</span>
              </template>
              <template v-else-if="isSuccess">
                <CheckCircle2 class="size-4" :stroke-width="1.8" aria-hidden="true" />
                <span>Signed in</span>
              </template>
              <template v-else>
                <span>Sign In</span>
                <ArrowRight class="size-4" :stroke-width="1.8" aria-hidden="true" />
              </template>
            </Button>
          </form>

          <!-- Footer note inside card -->
          <div class="relative z-10 mt-6 pt-5 border-t border-border/80 text-center">
            <p class="text-[11px] text-muted-foreground leading-relaxed">
              Protected multi-modal labeling workspace.<br>
              Authorized personnel and annotator access only.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes loginFormIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.login-form-enter {
  animation: loginFormIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
</style>
