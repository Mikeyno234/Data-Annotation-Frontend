<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { annotationsApi } from '@/api/annotations'
import { useAuthStore } from '@/stores/auth'
import type { DataItem } from '@/types'
import { toast } from '@/utils/toast'
import Badge from '@/components/ui/Badge.vue'
import Pagination from '@/components/ui/Pagination.vue'
import Tabs from '@/components/ui/Tabs.vue'
import {
  Clock,
  FileAudio,
  FileImage,
  FileText,
  FileVideo,
  CheckCircle2,
  Save,
  ArrowRight,
} from 'lucide-vue-next'

const router = useRouter()
const authStore = useAuthStore()

const tasks = ref<DataItem[]>([])
const isLoading = ref(true)
type TaskFilter = 'ALL' | 'IN_PROGRESS' | 'UNASSIGNED' | 'REWORK'
const filter = ref<TaskFilter>('ALL')

const filterTabs: { key: TaskFilter; label: string }[] = [
  { key: 'ALL', label: 'All Tasks' },
  { key: 'IN_PROGRESS', label: 'In Progress' },
  { key: 'UNASSIGNED', label: 'Available Queue' },
  { key: 'REWORK', label: 'Rework' },
]

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

function handleFilterChange(tab: TaskFilter) {
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
  return (item.status === 'IN_PROGRESS' || item.status === 'REWORK') && item.locked_by_id === myId.value
}

function isMyRework(item: DataItem) {
  return item.status === 'REWORK' && item.locked_by_id === myId.value
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
          <Badge variant="secondary" class="tabular-nums">{{ totalTasks }} total</Badge>
        </div>
        <p class="mt-1 text-xs text-muted-foreground">
          Select a task to open the annotation editor and continue your work.
        </p>
      </div>
    </div>

    <!-- Segmented Filter Tabs (Berry Pill Tabs) -->
    <Tabs
      :model-value="filter"
      :items="filterTabs"
      class="self-start"
      @update:model-value="handleFilterChange"
    />

    <!-- Skeleton Loading -->
    <div v-if="isLoading" class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div v-for="n in 6" :key="n" class="h-36 animate-pulse rounded-2xl border border-border/80 bg-card p-5" />
    </div>

    <!-- Empty State -->
    <div
      v-else-if="tasks.length === 0"
      class="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-muted/10 py-16 text-center shadow-xs"
    >
      <div class="flex size-12 items-center justify-center rounded-2xl bg-muted/80 text-muted-foreground mb-3 border border-border">
        <CheckCircle2 class="size-6 text-foreground" :stroke-width="1.6" />
      </div>
      <h2 class="text-sm font-bold text-foreground">No tasks found</h2>
      <p class="mt-1 max-w-xs text-xs text-muted-foreground">
        {{
          filter === 'IN_PROGRESS'
            ? 'You have no active in-progress tasks right now.'
            : filter === 'REWORK'
              ? 'No tasks are currently waiting for rework.'
              : 'No available tasks in this queue.'
        }}
      </p>
    </div>

    <!-- Task Cards Grid & Pagination (Berry Dual-Layer Cards) -->
    <div v-else class="flex flex-col gap-5">
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <button
          v-for="item in tasks"
          :key="item.id"
          class="group relative flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer shadow-xs overflow-hidden before:absolute before:size-32 before:rounded-full before:bg-primary/5 before:-top-10 before:-right-10 before:pointer-events-none before:transition-transform before:duration-300 group-hover:before:scale-125"
          @click="openTask(item)"
        >
          <div class="relative z-10 space-y-3">
            <!-- Top Row: Icon, Modality, and Status -->
            <div class="flex items-center justify-between gap-2">
              <div class="flex items-center gap-2.5">
                <div class="flex size-9 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary shadow-2xs group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-200">
                  <component :is="modalityIcon(item.modality)" class="size-4" :stroke-width="1.8" />
                </div>
                <div class="flex flex-col">
                  <span class="text-xs font-semibold capitalize text-foreground">{{ item.modality.toLowerCase() }}</span>
                  <span class="text-[10px] text-muted-foreground font-mono">#{{ item.id }}</span>
                </div>
              </div>

              <div class="flex items-center gap-1.5">
                <span
                  v-if="item.draft_saved_at"
                  class="flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] font-medium text-foreground"
                >
                  <Save class="size-2.5 text-foreground" :stroke-width="1.6" />Draft
                </span>

                <Badge :variant="isMyInProgress(item) ? 'warning' : 'secondary'" class="rounded-full text-[10px] px-2.5 font-medium">
                  {{ isMyRework(item) ? 'Rework' : isMyInProgress(item) ? 'In Progress' : 'Available' }}
                </Badge>
              </div>
            </div>

            <!-- File Name & ID -->
            <div>
              <p class="truncate text-xs font-bold text-foreground group-hover:text-primary transition-colors">{{ item.file_name }}</p>
              <p v-if="item.external_id" class="mt-0.5 text-[10px] text-muted-foreground font-mono">
                Ext: {{ item.external_id }}
              </p>
            </div>
          </div>

          <!-- Card Footer -->
          <div class="flex items-center justify-between mt-4 pt-3 text-[11px] text-muted-foreground border-t border-border/70 relative z-10">
            <div class="flex items-center gap-1.5 font-medium">
              <Clock class="size-3 text-muted-foreground" :stroke-width="1.6" />
              <span v-if="item.draft_saved_at">Saved {{ formatDate(item.draft_saved_at) }}</span>
              <span v-else>Created {{ formatDate(item.created_at) }}</span>
            </div>

            <div class="flex items-center gap-1 text-xs font-semibold text-primary transition-transform group-hover:translate-x-0.5">
              <span>{{ isMyInProgress(item) ? 'Continue' : 'Open' }}</span>
              <ArrowRight class="size-3.5" :stroke-width="1.8" />
            </div>
          </div>
        </button>
      </div>

      <!-- Pagination Bar (Berry Rounded-2xl Card) -->
      <div class="rounded-2xl border border-border/80 bg-card px-5 py-3 shadow-xs">
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
      </div>
    </div>
  </div>
</template>
