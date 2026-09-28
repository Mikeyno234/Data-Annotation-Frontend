<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { getAvatarUrl } from '@/api/auth'
import { Settings2, LogOut, ChevronDown, Building2, User as UserIcon } from 'lucide-vue-next'

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
    <!-- Berry Style Profile Chip Trigger -->
    <button
      type="button"
      class="group flex items-center gap-2 rounded-full border border-border/80 bg-muted/30 p-1 sm:pr-3 text-left transition-all hover:bg-muted/70 hover:border-foreground/20 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary cursor-pointer select-none shadow-2xs"
      :aria-expanded="profileMenuOpen"
      @click.stop="toggleProfileMenu"
    >
      <!-- Rounded-full Avatar -->
      <div class="relative size-7 shrink-0 rounded-full bg-primary/10 text-primary border border-primary/20 overflow-hidden flex items-center justify-center font-bold text-xs">
        <img
          v-if="userAvatarUrl && !avatarLoadError"
          :src="userAvatarUrl"
          :alt="authStore.user?.full_name"
          class="size-full object-cover"
          @error="avatarLoadError = true"
        />
        <span v-else>
          {{ authStore.user?.full_name?.slice(0, 2).toUpperCase() || 'HA' }}
        </span>
      </div>

      <!-- User Name -->
      <div class="hidden sm:block text-left min-w-0 max-w-[120px]">
        <div class="truncate text-xs font-semibold text-foreground tracking-tight group-hover:text-primary transition-colors">
          {{ authStore.user?.full_name || 'Hanif Mulyana' }}
        </div>
      </div>

      <!-- Berry Style Settings Icon & Chevron -->
      <Settings2 class="hidden sm:inline size-3.5 text-muted-foreground group-hover:text-foreground group-hover:rotate-45 transition-all duration-200 shrink-0" :stroke-width="1.6" />
      <ChevronDown
        class="size-3 text-muted-foreground transition-transform duration-200 shrink-0"
        :class="profileMenuOpen ? 'rotate-180 text-foreground' : ''"
        :stroke-width="2"
      />
    </button>

    <!-- Berry Style Dropdown Popover Card -->
    <Transition name="select-menu">
      <div
        v-if="profileMenuOpen"
        class="absolute top-[calc(100%+0.5rem)] right-0 z-50 w-72 overflow-hidden rounded-2xl bg-card p-2 shadow-xl text-card-foreground border border-border ring-1 ring-black/5 dark:ring-white/10"
      >
        <!-- Header -->
        <div class="p-3 bg-muted/40 rounded-xl border border-border/50">
          <div class="flex items-center gap-2.5">
            <div class="size-9 rounded-full bg-primary/15 text-primary border border-primary/25 flex items-center justify-center font-bold text-sm shrink-0">
              {{ authStore.user?.full_name?.slice(0, 2).toUpperCase() || 'HA' }}
            </div>
            <div class="min-w-0 flex-1">
              <p class="text-xs font-bold text-foreground truncate">{{ authStore.user?.full_name || 'Hanif Mulyana' }}</p>
              <p class="truncate text-[11px] text-muted-foreground">{{ authStore.user?.email || 'mulyanaputrahanif@gmail.com' }}</p>
            </div>
          </div>

          <div class="mt-2.5 flex items-center justify-between text-[11px] bg-background/80 px-2.5 py-1 rounded-lg border border-border/60">
            <span class="truncate font-medium text-foreground/80 flex items-center gap-1">
              <Building2 class="size-3 text-primary shrink-0" />
              {{ organizationName }}
            </span>
            <span class="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20 shrink-0">
              {{ authStore.currentRole }}
            </span>
          </div>
        </div>

        <div class="my-1.5 h-px bg-border/60" />

        <div class="space-y-0.5">
          <button
            type="button"
            class="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs text-foreground transition-colors hover:bg-muted cursor-pointer font-medium"
            @click="openProfile"
          >
            <UserIcon class="size-3.5 text-muted-foreground" />
            <span>Account Profile</span>
          </button>

          <button
            type="button"
            class="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs text-foreground transition-colors hover:bg-muted cursor-pointer font-medium"
            @click="openProfile"
          >
            <Settings2 class="size-3.5 text-muted-foreground" />
            <span>Preferences & Settings</span>
          </button>
        </div>

        <div class="my-1.5 h-px bg-border/60" />

        <button
          type="button"
          class="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs text-destructive transition-colors hover:bg-destructive/10 cursor-pointer font-semibold"
          @click="handleSignOut"
        >
          <LogOut class="size-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </Transition>
  </div>
</template>
