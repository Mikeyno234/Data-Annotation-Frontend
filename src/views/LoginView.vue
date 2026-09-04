<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { toast } from '@/utils/toast'
import { ArrowRight, Layers, Loader2, CheckCircle2 } from 'lucide-vue-next'

const authStore = useAuthStore()
const router = useRouter()

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
      router.push('/dashboard')
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
    <!-- LEFT HALF: Brand Identity with Staggered Entrance Animation -->
    <div class="lg:w-1/2 w-full bg-[#fdf6f0] dark:bg-[#16120e] p-8 lg:p-16 flex flex-col justify-between relative overflow-hidden border-b lg:border-b-0 lg:border-r border-border/40 min-h-[260px] lg:min-h-screen">
      <!-- Ambient background decoration with subtle pulse -->
      <div class="absolute -top-24 -left-24 size-96 rounded-full bg-orange-400/15 blur-[100px] pointer-events-none animate-pulse duration-1000"></div>
      <div class="absolute bottom-10 left-10 size-64 rounded-full bg-orange-300/10 blur-[80px] pointer-events-none"></div>

      <!-- Top: Main Logo & Title with Slide-down Entrance -->
      <div class="relative z-10 max-w-lg pt-4 lg:pt-20 animate-fade-in-down">
        <div class="flex items-center gap-3.5 group">
          <!-- Geometric Brand Icon with Hover Spring -->
          <div class="relative size-11 flex items-center justify-center rounded-xl bg-[#fa694c] shadow-md shadow-orange-500/25 text-white transition-all duration-300 group-hover:scale-105 group-hover:rotate-3">
            <Layers class="size-6 transition-transform duration-300 group-hover:scale-110" />
            <div class="absolute -bottom-1 -right-1 size-3.5 rounded-sm bg-orange-300 border-2 border-[#fdf6f0] dark:border-[#16120e] transition-transform duration-300 group-hover:translate-x-0.5 group-hover:translate-y-0.5"></div>
          </div>
          <span class="text-3xl font-extrabold tracking-tight text-foreground">
            Data Annotation
          </span>
        </div>
      </div>

      <!-- Empty spacer -->
      <div class="relative z-10 hidden lg:block"></div>

      <!-- Bottom-Right Geometric Tile Decoration with Fade-in Animation -->
      <div class="absolute bottom-0 right-0 pointer-events-none hidden sm:grid grid-cols-2 grid-rows-2 w-32 h-32 opacity-90 animate-fade-in-up">
        <div class="bg-orange-400/70 transition-all duration-500 hover:opacity-80"></div>
        <div class="bg-orange-500 transition-all duration-500 hover:opacity-80"></div>
        <div class="bg-purple-300 dark:bg-purple-900/60 transition-all duration-500 hover:opacity-80"></div>
        <div class="bg-pink-400 transition-all duration-500 hover:opacity-80"></div>
      </div>
    </div>

    <!-- RIGHT HALF: Clean Centered Login Card with Scale-in Animation -->
    <div class="lg:w-1/2 w-full bg-background flex items-center justify-center p-6 lg:p-12 relative">
      <div class="w-full max-w-md animate-scale-in">
        <!-- Floating Login Box -->
        <div class="bg-card rounded-2xl p-8 sm:p-10 shadow-xl border border-border/50 transition-all duration-300 hover:shadow-2xl">
          <div class="mb-7">
            <h2 class="text-2xl font-bold text-foreground tracking-tight mb-1">
              Log in
            </h2>
            <p class="text-xs text-muted-foreground">
              Sign in with your organization email and password
            </p>
          </div>

          <form class="space-y-4" @submit.prevent="handleLogin">
            <!-- Email Input -->
            <div class="space-y-1.5 group">
              <label class="text-xs font-medium text-foreground transition-colors group-focus-within:text-primary">
                Email Address
              </label>
              <input
                v-model="email"
                type="email"
                required
                autocomplete="email"
                placeholder="name@enterprise.io"
                class="w-full h-10 px-3 rounded-lg border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all duration-200 shadow-xs focus:scale-[1.01]"
              />
            </div>

            <!-- Password Input -->
            <div class="space-y-1.5 group">
              <label class="text-xs font-medium text-foreground transition-colors group-focus-within:text-primary">
                Password
              </label>
              <input
                v-model="password"
                type="password"
                required
                autocomplete="current-password"
                placeholder="••••••••"
                class="w-full h-10 px-3 rounded-lg border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all duration-200 shadow-xs focus:scale-[1.01]"
              />
            </div>

            <!-- Keep me logged in Checkbox -->
            <div class="flex items-center justify-between pt-1">
              <label class="flex items-center gap-2.5 cursor-pointer group select-none">
                <input
                  v-model="rememberMe"
                  type="checkbox"
                  class="size-3.5 rounded border-border text-primary focus:ring-primary/30 cursor-pointer accent-primary transition-transform group-hover:scale-110"
                />
                <span class="text-xs text-muted-foreground group-hover:text-foreground transition-colors font-medium">
                  Keep me logged in this browser
                </span>
              </label>
            </div>

            <!-- Submit Button with Dynamic Motion States -->
            <button
              type="submit"
              :disabled="isLoading || isSuccess"
              class="w-full h-10 mt-2 rounded-lg font-medium text-xs transition-all duration-200 active:scale-[0.97] disabled:opacity-75 disabled:pointer-events-none cursor-pointer flex items-center justify-center gap-2 shadow-sm relative overflow-hidden"
              :class="
                isSuccess
                  ? 'bg-emerald-600 text-white'
                  : 'bg-foreground text-background hover:bg-foreground/90'
              "
            >
              <template v-if="isLoading">
                <Loader2 class="size-4 animate-spin" />
                <span>Signing in...</span>
              </template>
              <template v-else-if="isSuccess">
                <CheckCircle2 class="size-4 animate-bounce" />
                <span>Authenticated!</span>
              </template>
              <template v-else>
                <span>Log in</span>
                <ArrowRight class="size-3.5 transition-transform duration-200 group-hover:translate-x-1" />
              </template>
            </button>
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
