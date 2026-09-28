<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useQuery } from '@tanstack/vue-query'
import { adminApi } from '@/api/admin'
import type { PipelineActivityItem } from '@/types'
import {
  Bell,
  CheckCheck,
  CheckCircle2,
  FileEdit,
  Sparkles,
  AlertCircle,
  FolderKanban,
  Activity,
  Layers,
  X,
  Trash2,
} from 'lucide-vue-next'

const router = useRouter()
const isOpen = ref(false)
const filterMode = ref<'all' | 'unread'>('all')

// Track read and dismissed notification IDs in localStorage
const READ_STORAGE_KEY = 'annot_read_notifications_v1'
const DISMISSED_STORAGE_KEY = 'annot_dismissed_notifications_v1'

const readIds = ref<Set<number>>(new Set())
const dismissedIds = ref<Set<number>>(new Set())

function loadPersistedState() {
  try {
    const rawRead = localStorage.getItem(READ_STORAGE_KEY)
    if (rawRead) {
      const parsed = JSON.parse(rawRead)
      if (Array.isArray(parsed)) readIds.value = new Set(parsed)
    }
    const rawDismissed = localStorage.getItem(DISMISSED_STORAGE_KEY)
    if (rawDismissed) {
      const parsed = JSON.parse(rawDismissed)
      if (Array.isArray(parsed)) dismissedIds.value = new Set(parsed)
    }
  } catch {
    readIds.value = new Set()
    dismissedIds.value = new Set()
  }
}

function persistState() {
  try {
    localStorage.setItem(READ_STORAGE_KEY, JSON.stringify(Array.from(readIds.value)))
    localStorage.setItem(DISMISSED_STORAGE_KEY, JSON.stringify(Array.from(dismissedIds.value)))
  } catch {
    // Ignore storage quota errors
  }
}

const { data: activitiesData, isLoading } = useQuery<PipelineActivityItem[]>({
  queryKey: ['notifications', 'pipeline-activities'],
  queryFn: async () => {
    const res: any = await adminApi.getPipelineActivities({ limit: 12 })
    return res.data?.data || res.data || []
  },
  refetchInterval: 15000,
})

const notifications = computed(() => {
  const list = activitiesData.value || []
  // Filter out any explicitly dismissed items
  return list
    .filter((item) => !dismissedIds.value.has(item.id))
    .map((item) => ({
      ...item,
      isRead: readIds.value.has(item.id),
    }))
})

const unreadCount = computed(() => {
  return notifications.value.filter((n) => !n.isRead).length
})

const totalCount = computed(() => {
  return notifications.value.length
})

const filteredNotifications = computed(() => {
  if (filterMode.value === 'unread') {
    return notifications.value.filter((n) => !n.isRead)
  }
  return notifications.value
})

function toggleDropdown() {
  isOpen.value = !isOpen.value
}

function closeDropdown(event?: MouseEvent) {
  if (event) {
    const target = event.target as HTMLElement | null
    if (target?.closest('[data-notification-menu]')) {
      return
    }
  }
  isOpen.value = false
}

function markAsRead(id: number) {
  readIds.value.add(id)
  persistState()
}

function markAllAsRead() {
  notifications.value.forEach((n) => readIds.value.add(n.id))
  persistState()
}

function dismissNotification(id: number, event?: MouseEvent) {
  event?.stopPropagation()
  dismissedIds.value.add(id)
  persistState()
}

function clearAllNotifications() {
  notifications.value.forEach((n) => dismissedIds.value.add(n.id))
  persistState()
}

function handleNotificationClick(item: PipelineActivityItem & { isRead: boolean }) {
  markAsRead(item.id)
  isOpen.value = false

  if (item.project_id) {
    router.push(`/projects/${item.project_id}`)
  } else {
    router.push('/dashboard')
  }
}

function handleViewAll() {
  isOpen.value = false
  router.push('/dashboard')
}

onMounted(() => {
  loadPersistedState()
  document.addEventListener('click', closeDropdown)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', closeDropdown)
})
</script>

<template>
  <div class="relative shrink-0 font-sans" data-notification-menu>
    <!-- Bell Trigger Button (Berry Rounded Chip) -->
    <button
      type="button"
      class="relative flex size-9 items-center justify-center rounded-xl border border-border/80 bg-muted/30 text-muted-foreground transition-all hover:bg-muted hover:text-foreground cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary shadow-2xs"
      :class="{ 'bg-muted text-foreground border-primary/40 ring-1 ring-primary/20': isOpen }"
      aria-label="View notifications"
      :aria-expanded="isOpen"
      @click.stop="toggleDropdown"
    >
      <Bell class="size-4 text-foreground/80" :stroke-width="1.6" />

      <!-- Unread indicator badge on bell -->
      <span
        v-if="unreadCount > 0"
        class="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground shadow-xs animate-in zoom-in-50 duration-200"
      >
        {{ unreadCount > 9 ? '9+' : unreadCount }}
      </span>
    </button>

    <!-- Facebook / Berry Style Popover Flyout -->
    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="transform scale-95 opacity-0"
      enter-to-class="transform scale-100 opacity-100"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="transform scale-100 opacity-100"
      leave-to-class="transform scale-95 opacity-0"
    >
      <div
        v-if="isOpen"
        class="absolute right-0 top-12 w-80 sm:w-96 rounded-2xl border border-border/90 bg-card shadow-2xl z-50 overflow-hidden flex flex-col animate-in fade-in-50"
      >
        <!-- Flyout Header -->
        <div class="flex items-center justify-between px-4 pt-3.5 pb-2.5 border-b border-border/60">
          <div class="flex items-center gap-2">
            <h3 class="text-sm font-bold text-foreground tracking-tight">
              Notifications
            </h3>
            <span
              v-if="unreadCount > 0"
              class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20 tabular-nums"
            >
              {{ unreadCount }} new
            </span>
          </div>

          <div class="flex items-center gap-2">
            <!-- Mark all read -->
            <button
              v-if="unreadCount > 0"
              type="button"
              class="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:text-primary/80 transition-colors cursor-pointer select-none"
              title="Tandai semua notifikasi sudah dibaca (tetap tersimpan di tab All)"
              @click="markAllAsRead"
            >
              <CheckCheck class="size-3.5" :stroke-width="1.8" />
              <span>Mark all read</span>
            </button>

            <!-- Clear all button if user wants to truly remove them -->
            <button
              v-if="totalCount > 0"
              type="button"
              class="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-destructive transition-colors cursor-pointer select-none"
              title="Bersihkan semua notifikasi dari daftar"
              @click="clearAllNotifications"
            >
              <Trash2 class="size-3.2" :stroke-width="1.8" />
              <span>Clear</span>
            </button>
          </div>
        </div>

        <!-- Filter Tabs: All vs Unread -->
        <div class="flex items-center justify-between px-4 py-2 border-b border-border/40 bg-muted/20">
          <div class="flex items-center gap-1.5">
            <button
              type="button"
              class="px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all cursor-pointer select-none flex items-center gap-1"
              :class="[
                filterMode === 'all'
                  ? 'bg-card text-foreground shadow-2xs border border-border/80'
                  : 'text-muted-foreground hover:text-foreground',
              ]"
              @click="filterMode = 'all'"
            >
              <span>All</span>
              <span class="text-[10px] opacity-75 tabular-nums">({{ totalCount }})</span>
            </button>
            <button
              type="button"
              class="px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all cursor-pointer select-none flex items-center gap-1"
              :class="[
                filterMode === 'unread'
                  ? 'bg-card text-foreground shadow-2xs border border-border/80'
                  : 'text-muted-foreground hover:text-foreground',
              ]"
              @click="filterMode = 'unread'"
            >
              <span>Unread</span>
              <span
                v-if="unreadCount > 0"
                class="px-1.5 py-0.2 rounded-full bg-primary/20 text-primary text-[9px] font-bold tabular-nums"
              >
                {{ unreadCount }}
              </span>
            </button>
          </div>

          <span class="text-[10px] text-muted-foreground select-none">
            {{ filterMode === 'unread' ? 'Filter: Belum Dibaca' : 'Semua Riwayat' }}
          </span>
        </div>

        <!-- Notifications Scrollable Feed -->
        <div class="max-h-84 overflow-y-auto divide-y divide-border/30 overscroll-contain">
          <!-- Loading skeleton -->
          <div v-if="isLoading" class="p-3 space-y-3">
            <div v-for="i in 3" :key="i" class="flex items-start gap-3 animate-pulse p-2">
              <div class="size-9 rounded-full bg-muted shrink-0" />
              <div class="flex-1 space-y-1.5">
                <div class="h-3 w-40 bg-muted rounded" />
                <div class="h-2.5 w-24 bg-muted/60 rounded" />
              </div>
            </div>
          </div>

          <!-- Empty state: Unread tab (All are read) -->
          <div
            v-else-if="filteredNotifications.length === 0 && filterMode === 'unread'"
            class="py-9 px-4 text-center flex flex-col items-center justify-center gap-2"
          >
            <div class="size-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 shadow-2xs">
              <CheckCircle2 class="size-5" :stroke-width="1.8" />
            </div>
            <p class="text-xs font-bold text-foreground">
              Semua sudah dibaca
            </p>
            <p class="text-[11px] text-muted-foreground max-w-[240px] leading-relaxed">
              Tidak ada notifikasi baru. Riwayat aktivitas tetap tersimpan dan dapat dilihat di tab <strong>All</strong>.
            </p>
            <button
              type="button"
              class="mt-1 px-3 py-1 rounded-lg text-xs font-semibold bg-muted/50 hover:bg-muted text-primary border border-border/80 transition-all cursor-pointer"
              @click="filterMode = 'all'"
            >
              Buka Tab "All" ({{ totalCount }}) &rarr;
            </button>
          </div>

          <!-- Empty state: All tab is empty -->
          <div
            v-else-if="filteredNotifications.length === 0"
            class="py-10 px-4 text-center flex flex-col items-center justify-center gap-2"
          >
            <div class="size-10 rounded-full bg-muted/60 flex items-center justify-center text-muted-foreground">
              <CheckCircle2 class="size-5 text-muted-foreground/60" :stroke-width="1.8" />
            </div>
            <p class="text-xs font-semibold text-foreground">
              Belum ada notifikasi
            </p>
            <p class="text-[11px] text-muted-foreground max-w-[220px]">
              Aktivitas pipeline, annotasi, dan review akan otomatis tampil di sini.
            </p>
          </div>

          <!-- Item list (Facebook style) -->
          <div
            v-for="item in filteredNotifications"
            v-else
            :key="item.id"
            class="flex items-start gap-3 p-3 transition-colors cursor-pointer group relative"
            :class="[
              item.isRead ? 'hover:bg-muted/40' : 'bg-primary/5 hover:bg-primary/10',
            ]"
            @click="handleNotificationClick(item)"
          >
            <!-- Avatar with Small Type Badge at bottom-right -->
            <div class="relative shrink-0 mt-0.5">
              <div
                :class="[
                  item.color,
                  'size-9 rounded-full text-white font-bold text-xs flex items-center justify-center shadow-xs',
                ]"
              >
                {{ item.avatar }}
              </div>

              <!-- Mini Action Badge -->
              <span
                class="absolute -bottom-0.5 -right-0.5 size-4 rounded-full bg-card border border-border flex items-center justify-center shadow-2xs"
              >
                <Sparkles v-if="item.type === 'secondary'" class="size-2.5 text-purple-500" />
                <AlertCircle v-else-if="item.type === 'warning'" class="size-2.5 text-amber-500" />
                <CheckCircle2 v-else-if="item.action.includes('QA') || item.action.includes('review')" class="size-2.5 text-blue-500" />
                <FileEdit v-else class="size-2.5 text-emerald-500" />
              </span>
            </div>

            <!-- Content -->
            <div class="min-w-0 flex-1 pr-1">
              <p class="text-xs text-foreground leading-snug">
                <span class="font-bold text-foreground group-hover:text-primary transition-colors">{{ item.name }}</span>
                <span class="text-muted-foreground">&nbsp;{{ item.action }} in&nbsp;</span>
                <span class="font-mono text-[11px] font-semibold text-primary">{{ item.target }}</span>
              </p>

              <div class="flex items-center gap-1.5 mt-1">
                <span class="text-[10px] text-muted-foreground tabular-nums">
                  {{ item.time }}
                </span>
                <span v-if="!item.isRead" class="text-[9px] font-bold text-primary px-1 rounded bg-primary/10">
                  New
                </span>
              </div>
            </div>

            <!-- Right side: Unread Dot & Dismiss Button on Hover -->
            <div class="shrink-0 flex items-center gap-1 self-center">
              <span v-if="!item.isRead" class="size-2 rounded-full bg-primary block" />
              <!-- Single Dismiss Button -->
              <button
                type="button"
                class="opacity-0 group-hover:opacity-100 size-6 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                title="Hapus notifikasi ini"
                @click="dismissNotification(item.id, $event)"
              >
                <X class="size-3.5" :stroke-width="1.8" />
              </button>
            </div>
          </div>
        </div>

        <!-- Flyout Footer -->
        <div class="p-2.5 border-t border-border/60 bg-muted/20 flex items-center justify-between text-xs">
          <button
            type="button"
            class="w-full py-1.5 px-3 rounded-xl text-center text-xs font-semibold text-primary hover:bg-primary/10 transition-colors cursor-pointer select-none flex items-center justify-center gap-1.5"
            @click="handleViewAll"
          >
            <Activity class="size-3.5" :stroke-width="1.8" />
            <span>Open Activity Dashboard</span>
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>
