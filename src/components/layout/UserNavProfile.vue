<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { getAvatarUrl } from '@/api/auth'
import { Settings2, LogOut, ChevronDown, Building2 } from 'lucide-vue-next'

const router = useRouter()
const authStore = useAuthStore()

const profileMenuOpen = ref(false)
const avatarLoadError = ref(false)

const userAvatarUrl = computed(() => {
  if (avatarLoadError.value) return ''
  return getAvatarUrl(authStore.user)
})

const organizationName = computed(() => {
  return authStore.organization?.name || authStore.user?.organization?.name || 'Workspace'
})

function toggleProfileMenu() {
  profileMenuOpen.value = !profileMenuOpen.value
}

function closeProfileMenu(event: MouseEvent) {
  const target = event.target as HTMLElement | null
  if (!target) return
  if (!target.closest('[data-nav-profile-menu]')) {
    profileMenuOpen.value = false
  }
}

function openProfile() {
  profileMenuOpen.value = false
  router.push('/profile')
}

function handleSignOut() {
  profileMenuOpen.value = false
  authStore.logout()
  router.push('/login')
}

onMounted(() => {
  document.addEventListener('click', closeProfileMenu)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', closeProfileMenu)
})
</script>

<template>
  <div class="relative shrink-0 font-sans" data-nav-profile-menu>
    <!-- Trigger Button -->
    <button
      type="button"
      class="group flex items-center gap-2.5 rounded-lg px-2 py-1 text-left transition-all duration-150 hover:bg-muted/70 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer select-none"
      :aria-expanded="profileMenuOpen"
      @click.stop="toggleProfileMenu"
    >
      <!-- Modern Avatar Frame with Active Indicator -->
      <div class="relative size-8 shrink-0 rounded-full ring-1 ring-border/80 bg-muted overflow-hidden flex items-center justify-center text-foreground">
        <img
          v-if="userAvatarUrl && !avatarLoadError"
          :src="userAvatarUrl"
          :alt="authStore.user?.full_name"
          class="size-full object-cover"
          @error="avatarLoadError = true"
        />
        <span v-else class="text-[11px] font-semibold text-foreground/80">
          {{ authStore.user?.full_name?.slice(0, 2).toUpperCase() || 'U' }}
        </span>
        <!-- Active Dot indicator -->
        <span class="absolute bottom-0 right-0 size-2 rounded-full bg-emerald-500 ring-2 ring-card"></span>
      </div>

      <!-- User Identification Block -->
      <div class="hidden sm:block text-left min-w-0 max-w-[180px]">
        <div class="truncate text-xs font-semibold text-foreground tracking-tight group-hover:text-primary transition-colors">
          {{ authStore.user?.full_name || 'User' }}
        </div>
        <!-- Organization & Role Line -->
        <div class="flex items-center gap-1.5 text-[11px] min-w-0 leading-tight">
          <span
            class="truncate text-primary font-medium"
            :title="organizationName"
          >
            {{ organizationName }}
          </span>
          <span class="text-border shrink-0">/</span>
          <span class="truncate text-muted-foreground text-[10.5px] shrink-0 font-medium">
            {{ authStore.currentRole }}
          </span>
        </div>
      </div>

      <!-- Dropdown Chevron -->
      <ChevronDown
        class="size-3.5 text-muted-foreground/70 transition-transform duration-200 shrink-0 group-hover:text-foreground"
        :class="profileMenuOpen ? 'rotate-180 text-foreground' : ''"
        :stroke-width="1.8"
      />
    </button>

    <!-- Dropdown Popover (Opens Downward) -->
    <Transition name="select-menu">
      <div
        v-if="profileMenuOpen"
        class="absolute top-[calc(100%+0.5rem)] right-0 z-50 w-64 overflow-hidden rounded-xl bg-popover p-1.5 shadow-xl text-popover-foreground border border-border ring-1 ring-black/5 dark:ring-white/10"
      >
        <div class="px-3 py-2.5">
          <p class="text-xs font-semibold text-foreground truncate">{{ authStore.user?.full_name || 'User' }}</p>
          <p class="truncate text-[11px] text-muted-foreground">{{ authStore.user?.email }}</p>
          <div class="mt-2 flex items-center justify-between gap-1.5 text-[11px] text-muted-foreground bg-muted/60 px-2.5 py-1 rounded-lg border border-border/50">
            <div class="flex items-center gap-1.5 min-w-0">
              <Building2 class="size-3 text-primary shrink-0" />
              <span class="truncate font-medium text-foreground/90">{{ organizationName }}</span>
            </div>
            <span class="text-[10px] font-medium text-muted-foreground shrink-0">{{ authStore.currentRole }}</span>
          </div>
        </div>

        <div class="my-1 h-px bg-border/60" />

        <div class="py-0.5">
          <button
            type="button"
            class="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-foreground transition-colors hover:bg-muted cursor-pointer font-medium"
            @click="openProfile"
          >
            <Settings2 class="size-3.5 text-muted-foreground" />
            <span>Account Settings</span>
          </button>
        </div>

        <div class="my-1 h-px bg-border/60" />

        <button
          type="button"
          class="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-destructive transition-colors hover:bg-destructive/10 cursor-pointer font-medium"
          @click="handleSignOut"
        >
          <LogOut class="size-3.5" />
          <span>Sign out</span>
        </button>
      </div>
    </Transition>
  </div>
</template>
