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
  { id: 'PENDING', label: 'Pending Review' },
  { id: 'APPROVED', label: 'Approved' },
  { id: 'REJECTED', label: 'Rejected / Rework' },
  { id: 'ALL', label: 'All Reviews' },
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
    if (res.data) {
      reviews.value = res.data.data || res.data
      if (res.data.pagination) {
        totalReviews.value = res.data.pagination.total
        totalPages.value = res.data.pagination.total_pages
      } else {
        totalReviews.value = reviews.value.length
        totalPages.value = 1
      }
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
    await workflowApi.approveReview(rev.annotation_id, 'Meets enterprise accuracy standards.')
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
  <div class="flex flex-col gap-6 max-w-7xl mx-auto">
    <!-- Top Header -->
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-foreground">Quality Review Queue</h1>
        <p class="text-xs text-muted-foreground mt-1">
          Reviewer inspection workflow, verdict audits, and annotation validation
        </p>
      </div>
    </div>

    <!-- Filter Tabs & Search Bar -->
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div class="flex flex-wrap items-center gap-1.5 rounded-2xl bg-card/90 p-1.5 border border-border/50 shadow-2xs">
        <button
          v-for="tab in statusTabs"
          :key="tab.id"
          type="button"
          class="rounded-xl px-4 py-2 text-xs font-semibold transition-all cursor-pointer select-none"
          :class="
            selectedStatusFilter === tab.id
              ? 'bg-primary text-primary-foreground font-bold shadow-xs'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
          "
          @click="setStatusFilter(tab.id)"
        >
          {{ tab.label }}
        </button>
      </div>

      <div class="relative w-full sm:w-72">
        <Search class="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          v-model="searchQuery"
          placeholder="Search by file or note..."
          class="pl-10 text-xs"
          @input="handleSearchInput"
        />
      </div>
    </div>

    <!-- Review Items List -->
    <div v-if="isLoading" class="flex flex-col items-center justify-center p-16 rounded-2xl border border-border/60 bg-card/60 shadow-sm">
      <RefreshCw class="size-6 animate-spin text-primary mb-2" />
      <span class="text-xs text-muted-foreground font-medium">Loading review queue...</span>
    </div>

    <div v-else-if="reviews.length === 0" class="flex flex-col items-center justify-center p-16 rounded-2xl border border-border/60 bg-card/90 text-center shadow-2xs">
      <FileCheck2 class="size-8 text-muted-foreground mb-2" />
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
      <Card class="bg-card/95 px-5 py-2 shadow-2xs">
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
