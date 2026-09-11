<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { annotationsApi } from '@/api/annotations'
import { useAuthStore } from '@/stores/auth'
import type { DataItem } from '@/types'
import { toast } from '@/utils/toast'
import Button from '@/components/ui/Button.vue'
import Badge from '@/components/ui/Badge.vue'
import Card from '@/components/ui/Card.vue'
import CardContent from '@/components/ui/CardContent.vue'
import Pagination from '@/components/ui/Pagination.vue'
import {
  Clock,
  FileAudio,
  FileImage,
  FileText,
  FileVideo,
  CheckCircle2,
  RefreshCw,
  Save,
  ArrowRight,
  Inbox,
} from 'lucide-vue-next'

const router = useRouter()
const authStore = useAuthStore()

const tasks = ref<DataItem[]>([])
const isLoading = ref(true)
const filter = ref<'ALL' | 'IN_PROGRESS' | 'UNASSIGNED'>('ALL')

const currentPage = ref(1)
const pageLimit = ref(12)
const totalTasks = ref(0)
const totalPages = ref(1)

const myId = computed(() => authStore.user?.id)

async function fetchMyTasks() {
  isLoading.value = true
  try {
    const res: any = await annotationsApi.getDataItems({
      page: currentPage.value,
      limit: pageLimit.value,
      my_tasks: true,
      status: filter.value !== 'ALL' ? filter.value : undefined,
    })
    const payload = res?.data?.data || res?.data || res
    tasks.value = Array.isArray(payload) ? payload : []
    const pagination = res?.pagination || res?.data?.pagination
    if (pagination) {
      totalTasks.value = pagination.total ?? tasks.value.length
      totalPages.value = pagination.total_pages ?? 1
    } else {
      totalTasks.value = tasks.value.length
      totalPages.value = 1
    }
  } catch (err: any) {
    toast.error('Failed to load tasks', err?.message)
  } finally {
    isLoading.value = false
  }
}

function handleFilterChange(tab: 'ALL' | 'IN_PROGRESS' | 'UNASSIGNED') {
  filter.value = tab
  currentPage.value = 1
  fetchMyTasks()
}

function handlePageChange(page: number) {
  currentPage.value = page
  fetchMyTasks()
}

function handleLimitChange(limit: number) {
  pageLimit.value = limit
  currentPage.value = 1
  fetchMyTasks()
}

function openTask(item: DataItem) {
  router.push({ path: '/workspace', query: { task_id: item.id } })
}

function modalityIcon(modality: string) {
  switch (modality) {
    case 'AUDIO': return FileAudio
    case 'IMAGE': return FileImage
    case 'VIDEO': return FileVideo
    default: return FileText
  }
}

function isMyInProgress(item: DataItem) {
  return item.status === 'IN_PROGRESS' && item.locked_by_id === myId.value
}

function formatDate(dateStr?: string) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
}

onMounted(fetchMyTasks)
</script>

<template>
  <div class="flex flex-col gap-5 max-w-7xl mx-auto">
    <!-- Top Header -->
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <div class="flex items-center gap-2">
          <h1 class="text-xl font-semibold tracking-tight text-foreground">My Tasks</h1>
          <span class="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium bg-muted text-muted-foreground border border-border">
            {{ totalTasks }} total
          </span>
        </div>
        <p class="mt-1 text-xs text-muted-foreground">
          Select a task to open the annotation editor and continue your work.
        </p>
      </div>
    </div>

    <!-- Clean Segmented Filter Tabs -->
    <div class="inline-flex p-0.5 rounded-md bg-muted/60 border border-border shadow-2xs self-start">
      <button
        type="button"
        class="rounded px-2.5 py-1 text-xs font-medium transition-all cursor-pointer select-none"
        :class="filter === 'ALL' ? 'bg-card text-foreground font-medium shadow-2xs border border-border' : 'text-muted-foreground hover:text-foreground border border-transparent'"
        @click="handleFilterChange('ALL')"
      >
        <span>All Tasks</span>
      </button>

      <button
        type="button"
        class="rounded px-2.5 py-1 text-xs font-medium transition-all cursor-pointer select-none"
        :class="filter === 'IN_PROGRESS' ? 'bg-card text-foreground font-medium shadow-2xs border border-border' : 'text-muted-foreground hover:text-foreground border border-transparent'"
        @click="handleFilterChange('IN_PROGRESS')"
      >
        <span>In Progress</span>
      </button>

      <button
        type="button"
        class="rounded px-2.5 py-1 text-xs font-medium transition-all cursor-pointer select-none"
        :class="filter === 'UNASSIGNED' ? 'bg-card text-foreground font-medium shadow-2xs border border-border' : 'text-muted-foreground hover:text-foreground border border-transparent'"
        @click="handleFilterChange('UNASSIGNED')"
      >
        <span>Available Queue</span>
      </button>
    </div>

    <!-- Skeleton Loading -->
    <div v-if="isLoading" class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <div v-for="n in 6" :key="n" class="h-32 animate-pulse rounded-lg border border-border bg-card" />
    </div>

    <!-- Empty State -->
    <div
      v-else-if="tasks.length === 0"
      class="flex flex-col items-center justify-center rounded-lg border border-border bg-card py-16 text-center shadow-2xs"
    >
      <div class="flex size-10 items-center justify-center rounded-md bg-muted text-muted-foreground mb-2 border border-border">
        <CheckCircle2 class="size-5 text-foreground" :stroke-width="1.6" />
      </div>
      <h2 class="text-sm font-semibold text-foreground">No tasks found</h2>
      <p class="mt-1 max-w-xs text-xs text-muted-foreground">
        {{ filter === 'IN_PROGRESS' ? 'You have no active in-progress tasks right now.' : 'No available tasks in this queue.' }}
      </p>
    </div>

    <!-- Task Cards Grid & Pagination -->
    <div v-else class="flex flex-col gap-4">
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <button
          v-for="item in tasks"
          :key="item.id"
          class="group flex flex-col justify-between rounded-lg border border-border bg-card p-4 text-left transition-all hover:border-foreground/30 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-foreground/20 cursor-pointer shadow-2xs"
          @click="openTask(item)"
        >
          <div>
            <!-- Top Row: Icon, Modality, and Status -->
            <div class="flex items-center justify-between gap-2 mb-2.5">
              <div class="flex items-center gap-2">
                <div class="flex size-6 items-center justify-center rounded border border-border bg-muted text-foreground">
                  <component :is="modalityIcon(item.modality)" class="size-3.5" :stroke-width="1.6" />
                </div>
                <span class="text-xs font-medium capitalize text-muted-foreground">{{ item.modality.toLowerCase() }}</span>
              </div>

              <div class="flex items-center gap-1.5">
                <span
                  v-if="item.draft_saved_at"
                  class="flex items-center gap-1 rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-foreground"
                >
                  <Save class="size-2.5 text-foreground" :stroke-width="1.6" />Draft
                </span>

                <Badge
                  :variant="isMyInProgress(item) ? 'warning' : 'secondary'"
                >
                  {{ isMyInProgress(item) ? 'In Progress' : 'Available' }}
                </Badge>
              </div>
            </div>

            <!-- File Name & ID -->
            <p class="truncate text-xs font-semibold text-foreground group-hover:text-primary transition-colors">{{ item.file_name }}</p>
            <p class="mt-0.5 text-[11px] text-muted-foreground font-mono">
              #{{ item.id }}<span v-if="item.external_id"> • {{ item.external_id }}</span>
            </p>
          </div>

          <!-- Card Footer -->
          <div class="flex items-center justify-between mt-4 pt-3 text-[11px] text-muted-foreground border-t border-border/50">
            <div class="flex items-center gap-1.5 font-medium">
              <Clock class="size-3" :stroke-width="1.6" />
              <span v-if="item.draft_saved_at">Saved {{ formatDate(item.draft_saved_at) }}</span>
              <span v-else>Created {{ formatDate(item.created_at) }}</span>
            </div>

            <div class="flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
              <span>{{ isMyInProgress(item) ? 'Continue' : 'Open' }}</span>
              <ArrowRight class="size-3" :stroke-width="1.6" />
            </div>
          </div>
        </button>
      </div>

      <!-- Pagination Bar -->
      <Card class="px-5 py-2 shadow-2xs border border-border">
        <Pagination
          :page="currentPage"
          :limit="pageLimit"
          :total="totalTasks"
          :total-pages="totalPages"
          :page-size-options="[6, 12, 24, 48]"
          :disabled="isLoading"
          @update:page="handlePageChange"
          @update:limit="handleLimitChange"
        />
      </Card>
    </div>
  </div>
</template>
