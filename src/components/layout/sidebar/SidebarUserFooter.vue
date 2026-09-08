<script setup lang="ts">
import { ref, computed, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { getAvatarUrl } from '@/api/auth'
import { Settings2, LogOut, ChevronUp, Building2 } from 'lucide-vue-next'

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
  if (!target.closest('[data-sidebar-profile-menu]')) {
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

document.addEventListener('click', closeProfileMenu)
onBeforeUnmount(() => document.removeEventListener('click', closeProfileMenu))
</script>

<template>
  <div class="relative shrink-0 p-2.5 border-t border-sidebar-border/60 bg-sidebar-accent/10 font-sans" data-sidebar-profile-menu>
    <!-- Popup Menu -->
    <Transition name="sidebar-profile-menu">
      <div
        v-if="profileMenuOpen"
        class="absolute bottom-[calc(100%+0.5rem)] left-3 right-3 z-50 overflow-hidden rounded-2xl bg-popover p-2 shadow-2xl text-popover-foreground border-0 ring-1 ring-black/5 dark:ring-white/10"
      >
        <div class="px-3 py-2.5">
          <p class="text-xs font-semibold text-foreground truncate">{{ authStore.user?.full_name || 'User' }}</p>
          <p class="truncate text-[11px] text-muted-foreground">{{ authStore.user?.email }}</p>
          <div class="mt-1.5 flex items-center gap-1 text-[10px] font-mono text-muted-foreground bg-muted/50 px-2 py-0.5 rounded border border-border/40">
            <Building2 class="size-3 text-primary shrink-0" />
            <span class="truncate font-medium text-foreground/90">{{ organizationName }}</span>
          </div>
        </div>
        <div class="py-1">
          <button
            type="button"
            class="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs text-foreground transition-colors hover:bg-muted/80 cursor-pointer font-medium"
            @click="openProfile"
          >
            <Settings2 class="size-3.5 text-muted-foreground" />
            <span>Account Settings</span>
          </button>
        </div>
        <div class="my-1.5 h-px bg-muted/60" />
        <button
          type="button"
          class="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs text-destructive transition-colors hover:bg-destructive/10 cursor-pointer"
          @click="handleSignOut"
        >
          <LogOut class="size-3.5" />
          <span>Sign out</span>
        </button>
      </div>
    </Transition>

    <!-- Trigger Button -->
    <button
      type="button"
      class="group flex w-full items-center justify-between gap-2.5 rounded-lg px-2 py-1.5 text-left transition-all duration-150 hover:bg-sidebar-accent/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer"
      :aria-expanded="profileMenuOpen"
      @click.stop="toggleProfileMenu"
    >
      <div class="flex items-center gap-2.5 min-w-0 flex-1">
        <!-- Modern Avatar Frame -->
        <div class="relative size-7 shrink-0 rounded-full ring-1 ring-white/10 bg-sidebar-accent overflow-hidden flex items-center justify-center text-sidebar-foreground">
          <img
            v-if="userAvatarUrl && !avatarLoadError"
            :src="userAvatarUrl"
            :alt="authStore.user?.full_name"
            class="size-full object-cover"
            @error="avatarLoadError = true"
          />
          <span v-else class="text-[11px] font-mono font-bold text-sidebar-foreground/80">
            {{ authStore.user?.full_name?.slice(0, 2).toUpperCase() || 'U' }}
          </span>
          <!-- Active Dot indicator -->
          <span class="absolute bottom-0 right-0 size-2 rounded-full bg-emerald-500 ring-1 ring-sidebar"></span>
        </div>

        <div class="min-w-0 flex-1">
          <div class="truncate text-xs font-semibold text-sidebar-foreground/95 tracking-tight group-hover:text-white transition-colors">
            {{ authStore.user?.full_name || 'User' }}
          </div>
          <!-- Organization & Role Line with Hover Reveal -->
          <div class="flex items-center gap-1.5 text-[11px] text-sidebar-muted min-w-0">
            <span
              class="relative inline-flex items-center text-primary/90 font-medium cursor-help transition-colors hover:text-primary"
              :title="organizationName"
            >
              <span class="truncate max-w-[110px] group-hover:max-w-[160px] transition-all duration-200">
                {{ organizationName }}
              </span>
            </span>
            <span class="text-sidebar-border shrink-0">•</span>
            <span class="truncate text-sidebar-muted/80 text-[10.5px] shrink-0 font-medium">
              {{ authStore.currentRole }}
            </span>
          </div>
        </div>
      </div>

      <ChevronUp
        class="size-3 text-sidebar-muted/70 transition-transform duration-200 shrink-0 group-hover:text-sidebar-foreground"
        :class="profileMenuOpen ? 'rotate-180' : ''"
      />
    </button>
  </div>
</template>
