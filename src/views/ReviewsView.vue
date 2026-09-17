<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { workflowApi } from '@/api/workflow'
import { useAuthStore } from '@/stores/auth'
import type { Review, ReviewProjectSummary } from '@/types'
import { toast } from '@/utils/toast'
import Card from '@/components/ui/Card.vue'
import Input from '@/components/ui/Input.vue'
import Button from '@/components/ui/Button.vue'
import Modal from '@/components/ui/Modal.vue'
import Pagination from '@/components/ui/Pagination.vue'
import ReviewCard from '@/components/reviews/ReviewCard.vue'
import ProjectReviewCard from '@/components/reviews/ProjectReviewCard.vue'
import ReviewRejectModal from '@/components/reviews/ReviewRejectModal.vue'
import QAView from '@/views/QAView.vue'
import {
  FileCheck2,
  Search,
  RefreshCw,
  FolderKanban,
  ListFilter,
  ArrowLeft,
  CheckCheck,
  X,
  SlidersHorizontal,
  Clock,
  CheckCircle2,
  Sparkles,
  Layers,
  Cpu,
} from 'lucide-vue-next'
import { getModalityConfig } from '@/utils/design'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const canApprove = computed(() => authStore.hasPermission('review.approve'))
const canReject = computed(() => authStore.hasPermission('review.reject'))

// View Modes: 'PROJECTS' | 'ITEMS'
const viewMode = ref<'PROJECTS' | 'ITEMS'>('PROJECTS')

// Projects State
const projects = ref<ReviewProjectSummary[]>([])
const isLoadingProjects = ref(true)
const projectSearchQuery = ref('')
const projectStatusFilter = ref<'ALL' | 'PENDING' | 'COMPLETED'>('ALL')
let projectSearchDebounceTimer: any = null

// Selected Project (when drilling down into a project review queue)
const selectedProject = ref<ReviewProjectSummary | null>(null)
const selectedProjectId = computed<number | undefined>(() => {
  const q = route.query.project_id
  if (q) {
    const parsed = Number(q)
    return isNaN(parsed) ? undefined : parsed
  }
  return selectedProject.value?.project_id
})

// Reviews Queue State
const reviews = ref<Review[]>([])
const isLoadingReviews = ref(false)
const selectedStatusFilter = ref('PENDING')
const searchQuery = ref('')
const currentPage = ref(1)
const pageLimit = ref(10)
const totalReviews = ref(0)
const totalPages = ref(1)
let searchDebounceTimer: any = null

// Multi-Selection State for Batch Actions
const selectedAnnotationIds = ref<Set<number>>(new Set())

// Reject Modal State
const showRejectModal = ref(false)
const rejectComment = ref('')
const rejectTarget = ref<
  | { mode: 'SINGLE'; review: Review }
  | { mode: 'BATCH_SELECTED' }
  | null
>(null)

// Project Batch Approve Confirmation Modal
const showProjectApproveModal = ref(false)
const projectToApprove = ref<ReviewProjectSummary | null>(null)
const projectApproveComment = ref('Batch approved all pending annotations')
const isSubmittingBatch = ref(false)

const statusTabs = [
  { id: 'PENDING', label: 'Pending' },
  { id: 'APPROVED', label: 'Approved' },
  { id: 'REJECTED', label: 'Rejected' },
  { id: 'ALL', label: 'All' },
]

// Aggregate Metrics across projects
const totalPendingReviews = computed(() =>
  projects.value.reduce((acc, p) => acc + (p.pending_count || 0), 0)
)
const totalApprovedReviews = computed(() =>
  projects.value.reduce((acc, p) => acc + (p.approved_count || 0), 0)
)
const totalRejectedReviews = computed(() =>
  projects.value.reduce((acc, p) => acc + (p.rejected_count || 0), 0)
)
const activeProjectsCount = computed(() =>
  projects.value.filter((p) => p.pending_count > 0).length
)

// Filtered Projects
const filteredProjects = computed(() => {
  let list = projects.value
  if (projectStatusFilter.value === 'PENDING') {
    list = list.filter((p) => p.pending_count > 0)
  } else if (projectStatusFilter.value === 'COMPLETED') {
    list = list.filter((p) => p.pending_count === 0 && p.total_reviews > 0)
  }
  return list
})

// --- DATA FETCHING ---

async function fetchProjects() {
  isLoadingProjects.value = true
  try {
    const res = await workflowApi.getReviewProjects({
      search: projectSearchQuery.value.trim() || undefined,
    })
    const payload = res.data?.data || res.data
    projects.value = Array.isArray(payload) ? payload : []

    // If route has project_id, sync selectedProject
    if (selectedProjectId.value) {
      const found = projects.value.find((p) => p.project_id === selectedProjectId.value)
      if (found) {
        selectedProject.value = found
      }
    }
  } catch (err: any) {
    toast.error('Failed to load review projects', err?.message)
  } finally {
    isLoadingProjects.value = false
  }
}

async function fetchReviews() {
  isLoadingReviews.value = true
  try {
    const res: any = await workflowApi.getReviews({
      page: currentPage.value,
      limit: pageLimit.value,
      status: selectedStatusFilter.value !== 'ALL' ? selectedStatusFilter.value : undefined,
      search: searchQuery.value.trim() || undefined,
      project_id: selectedProjectId.value,
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
    isLoadingReviews.value = false
  }
}

// --- PROJECT LEVEL NAVIGATION ---

function openProjectQueue(proj: ReviewProjectSummary) {
  selectedProject.value = proj
  selectedAnnotationIds.value.clear()
  currentPage.value = 1
  selectedStatusFilter.value = 'PENDING'
  router.push({ query: { ...route.query, project_id: String(proj.project_id) } })
  fetchReviews()
}

function backToProjects() {
  selectedProject.value = null
  selectedAnnotationIds.value.clear()
  const q = { ...route.query }
  delete q.project_id
  router.push({ query: q })
  fetchProjects()
}

function handleProjectSearchInput() {
  if (projectSearchDebounceTimer) clearTimeout(projectSearchDebounceTimer)
  projectSearchDebounceTimer = setTimeout(() => {
    fetchProjects()
  }, 300)
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
  selectedAnnotationIds.value.clear()
  currentPage.value = 1
  fetchReviews()
}

function handlePageChange(page: number) {
  currentPage.value = page
  selectedAnnotationIds.value.clear()
  fetchReviews()
}

function handleLimitChange(limit: number) {
  pageLimit.value = limit
  currentPage.value = 1
  selectedAnnotationIds.value.clear()
  fetchReviews()
}

// --- SELECTION & BATCH ACTIONS ---

const isAllCurrentPageSelected = computed(() => {
  if (reviews.value.length === 0) return false
  return reviews.value.every((r) => selectedAnnotationIds.value.has(r.annotation_id))
})

function toggleSelectAllCurrentPage() {
  if (isAllCurrentPageSelected.value) {
    reviews.value.forEach((r) => selectedAnnotationIds.value.delete(r.annotation_id))
  } else {
    reviews.value.forEach((r) => selectedAnnotationIds.value.add(r.annotation_id))
  }
}

function toggleItemSelection(annotationId: number) {
  if (selectedAnnotationIds.value.has(annotationId)) {
    selectedAnnotationIds.value.delete(annotationId)
  } else {
    selectedAnnotationIds.value.add(annotationId)
  }
}

// Top-Level Reviews vs QA Tab
const activeTab = ref<'reviews' | 'qa'>(route.query.tab === 'qa' ? 'qa' : 'reviews')
watch(() => route.query.tab, (tab) => {
  if (tab === 'qa') {
    activeTab.value = 'qa'
  } else {
    activeTab.value = 'reviews'
  }
})
function switchTab(tab: 'reviews' | 'qa') {
  activeTab.value = tab
  router.replace({ query: { ...route.query, tab: tab === 'qa' ? 'qa' : undefined } })
}

// In-Place Edit & Approve Modal State
const showEditApproveModal = ref(false)
const editApproveReview = ref<Review | null>(null)
const editApprovePayloadString = ref('')
const editApproveComment = ref('Directly verified and corrected in-place')
const isSubmittingEditApprove = ref(false)

function openEditApproveModal(rev: Review) {
  editApproveReview.value = rev
  editApprovePayloadString.value = JSON.stringify(rev.annotation?.payload || {}, null, 2)
  editApproveComment.value = 'Directly verified and corrected in-place'
  showEditApproveModal.value = true
}

async function handleConfirmEditApprove() {
  if (!editApproveReview.value) return
  let parsedPayload: any
  try {
    parsedPayload = JSON.parse(editApprovePayloadString.value)
  } catch (err: any) {
    toast.error('Invalid JSON Payload', 'Please correct JSON syntax before approving.')
    return
  }

  isSubmittingEditApprove.value = true
  try {
    await workflowApi.approveReview(
      editApproveReview.value.annotation_id,
      editApproveComment.value,
      parsedPayload
    )
    toast.success('Annotation Fixed & Approved', `Annotation #${editApproveReview.value.annotation_id} updated and approved`)
    showEditApproveModal.value = false
    selectedAnnotationIds.value.delete(editApproveReview.value.annotation_id)
    fetchReviews()
    fetchProjects()
  } catch (err: any) {
    toast.error('Fix & Approve Failed', err?.message)
  } finally {
    isSubmittingEditApprove.value = false
  }
}

// --- SINGLE APPROVE & REJECT ---

async function handleApproveSingle(rev: Review) {
  try {
    await workflowApi.approveReview(rev.annotation_id, 'Approved')
    toast.success('Annotation Approved', `Annotation #${rev.annotation_id} verified`)
    selectedAnnotationIds.value.delete(rev.annotation_id)
    fetchReviews()
    fetchProjects()
  } catch (err: any) {
    toast.error('Approve failed', err?.message)
  }
}

function openSingleRejectModal(rev: Review) {
  rejectTarget.value = { mode: 'SINGLE', review: rev }
  rejectComment.value = ''
  showRejectModal.value = true
}


// --- BATCH APPROVE & REJECT ---

async function handleBatchApproveSelected() {
  const ids = Array.from(selectedAnnotationIds.value)
  if (ids.length === 0) return

  isSubmittingBatch.value = true
  try {
    const res = await workflowApi.batchApproveReviews({
      annotation_ids: ids,
      comment: 'Batch approved annotations',
    })
    const count = res.data?.data?.approved_count ?? ids.length
    toast.success('Batch Approved', `Successfully approved ${count} annotations`)
    selectedAnnotationIds.value.clear()
    fetchReviews()
    fetchProjects()
  } catch (err: any) {
    toast.error('Batch Approve Failed', err?.message)
  } finally {
    isSubmittingBatch.value = false
  }
}

function openBatchRejectModal() {
  if (selectedAnnotationIds.value.size === 0) return
  rejectTarget.value = { mode: 'BATCH_SELECTED' }
  rejectComment.value = ''
  showRejectModal.value = true
}

function promptApproveAllProject(proj: ReviewProjectSummary) {
  projectToApprove.value = proj
  projectApproveComment.value = `Approved all ${proj.pending_count} pending annotations for project: ${proj.project_name}`
  showProjectApproveModal.value = true
}

async function confirmApproveAllProject() {
  if (!projectToApprove.value) return

  isSubmittingBatch.value = true
  try {
    const res = await workflowApi.batchApproveReviews({
      project_id: projectToApprove.value.project_id,
      comment: projectApproveComment.value,
    })
    const count = res.data?.data?.approved_count ?? projectToApprove.value.pending_count
    toast.success(
      'Project Approved',
      `Approved ${count} pending annotations in ${projectToApprove.value.project_name}`
    )
    showProjectApproveModal.value = false
    projectToApprove.value = null
    selectedAnnotationIds.value.clear()
    fetchReviews()
    fetchProjects()
  } catch (err: any) {
    toast.error('Batch Approval Failed', err?.message)
  } finally {
    isSubmittingBatch.value = false
  }
}

async function handleRejectConfirm() {
  if (!rejectComment.value.trim()) {
    toast.error('Validation Error', 'Feedback comment is required for rejections')
    return
  }

  if (!rejectTarget.value) return

  try {
    if (rejectTarget.value.mode === 'SINGLE') {
      const rev = rejectTarget.value.review
      await workflowApi.rejectReview(rev.annotation_id, rejectComment.value)
      toast.warning('Annotation Rejected', 'Returned to annotator for rework')
      selectedAnnotationIds.value.delete(rev.annotation_id)
    } else if (rejectTarget.value.mode === 'BATCH_SELECTED') {
      const ids = Array.from(selectedAnnotationIds.value)
      const res = await workflowApi.batchRejectReviews({
        annotation_ids: ids,
        comment: rejectComment.value,
      })
      const count = res.data?.data?.rejected_count ?? ids.length
      toast.warning('Batch Rejected', `${count} annotations returned for rework`)
      selectedAnnotationIds.value.clear()
    }

    showRejectModal.value = false
    rejectTarget.value = null
    fetchReviews()
    fetchProjects()
  } catch (err: any) {
    toast.error('Reject Failed', err?.message)
  }
}

// Watch query param changes to support browser Back/Forward
watch(
  () => route.query.project_id,
  (newId) => {
    if (newId) {
      const idNum = Number(newId)
      if (!isNaN(idNum)) {
        const found = projects.value.find((p) => p.project_id === idNum)
        if (found) selectedProject.value = found
        fetchReviews()
      }
    } else {
      selectedProject.value = null
      if (viewMode.value === 'ITEMS') {
        fetchReviews()
      }
    }
  }
)

onMounted(async () => {
  await fetchProjects()
  if (selectedProjectId.value || viewMode.value === 'ITEMS') {
    await fetchReviews()
  }
})
</script>

<template>
  <div class="flex flex-col gap-6 max-w-7xl mx-auto pb-12">
    <!-- Master Unified Navigation: Review Queue vs QA Inspection -->
    <div class="flex items-center gap-1.5 border-b border-border/80 pb-3">
      <button
        type="button"
        class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer select-none"
        :class="
          activeTab === 'reviews'
            ? 'bg-foreground text-background shadow-2xs font-semibold'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
        "
        @click="switchTab('reviews')"
      >
        <FileCheck2 class="size-3.5" :stroke-width="1.6" />
        <span>Review Queue</span>
        <span
          v-if="totalPendingReviews > 0"
          class="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-amber-500/15 text-amber-600 dark:text-amber-400 font-semibold tabular-nums"
        >
          {{ totalPendingReviews }}
        </span>
      </button>

      <button
        type="button"
        class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer select-none"
        :class="
          activeTab === 'qa'
            ? 'bg-foreground text-background shadow-2xs font-semibold'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
        "
        @click="switchTab('qa')"
      >
        <CheckCircle2 class="size-3.5" :stroke-width="1.6" />
        <span>QA Inspection & Consensus</span>
      </button>
    </div>

    <!-- Render QA Inspection View if activeTab === 'qa' -->
    <div v-if="activeTab === 'qa'">
      <QAView />
    </div>

    <!-- Otherwise render Review Queue -->
    <div v-else class="flex flex-col gap-6">
      <!-- Top Header & Breadcrumb -->
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div class="space-y-1">
        <!-- Back button if in Project View -->
        <button
          v-if="selectedProject"
          type="button"
          class="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground mb-1 cursor-pointer transition-colors"
          @click="backToProjects"
        >
          <ArrowLeft class="size-3.5" :stroke-width="1.6" />
          <span>Back to All Projects</span>
        </button>

        <div class="flex items-center gap-2.5 flex-wrap">
          <h1 class="text-xl font-semibold tracking-tight text-foreground">
            {{ selectedProject ? selectedProject.project_name : 'Quality Reviews' }}
          </h1>

          <!-- Badges for selected project -->
          <template v-if="selectedProject">
            <span
              class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border"
              :class="getModalityConfig(selectedProject.modality).badgeClass"
            >
              <component :is="getModalityConfig(selectedProject.modality).icon" class="size-3" :stroke-width="1.75" />
              <span>{{ getModalityConfig(selectedProject.modality).shortLabel }}</span>
            </span>
            <span
              v-if="selectedProject.pending_count > 0"
              class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25"
            >
              <Clock class="size-3" :stroke-width="1.6" />
              {{ selectedProject.pending_count }} pending
            </span>
          </template>

          <span
            v-else-if="!isLoadingProjects"
            class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-muted text-muted-foreground border border-border"
          >
            {{ totalPendingReviews }} pending across {{ projects.length }} projects
          </span>
        </div>

        <p class="text-xs text-muted-foreground leading-relaxed max-w-2xl">
          <template v-if="selectedProject">
            Review submitted annotations for this project. Approve verified data or reject with feedback for annotator rework.
          </template>
          <template v-else>
            Manage and execute review workflows organized per-project. Approve items in bulk or drill down into specific queues.
          </template>
        </p>
      </div>

      <!-- Right Top Actions: Mode Switcher (only when not drilled into a project) -->
      <div v-if="!selectedProject" class="inline-flex p-0.5 rounded-lg bg-muted/60 border border-border shadow-2xs self-start sm:self-auto shrink-0">
        <button
          type="button"
          class="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all cursor-pointer select-none"
          :class="
            viewMode === 'PROJECTS'
              ? 'bg-foreground text-background font-medium shadow-2xs'
              : 'text-muted-foreground hover:text-foreground'
          "
          @click="viewMode = 'PROJECTS'"
        >
          <FolderKanban class="size-3.5" :stroke-width="1.6" />
          <span>By Project</span>
        </button>
        <button
          type="button"
          class="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all cursor-pointer select-none"
          :class="
            viewMode === 'ITEMS'
              ? 'bg-foreground text-background font-medium shadow-2xs'
              : 'text-muted-foreground hover:text-foreground'
          "
          @click="viewMode = 'ITEMS'; fetchReviews()"
        >
          <ListFilter class="size-3.5" :stroke-width="1.6" />
          <span>All Items</span>
        </button>
      </div>
    </div>

    <template v-if="!selectedProject && viewMode === 'PROJECTS'">
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div class="p-3.5 rounded-lg border border-border bg-card shadow-2xs">
          <div class="flex items-center justify-between text-xs text-muted-foreground">
            <span>Projects Needing Review</span>
            <FolderKanban class="size-4 text-muted-foreground" :stroke-width="1.6" />
          </div>
          <div class="mt-2 flex items-baseline gap-2">
            <span class="text-2xl font-semibold tracking-tight text-foreground tabular-nums">
              {{ activeProjectsCount }}
            </span>
            <span class="text-[11px] text-muted-foreground">of {{ projects.length }} active</span>
          </div>
        </div>

        <div class="p-3.5 rounded-lg border border-border bg-card shadow-2xs">
          <div class="flex items-center justify-between text-xs text-muted-foreground">
            <span>Total Pending Reviews</span>
            <Clock class="size-4 text-amber-500" :stroke-width="1.6" />
          </div>
          <div class="mt-2 flex items-baseline gap-2">
            <span class="text-2xl font-semibold tracking-tight text-amber-600 dark:text-amber-400 tabular-nums">
              {{ totalPendingReviews }}
            </span>
            <span class="text-[11px] text-muted-foreground">awaiting reviewer</span>
          </div>
        </div>

        <div class="p-3.5 rounded-lg border border-border bg-card shadow-2xs">
          <div class="flex items-center justify-between text-xs text-muted-foreground">
            <span>Approved Annotations</span>
            <CheckCircle2 class="size-4 text-emerald-500" :stroke-width="1.6" />
          </div>
          <div class="mt-2 flex items-baseline gap-2">
            <span class="text-2xl font-semibold tracking-tight text-emerald-600 dark:text-emerald-400 tabular-nums">
              {{ totalApprovedReviews }}
            </span>
            <span class="text-[11px] text-muted-foreground">passed checks</span>
          </div>
        </div>

        <div class="p-3.5 rounded-lg border border-border bg-card shadow-2xs">
          <div class="flex items-center justify-between text-xs text-muted-foreground">
            <span>Rework / Rejected</span>
            <XCircle class="size-4 text-destructive" :stroke-width="1.6" />
          </div>
          <div class="mt-2 flex items-baseline gap-2">
            <span class="text-2xl font-semibold tracking-tight text-destructive tabular-nums">
              {{ totalRejectedReviews }}
            </span>
            <span class="text-[11px] text-muted-foreground">returned to queue</span>
          </div>
        </div>
      </div>

      <!-- Project Search & Filter Controls -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <!-- Status Filter Pills -->
        <div class="inline-flex p-0.5 rounded-md bg-muted/60 border border-border shadow-2xs self-start sm:self-auto">
          <button
            type="button"
            class="rounded px-2.5 py-1 text-xs font-medium transition-all cursor-pointer select-none"
            :class="
              projectStatusFilter === 'ALL'
                ? 'bg-foreground text-background font-medium shadow-2xs'
                : 'text-muted-foreground hover:text-foreground'
            "
            @click="projectStatusFilter = 'ALL'"
          >
            All Projects ({{ projects.length }})
          </button>
          <button
            type="button"
            class="rounded px-2.5 py-1 text-xs font-medium transition-all cursor-pointer select-none"
            :class="
              projectStatusFilter === 'PENDING'
                ? 'bg-foreground text-background font-medium shadow-2xs'
                : 'text-muted-foreground hover:text-foreground'
            "
            @click="projectStatusFilter = 'PENDING'"
          >
            Needs Review ({{ activeProjectsCount }})
          </button>
          <button
            type="button"
            class="rounded px-2.5 py-1 text-xs font-medium transition-all cursor-pointer select-none"
            :class="
              projectStatusFilter === 'COMPLETED'
                ? 'bg-foreground text-background font-medium shadow-2xs'
                : 'text-muted-foreground hover:text-foreground'
            "
            @click="projectStatusFilter = 'COMPLETED'"
          >
            Completed ({{ projects.length - activeProjectsCount }})
          </button>
        </div>

        <!-- Search Project Input -->
        <div class="relative w-full sm:w-72">
          <Search class="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" :stroke-width="1.6" />
          <Input
            :model-value="projectSearchQuery"
            placeholder="Search project by name..."
            class="h-8 pl-8 pr-3 text-xs rounded-md shadow-2xs"
            @input="projectSearchQuery = ($event.target as HTMLInputElement).value; handleProjectSearchInput()"
          />
        </div>
      </div>

      <!-- Project Cards Grid -->
      <div v-if="isLoadingProjects" class="flex flex-col items-center justify-center p-16 rounded-lg border border-border bg-card shadow-2xs">
        <RefreshCw class="size-5 animate-spin text-primary mb-2" />
        <span class="text-xs text-muted-foreground font-medium">Loading review projects...</span>
      </div>

      <div v-else-if="filteredProjects.length === 0" class="flex flex-col items-center justify-center p-16 rounded-lg border border-border bg-card text-center shadow-2xs">
        <FolderKanban class="size-8 text-muted-foreground mb-2" :stroke-width="1.6" />
        <p class="text-xs font-semibold text-foreground">No review projects found</p>
        <p class="text-xs text-muted-foreground mt-0.5">There are no project review pipelines matching your filters.</p>
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <ProjectReviewCard
          v-for="p in filteredProjects"
          :key="p.project_id"
          :project="p"
          :can-approve="canApprove"
          @open="openProjectQueue"
          @approve-all="promptApproveAllProject"
        />
      </div>
    </template>

    <template v-else>
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div class="inline-flex p-0.5 rounded-md bg-muted/60 border border-border shadow-2xs self-start sm:self-auto">
          <button
            v-for="tab in statusTabs"
            :key="tab.id"
            type="button"
            class="rounded px-2.5 py-1 text-xs font-medium transition-all cursor-pointer select-none"
            :class="
              selectedStatusFilter === tab.id
                ? 'bg-foreground text-background font-medium shadow-2xs'
                : 'text-muted-foreground hover:text-foreground'
            "
            @click="setStatusFilter(tab.id)"
          >
            {{ tab.label }}
          </button>
        </div>

        <!-- Search Bar -->
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

      <!-- Batch Actions Bar (Toolbar) -->
      <div
        class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-3.5 py-2.5 rounded-lg border border-border bg-muted/30 shadow-2xs"
      >
        <!-- Left: Select All Checkbox & Count -->
        <div class="flex items-center gap-3">
          <label class="inline-flex items-center gap-2 cursor-pointer text-xs font-medium text-foreground select-none">
            <input
              type="checkbox"
              :checked="isAllCurrentPageSelected"
              class="size-3.5 rounded border-border text-primary focus:ring-0 cursor-pointer accent-primary"
              @change="toggleSelectAllCurrentPage"
            />
            <span>Select All (Page)</span>
          </label>

          <span class="text-border text-xs">|</span>

          <span class="text-xs text-muted-foreground tabular-nums">
            <strong class="text-foreground font-semibold">{{ selectedAnnotationIds.size }}</strong> of {{ totalReviews }} selected
          </span>
        </div>

        <!-- Right: Batch Action Buttons -->
        <div class="flex items-center gap-2 flex-wrap">
          <!-- Batch Reject Selected -->
          <button
            v-if="canReject"
            type="button"
            :disabled="selectedAnnotationIds.size === 0"
            class="inline-flex items-center gap-1.5 h-7 px-2.5 rounded text-xs font-medium border border-border bg-card transition-colors cursor-pointer"
            :class="
              selectedAnnotationIds.size > 0
                ? 'text-destructive hover:bg-destructive/10 hover:border-destructive/25'
                : 'opacity-40 cursor-not-allowed text-muted-foreground'
            "
            @click="openBatchRejectModal"
          >
            <X class="size-3.5" :stroke-width="1.6" />
            <span>Reject Selected ({{ selectedAnnotationIds.size }})</span>
          </button>

          <!-- Batch Approve Selected -->
          <button
            v-if="canApprove"
            type="button"
            :disabled="selectedAnnotationIds.size === 0 || isSubmittingBatch"
            class="inline-flex items-center gap-1.5 h-7 px-2.5 rounded text-xs font-medium bg-foreground text-background transition-all shadow-2xs active:scale-[0.98] cursor-pointer"
            :class="
              selectedAnnotationIds.size > 0
                ? 'hover:bg-foreground/90'
                : 'opacity-40 cursor-not-allowed'
            "
            @click="handleBatchApproveSelected"
          >
            <CheckCheck class="size-3.5" :stroke-width="1.6" />
            <span>Approve Selected ({{ selectedAnnotationIds.size }})</span>
          </button>

          <!-- Quick Action: Approve all pending in this project -->
          <button
            v-if="selectedProject && selectedProject.pending_count > 0 && canApprove"
            type="button"
            class="inline-flex items-center gap-1.5 h-7 px-2.5 rounded text-xs font-medium border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-colors cursor-pointer"
            @click="promptApproveAllProject(selectedProject)"
          >
            <Sparkles class="size-3.5" :stroke-width="1.6" />
            <span>Approve All Project Pending ({{ selectedProject.pending_count }})</span>
          </button>
        </div>
      </div>

      <!-- Review Items List -->
      <div v-if="isLoadingReviews" class="flex flex-col items-center justify-center p-16 rounded-lg border border-border bg-card shadow-2xs">
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
            :selectable="true"
            :selected="selectedAnnotationIds.has(rev.annotation_id)"
            @update:selected="toggleItemSelection(rev.annotation_id)"
            @inspect="router.push(`/workspace?task_id=${$event}`)"
            @approve="handleApproveSingle"
            @editApprove="openEditApproveModal"
            @reject="openSingleRejectModal"
          />
        </div>

        <!-- Pagination Bar -->
        <Card class="px-5 py-2 shadow-2xs border border-border">
          <Pagination
            :page="currentPage"
            :limit="pageLimit"
            :total="totalReviews"
            :totalPages="totalPages"
            :disabled="isLoadingReviews"
            @update:page="handlePageChange"
            @update:limit="handleLimitChange"
          />
        </Card>
      </div>
    </template>
    </div>

    <!-- Direct In-Place Edit & Approve Modal -->
    <Modal
      :open="showEditApproveModal"
      title="Direct In-Place Edit & Approve"
      description="Reviewer/QA can directly modify and approve the annotation payload in a single step (Fix & Accept)."
      maxWidth="max-w-2xl"
      @close="showEditApproveModal = false; editApproveReview = null"
    >
      <div v-if="editApproveReview" class="space-y-4 p-1">
        <div class="p-3 rounded-lg border border-border bg-muted/30 flex items-center justify-between text-xs">
          <div>
            <span class="font-semibold text-foreground">Annotation #{{ editApproveReview.annotation_id }}</span>
            <div class="text-[11px] text-muted-foreground mt-0.5">
              File: {{ editApproveReview.annotation?.data_item?.file_name || 'Task Item' }}
            </div>
          </div>
          <span class="px-2 py-0.5 rounded text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25">
            Fix & Accept
          </span>
        </div>

        <div class="space-y-1.5">
          <label class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Reviewer/QA Note</label>
          <input
            v-model="editApproveComment"
            type="text"
            class="w-full h-9 rounded-md border border-border bg-card px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-2xs"
            placeholder="e.g. Corrected bounding box coordinates and accepted."
          />
        </div>

        <div class="space-y-1.5">
          <label class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Annotation Payload (JSON)</label>
          <textarea
            v-model="editApprovePayloadString"
            rows="12"
            class="w-full rounded-md border border-border bg-background p-3 font-mono text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-2xs"
            placeholder="{ ... }"
          ></textarea>
          <p class="text-[11px] text-muted-foreground">
            Modify the geometry coordinates, labels, or attributes above. Submitting records a FIXED_ACCEPTED verdict and persists the new payload.
          </p>
        </div>

        <div class="flex items-center justify-end gap-2 pt-2">
          <Button
            variant="ghost"
            type="button"
            size="sm"
            @click="showEditApproveModal = false; editApproveReview = null"
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            :disabled="isSubmittingEditApprove"
            @click="handleConfirmEditApprove"
          >
            <RefreshCw v-if="isSubmittingEditApprove" class="size-3.5 animate-spin mr-1.5" />
            <span>Confirm Fix & Approve</span>
          </Button>
        </div>
      </div>
    </Modal>

    <ReviewRejectModal
      :open="showRejectModal"
      v-model:comment="rejectComment"
      @close="showRejectModal = false; rejectTarget = null"
      @confirm="handleRejectConfirm"
    />

    <!-- Approve All in Project Confirmation Modal -->
    <Modal
      :open="showProjectApproveModal"
      :title="`Approve All Pending Annotations?`"
      description="This will mark all pending annotations in this project as approved in a single transaction."
      @close="showProjectApproveModal = false; projectToApprove = null"
    >
      <div v-if="projectToApprove" class="space-y-4">
        <div class="p-3 rounded-lg border border-border bg-muted/30 flex items-center justify-between text-xs">
          <div>
            <span class="font-semibold text-foreground">{{ projectToApprove.project_name }}</span>
            <div class="text-[11px] text-muted-foreground mt-0.5 capitalize">
              Modality: {{ projectToApprove.modality.toLowerCase() }} &bull; {{ projectToApprove.annotation_type }}
            </div>
          </div>
          <span class="px-2 py-0.5 rounded text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25">
            {{ projectToApprove.pending_count }} items
          </span>
        </div>

        <div class="space-y-1.5">
          <label class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Reviewer Comment (Optional)</label>
          <input
            v-model="projectApproveComment"
            type="text"
            class="w-full h-9 rounded-md border border-border bg-card px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-2xs"
            placeholder="e.g. Verified and approved all submitted bounding boxes."
          />
        </div>

        <div class="flex items-center justify-end gap-2 pt-2">
          <Button
            variant="ghost"
            type="button"
            size="sm"
            @click="showProjectApproveModal = false; projectToApprove = null"
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            :disabled="isSubmittingBatch"
            @click="confirmApproveAllProject"
          >
            <RefreshCw v-if="isSubmittingBatch" class="size-3.5 animate-spin mr-1.5" />
            <span>Confirm Batch Approve</span>
          </Button>
        </div>
      </div>
    </Modal>
  </div>
</template>
