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
    if (res.data) {
      tasks.value = res.data.data || res.data
      if (res.data.pagination) {
        totalTasks.value = res.data.pagination.total
        totalPages.value = res.data.pagination.total_pages
      } else {
        totalTasks.value = tasks.value.length
        totalPages.value = 1
      }
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
  <div class="flex flex-col gap-6 max-w-7xl mx-auto">
    <!-- Top Header -->
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <div class="flex items-center gap-2">
          <Inbox class="size-5 text-primary" />
          <h1 class="text-xl font-bold tracking-tight text-foreground">My Tasks</h1>
        </div>
        <p class="mt-1 text-xs text-muted-foreground">
          Select a task to open the annotation editor and continue your work.
        </p>
      </div>
    </div>

    <!-- Clean Segmented Filter Tabs -->
    <div class="flex items-center gap-1 rounded-2xl bg-card/90 p-1.5 text-xs max-w-fit shadow-sm">
      <button
        type="button"
        class="flex items-center gap-2 rounded-xl px-3.5 py-2 font-semibold transition-all cursor-pointer select-none"
        :class="filter === 'ALL' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'"
        @click="handleFilterChange('ALL')"
      >
        <span>All My Tasks</span>
      </button>

      <button
        type="button"
        class="flex items-center gap-2 rounded-xl px-3.5 py-2 font-semibold transition-all cursor-pointer select-none"
        :class="filter === 'IN_PROGRESS' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'"
        @click="handleFilterChange('IN_PROGRESS')"
      >
        <span>In Progress</span>
      </button>

      <button
        type="button"
        class="flex items-center gap-2 rounded-xl px-3.5 py-2 font-semibold transition-all cursor-pointer select-none"
        :class="filter === 'UNASSIGNED' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'"
        @click="handleFilterChange('UNASSIGNED')"
      >
        <span>Available Queue</span>
      </button>
    </div>

    <!-- Skeleton Loading -->
    <div v-if="isLoading" class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div v-for="n in 6" :key="n" class="h-36 animate-pulse rounded-2xl bg-card/60" />
    </div>

    <!-- Empty State -->
    <div
      v-else-if="tasks.length === 0"
      class="flex flex-col items-center justify-center rounded-3xl bg-card/60 py-16 text-center shadow-sm"
    >
      <div class="flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground mb-3">
        <CheckCircle2 class="size-6 text-primary" />
      </div>
      <h2 class="text-base font-bold text-foreground">No tasks found</h2>
      <p class="mt-1 max-w-xs text-xs text-muted-foreground">
        {{ filter === 'IN_PROGRESS' ? 'You have no active in-progress tasks right now.' : 'No available tasks in this queue.' }}
      </p>
    </div>

    <!-- Task Cards Grid & Pagination -->
    <div v-else class="flex flex-col gap-5">
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <button
          v-for="item in tasks"
          :key="item.id"
          class="group flex flex-col justify-between rounded-2xl bg-card/90 p-5 text-left transition-all hover:shadow-lg hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer shadow-sm"
          @click="openTask(item)"
        >
          <div>
            <!-- Top Row: Icon, Modality, and Status -->
            <div class="flex items-center justify-between gap-2 mb-3">
              <div class="flex items-center gap-2.5">
                <div class="flex size-8 items-center justify-center rounded-xl bg-muted/60 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                  <component :is="modalityIcon(item.modality)" class="size-4" />
                </div>
                <span class="text-xs font-bold text-muted-foreground">{{ item.modality }}</span>
              </div>

              <div class="flex items-center gap-1.5">
                <span
                  v-if="item.draft_saved_at"
                  class="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-foreground"
                >
                  <Save class="size-2.5 text-primary" />Draft
                </span>

                <Badge
                  :variant="isMyInProgress(item) ? 'warning' : 'outline'"
                  class="text-[11px]"
                >
                  {{ isMyInProgress(item) ? 'In Progress' : 'Available' }}
                </Badge>
              </div>
            </div>

            <!-- File Name & ID -->
            <p class="truncate text-sm font-bold text-foreground leading-snug group-hover:text-primary transition-colors">{{ item.file_name }}</p>
            <p class="mt-1 text-[11px] text-muted-foreground font-medium">
              #{{ item.id }}<span v-if="item.external_id"> • {{ item.external_id }}</span>
            </p>
          </div>

          <!-- Card Footer -->
          <div class="flex items-center justify-between mt-4 pt-3 text-[11px] text-muted-foreground">
            <div class="flex items-center gap-1.5 font-medium">
              <Clock class="size-3" />
              <span v-if="item.draft_saved_at">Saved {{ formatDate(item.draft_saved_at) }}</span>
              <span v-else>Created {{ formatDate(item.created_at) }}</span>
            </div>

            <div class="flex items-center gap-1 text-xs font-bold text-primary opacity-0 transition-opacity group-hover:opacity-100">
              <span>{{ isMyInProgress(item) ? 'Continue' : 'Open' }}</span>
              <ArrowRight class="size-3" />
            </div>
          </div>
        </button>
      </div>

      <!-- Pagination Bar -->
      <Card class="bg-card/90 px-5 py-2 shadow-sm">
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
