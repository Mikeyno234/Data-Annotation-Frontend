<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { workflowApi } from '@/api/workflow'
import type { Review } from '@/types'
import { toast } from '@/utils/toast'
import Card from '@/components/ui/Card.vue'
import Input from '@/components/ui/Input.vue'
import Pagination from '@/components/ui/Pagination.vue'
import ReviewCard from '@/components/reviews/ReviewCard.vue'
import ReviewRejectModal from '@/components/reviews/ReviewRejectModal.vue'
import { FileCheck2, Search, RefreshCw } from 'lucide-vue-next'

const router = useRouter()

const reviews = ref<Review[]>([])
const selectedReview = ref<Review | null>(null)
const rejectComment = ref('')
const showRejectModal = ref(false)
const isLoading = ref(true)

const selectedStatusFilter = ref('PENDING')
const searchQuery = ref('')
const currentPage = ref(1)
const pageLimit = ref(10)
const totalReviews = ref(0)
const totalPages = ref(1)

let searchDebounceTimer: any = null

const statusTabs = [
  { id: 'PENDING', label: 'Pending' },
  { id: 'APPROVED', label: 'Approved' },
  { id: 'REJECTED', label: 'Rejected' },
  { id: 'ALL', label: 'All' },
]

async function fetchReviews() {
  isLoading.value = true
  try {
    const res: any = await workflowApi.getReviews({
      page: currentPage.value,
      limit: pageLimit.value,
      status: selectedStatusFilter.value !== 'ALL' ? selectedStatusFilter.value : undefined,
      search: searchQuery.value.trim() || undefined,
    })
    const payload = res?.data?.data || res?.data || res
    reviews.value = Array.isArray(payload) ? payload : []
    const pagination = res?.pagination || res?.data?.pagination
    if (pagination) {
      totalReviews.value = pagination.total ?? reviews.value.length
      totalPages.value = pagination.total_pages ?? 1
    } else {
      totalReviews.value = reviews.value.length
      totalPages.value = 1
    }
  } catch (err: any) {
    toast.error('Failed to load review queue', err?.message)
  } finally {
    isLoading.value = false
  }
}

function handleSearchInput() {
  if (searchDebounceTimer) clearTimeout(searchDebounceTimer)
  searchDebounceTimer = setTimeout(() => {
    currentPage.value = 1
    fetchReviews()
  }, 300)
}

function setStatusFilter(status: string) {
  selectedStatusFilter.value = status
  currentPage.value = 1
  fetchReviews()
}

function handlePageChange(page: number) {
  currentPage.value = page
  fetchReviews()
}

function handleLimitChange(limit: number) {
  pageLimit.value = limit
  currentPage.value = 1
  fetchReviews()
}

async function handleApprove(rev: Review) {
  try {
    await workflowApi.approveReview(rev.annotation_id, 'Approved')
    toast.success('Annotation Approved', `Annotation #${rev.annotation_id} verified`)
    fetchReviews()
  } catch (err: any) {
    toast.error('Approve failed', err?.message)
  }
}

function openRejectModal(rev: Review) {
  selectedReview.value = rev
  rejectComment.value = ''
  showRejectModal.value = true
}

async function handleReject() {
  if (!selectedReview.value || !rejectComment.value) {
    toast.error('Validation Error', 'Feedback comment is required for rejections')
    return
  }

  try {
    await workflowApi.rejectReview(selectedReview.value.annotation_id, rejectComment.value)
    toast.warning('Annotation Rejected', 'Marked for rework by annotator')
    showRejectModal.value = false
    fetchReviews()
  } catch (err: any) {
    toast.error('Reject failed', err?.message)
  }
}

onMounted(() => {
  fetchReviews()
})
</script>

<template>
  <div class="flex flex-col gap-5 max-w-7xl mx-auto">
    <!-- Top Header Section -->
    <div class="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
      <div class="space-y-1">
        <div class="flex items-center gap-2.5">
          <h1 class="text-xl font-semibold tracking-tight text-foreground">Quality Reviews</h1>
          <span
            v-if="totalReviews !== undefined"
            class="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium bg-muted text-muted-foreground border border-border"
          >
            {{ totalReviews }} queued
          </span>
        </div>
        <p class="text-xs text-muted-foreground leading-relaxed max-w-xl">
          Inspect, approve, or request reworks on submitted annotations across datasets.
        </p>
      </div>
    </div>

    <!-- Filter Tabs & Search Bar -->
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <!-- Segmented Tab Controls -->
      <div class="inline-flex p-0.5 rounded-md bg-muted/60 border border-border shadow-2xs self-start sm:self-auto">
        <button
          v-for="tab in statusTabs"
          :key="tab.id"
          type="button"
          class="rounded px-2.5 py-1 text-xs font-medium transition-all cursor-pointer select-none"
          :class="
            selectedStatusFilter === tab.id
              ? 'bg-card text-foreground font-medium shadow-2xs border border-border'
              : 'text-muted-foreground hover:text-foreground border border-transparent'
          "
          @click="setStatusFilter(tab.id)"
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- Search Input -->
      <div class="relative w-full sm:w-72">
        <Search class="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" :stroke-width="1.6" />
        <Input
          :model-value="searchQuery"
          placeholder="Filter by file or comment..."
          class="h-8 pl-8 pr-3 text-xs rounded-md shadow-2xs"
          @input="searchQuery = ($event.target as HTMLInputElement).value; handleSearchInput()"
        />
      </div>
    </div>

    <!-- Review Items List -->
    <div v-if="isLoading" class="flex flex-col items-center justify-center p-16 rounded-lg border border-border bg-card shadow-2xs">
      <RefreshCw class="size-5 animate-spin text-primary mb-2" />
      <span class="text-xs text-muted-foreground font-medium">Loading review queue...</span>
    </div>

    <div v-else-if="reviews.length === 0" class="flex flex-col items-center justify-center p-16 rounded-lg border border-border bg-card text-center shadow-2xs">
      <FileCheck2 class="size-7 text-muted-foreground mb-2" :stroke-width="1.6" />
      <p class="text-xs font-semibold text-foreground">No review items found</p>
      <p class="text-xs text-muted-foreground mt-0.5">There are no annotations matching your current filters.</p>
    </div>

    <div v-else class="flex flex-col gap-4">
      <div class="grid grid-cols-1 gap-4">
        <ReviewCard
          v-for="rev in reviews"
          :key="rev.id"
          :rev="rev"
          @inspect="router.push(`/workspace?task_id=${$event}`)"
          @approve="handleApprove"
          @reject="openRejectModal"
        />
      </div>

      <!-- Pagination Bar -->
      <Card class="px-5 py-2 shadow-2xs border border-border">
        <Pagination
          :page="currentPage"
          :limit="pageLimit"
          :total="totalReviews"
          :total-pages="totalPages"
          :disabled="isLoading"
          @update:page="handlePageChange"
          @update:limit="handleLimitChange"
        />
      </Card>
    </div>

    <!-- Reject Feedback Modal -->
    <ReviewRejectModal
      :open="showRejectModal"
      v-model:comment="rejectComment"
      @close="showRejectModal = false"
      @confirm="handleReject"
    />
  </div>
</template>
