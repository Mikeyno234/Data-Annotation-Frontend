<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { workflowApi } from '@/api/workflow'
import { useAuthStore } from '@/stores/auth'
import type { QATask, QAProjectSummary, BatchQAEvaluateRequest, QAIssueTypeOption } from '@/types'
import { toast } from '@/utils/toast'
import Card from '@/components/ui/Card.vue'
import Input from '@/components/ui/Input.vue'
import Button from '@/components/ui/Button.vue'
import Modal from '@/components/ui/Modal.vue'
import Pagination from '@/components/ui/Pagination.vue'
import QATaskCard from '@/components/qa/QATaskCard.vue'
import ProjectQACard from '@/components/qa/ProjectQACard.vue'
import QAEvalModal from '@/components/qa/QAEvalModal.vue'
import {
  ShieldCheck,
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
  AlertTriangle,
  Layers,
  Cpu,
  Percent,
} from 'lucide-vue-next'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const canEvaluate = computed(() => authStore.hasPermission('qa.evaluate') || authStore.isSuperAdmin)

// View Modes: 'PROJECTS' | 'TASKS'
const viewMode = ref<'PROJECTS' | 'TASKS'>('PROJECTS')

// Projects State
const projects = ref<QAProjectSummary[]>([])
const isLoadingProjects = ref(true)
const projectSearchQuery = ref('')
const projectStatusFilter = ref<'ALL' | 'PENDING' | 'COMPLETED'>('ALL')
let projectSearchDebounceTimer: any = null

// Selected Project (for project drill-down)
const selectedProject = ref<QAProjectSummary | null>(null)
const selectedProjectId = computed<number | undefined>(() => {
  const q = route.query.project_id
  if (q) {
    const parsed = Number(q)
    return isNaN(parsed) ? undefined : parsed
  }
  return selectedProject.value?.project_id
})

// Tasks Queue State
const qaTasks = ref<QATask[]>([])
const isLoadingTasks = ref(false)
const selectedStatusFilter = ref('PENDING')
const currentPage = ref(1)
const pageLimit = ref(10)
const totalTasks = ref(0)
const totalPages = ref(1)

// Selection State for Batch Actions
const selectedTaskIds = ref<Set<number>>(new Set())

// Issue Categories State (Loaded from DB)
const issueOptions = ref<QAIssueTypeOption[]>([])
const customIssueReason = ref('')
const batchCustomIssueReason = ref('')

// Single Task Eval Modal State
const selectedTask = ref<QATask | null>(null)
const evalScore = ref(95.0)
const evalPassed = ref(true)
const evalIssueType = ref('NONE')
const evalComment = ref('')
const showEvalModal = ref(false)

// Batch Evaluation Modal State
const showBatchModal = ref(false)
const batchMode = ref<'SELECTED' | 'PROJECT_ALL'>('SELECTED')
const batchScore = ref(95.0)
const batchPassed = ref(true)
const batchIssueType = ref('NONE')
const batchComment = ref('Consensus evaluation verified in batch')
const isSubmittingBatch = ref(false)

const statusTabs = [
  { id: 'PENDING', label: 'Pending QA' },
  { id: 'PASSED', label: 'Passed Quality' },
  { id: 'FAILED', label: 'Failed Consensus' },
  { id: 'ALL', label: 'All QA Tasks' },
]

const scorePresets = [
  { label: '100% Perfect', value: 100 },
  { label: '95% High', value: 95 },
  { label: '85% Good', value: 85 },
  { label: '70% Fair', value: 70 },
  { label: '50% Poor', value: 50 },
]

// Aggregate Metrics across projects
const totalPendingTasks = computed(() =>
  projects.value.reduce((acc, p) => acc + (p.pending_count || 0), 0)
)
const totalPassedTasks = computed(() =>
  projects.value.reduce((acc, p) => acc + (p.passed_count || 0), 0)
)
const totalFailedTasks = computed(() =>
  projects.value.reduce((acc, p) => acc + (p.failed_count || 0), 0)
)
const activeProjectsCount = computed(() =>
  projects.value.filter((p) => p.pending_count > 0).length
)

// Filtered Projects List
const filteredProjects = computed(() => {
  let list = projects.value
  if (projectStatusFilter.value === 'PENDING') {
    list = list.filter((p) => p.pending_count > 0)
  } else if (projectStatusFilter.value === 'COMPLETED') {
    list = list.filter((p) => p.pending_count === 0 && p.total_tasks > 0)
  }
  return list
})

// Current Project Drill-Down Details
const currentProject = computed(() => {
  if (!selectedProjectId.value) return null
  return projects.value.find((p) => p.project_id === selectedProjectId.value) || selectedProject.value
})

// --- DATA FETCHING ---

async function fetchIssueOptions() {
  try {
    const res = await workflowApi.getQAIssueTypes()
    const payload = res.data?.data || res.data
    if (Array.isArray(payload) && payload.length > 0) {
      issueOptions.value = payload
    }
  } catch (err: any) {
    console.error('Failed to load QA issue types:', err)
  }
}

async function fetchProjects() {
  isLoadingProjects.value = true
  try {
    const res = await workflowApi.getQAProjects({
      search: projectSearchQuery.value.trim() || undefined,
    })
    const payload = res.data?.data || res.data
    projects.value = Array.isArray(payload) ? payload : []

    if (selectedProjectId.value) {
      const found = projects.value.find((p) => p.project_id === selectedProjectId.value)
      if (found) {
        selectedProject.value = found
      }
    }
  } catch (err: any) {
    toast.error('Failed to load QA projects', err?.message)
  } finally {
    isLoadingProjects.value = false
  }
}

async function fetchQATasks() {
  isLoadingTasks.value = true
  try {
    const res = await workflowApi.getQATasks({
      page: currentPage.value,
      limit: pageLimit.value,
      status: selectedStatusFilter.value !== 'ALL' ? selectedStatusFilter.value : undefined,
      project_id: selectedProjectId.value,
    })
    const payload = res.data?.data || res.data
    qaTasks.value = Array.isArray(payload) ? payload : []
    const pagination = res.data?.pagination || (res as any).pagination
    if (pagination) {
      totalTasks.value = pagination.total ?? qaTasks.value.length
      totalPages.value = pagination.total_pages ?? 1
    } else {
      totalTasks.value = qaTasks.value.length
      totalPages.value = 1
    }
    // Clear selection on page change or refresh
    selectedTaskIds.value.clear()
  } catch (err: any) {
    toast.error('Failed to load QA tasks', err?.message)
  } finally {
    isLoadingTasks.value = false
  }
}

// --- PROJECT NAVIGATION & SEARCH ---

function setViewMode(mode: 'PROJECTS' | 'TASKS') {
  viewMode.value = mode
  if (mode === 'PROJECTS') {
    router.push({ query: {} })
    selectedProject.value = null
    fetchProjects()
  } else {
    router.push({ query: { view: 'tasks' } })
    currentPage.value = 1
    fetchQATasks()
  }
}

function handleProjectSearchInput() {
  clearTimeout(projectSearchDebounceTimer)
  projectSearchDebounceTimer = setTimeout(() => {
    fetchProjects()
  }, 300)
}

function openProjectQueue(proj: QAProjectSummary) {
  selectedProject.value = proj
  currentPage.value = 1
  selectedStatusFilter.value = 'PENDING'
  router.push({ query: { project_id: proj.project_id } })
  fetchQATasks()
}

function backToAllProjects() {
  selectedProject.value = null
  selectedTaskIds.value.clear()
  router.push({ query: {} })
  fetchProjects()
}

function setStatusFilter(status: string) {
  selectedStatusFilter.value = status
  currentPage.value = 1
  fetchQATasks()
}

function handlePageChange(page: number) {
  currentPage.value = page
  fetchQATasks()
}

function handleLimitChange(limit: number) {
  pageLimit.value = limit
  currentPage.value = 1
  fetchQATasks()
}

// --- SELECTION & BATCH ACTIONS ---

function toggleTaskSelection(taskId: number, checked: boolean) {
  if (checked) {
    selectedTaskIds.value.add(taskId)
  } else {
    selectedTaskIds.value.delete(taskId)
  }
}

const isAllPageSelected = computed(() => {
  if (qaTasks.value.length === 0) return false
  return qaTasks.value.every((t) => selectedTaskIds.value.has(t.id))
})

function toggleSelectAllPage() {
  if (isAllPageSelected.value) {
    qaTasks.value.forEach((t) => selectedTaskIds.value.delete(t.id))
  } else {
    qaTasks.value.forEach((t) => selectedTaskIds.value.add(t.id))
  }
}

function deselectAll() {
  selectedTaskIds.value.clear()
}

// --- EVALUATION MODAL LOGIC ---

function openEvalModal(task: QATask) {
  selectedTask.value = task
  evalScore.value = 95.0
  evalPassed.value = true
  evalIssueType.value = 'NONE'
  customIssueReason.value = ''
  evalComment.value = ''
  showEvalModal.value = true
}

function adjustScore(delta: number) {
  const next = Math.min(100, Math.max(0, evalScore.value + delta))
  evalScore.value = Number(next.toFixed(1))
}

function setPresetScore(val: number) {
  evalScore.value = val
  if (val >= 75) {
    evalPassed.value = true
    if (evalIssueType.value === 'BOUNDARY_MISMATCH') evalIssueType.value = 'NONE'
  } else {
    evalPassed.value = false
    if (evalIssueType.value === 'NONE') evalIssueType.value = 'BOUNDARY_MISMATCH'
  }
}

async function handleEvaluate() {
  if (!selectedTask.value) return
  const isPassed = evalScore.value >= 70.0
  let issueTypeToSend = evalIssueType.value
  if (evalIssueType.value === 'OTHER' && customIssueReason.value.trim()) {
    issueTypeToSend = `OTHER: ${customIssueReason.value.trim()}`
  }
  try {
    await workflowApi.evaluateQA(selectedTask.value.id, {
      score: evalScore.value,
      passed: isPassed,
      issue_type: issueTypeToSend,
      comment: evalComment.value || (isPassed ? 'Agreement IoU overlap validated.' : 'Substandard consensus agreement.'),
    })
    toast.success('QA Evaluated', `Consensus score ${evalScore.value}% (${isPassed ? 'Passed' : 'Failed'}) recorded`)
    showEvalModal.value = false
    fetchQATasks()
    fetchProjects()
  } catch (err: any) {
    toast.error('Failed to evaluate QA', err?.message)
  }
}

// --- BATCH EVALUATE MODAL LOGIC ---

function openBatchPassSelected() {
  if (selectedTaskIds.value.size === 0) return
  batchMode.value = 'SELECTED'
  batchScore.value = 95.0
  batchPassed.value = true
  batchIssueType.value = 'NONE'
  batchCustomIssueReason.value = ''
  batchComment.value = `Batch verified ${selectedTaskIds.value.size} QA tasks`
  showBatchModal.value = true
}

function openBatchFailSelected() {
  if (selectedTaskIds.value.size === 0) return
  batchMode.value = 'SELECTED'
  batchScore.value = 50.0
  batchPassed.value = false
  batchIssueType.value = 'BOUNDARY_MISMATCH'
  batchCustomIssueReason.value = ''
  batchComment.value = `Flagged ${selectedTaskIds.value.size} QA tasks with consensus discrepancy`
  showBatchModal.value = true
}

function openProjectPassAll(proj: QAProjectSummary) {
  selectedProject.value = proj
  batchMode.value = 'PROJECT_ALL'
  batchScore.value = 95.0
  batchPassed.value = true
  batchIssueType.value = 'NONE'
  batchCustomIssueReason.value = ''
  batchComment.value = `Batch approved all pending QA tasks for project: ${proj.project_name}`
  showBatchModal.value = true
}

async function submitBatchEvaluation() {
  isSubmittingBatch.value = true
  try {
    let issueTypeToSend = batchIssueType.value
    if (batchIssueType.value === 'OTHER' && batchCustomIssueReason.value.trim()) {
      issueTypeToSend = `OTHER: ${batchCustomIssueReason.value.trim()}`
    }

    const payload: BatchQAEvaluateRequest = {
      score: batchScore.value,
      passed: batchPassed.value,
      issue_type: issueTypeToSend,
      comment: batchComment.value,
    }

    if (batchMode.value === 'SELECTED') {
      payload.task_ids = Array.from(selectedTaskIds.value)
    } else if (batchMode.value === 'PROJECT_ALL' && selectedProject.value) {
      payload.project_id = selectedProject.value.project_id
    }

    const res = await workflowApi.batchEvaluateQA(payload)
    const count = res.data?.data?.count ?? (res.data as any)?.count ?? selectedTaskIds.value.size
    toast.success('Batch QA Evaluated', `${count} task(s) processed successfully as ${batchPassed.value ? 'PASSED' : 'FAILED'}`)

    showBatchModal.value = false
    selectedTaskIds.value.clear()
    await Promise.all([fetchProjects(), fetchQATasks()])
  } catch (err: any) {
    toast.error('Batch evaluation failed', err?.message)
  } finally {
    isSubmittingBatch.value = false
  }
}

// --- ROUTE SYNC & INITIALIZATION ---

watch(
  () => route.query.project_id,
  (newProjId) => {
    if (newProjId) {
      const pid = Number(newProjId)
      if (!isNaN(pid)) {
        const found = projects.value.find((p) => p.project_id === pid)
        if (found) selectedProject.value = found
        currentPage.value = 1
        fetchQATasks()
      }
    } else {
      selectedProject.value = null
      if (viewMode.value === 'PROJECTS') {
        fetchProjects()
      }
    }
  }
)

onMounted(async () => {
  if (route.query.view === 'tasks') {
    viewMode.value = 'TASKS'
  }
  await Promise.all([fetchProjects(), fetchIssueOptions()])
  if (selectedProjectId.value || viewMode.value === 'TASKS') {
    await fetchQATasks()
  }
})
</script>

<template>
  <div class="flex flex-col gap-6 max-w-7xl mx-auto pb-12">
    <!-- Top Header & View Switcher -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <div class="flex items-center gap-2.5">
          <h1 class="text-xl font-semibold tracking-tight text-foreground">QA & Consensus Evaluation</h1>
          <span
            v-if="viewMode === 'PROJECTS' && !selectedProjectId"
            class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-muted text-muted-foreground border border-border"
          >
            {{ projects.length }} projects
          </span>
          <span
            v-else
            class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-muted text-muted-foreground border border-border"
          >
            {{ totalTasks }} queued
          </span>
        </div>
        <p class="text-xs text-muted-foreground mt-0.5">
          Quality assurance scoring, inter-annotator agreement metrics, and consensus conflict resolution
        </p>
      </div>

      <!-- View Switcher (By Project vs All Tasks) -->
      <div v-if="!selectedProjectId" class="inline-flex p-0.5 rounded-md bg-muted/60 border border-border shadow-2xs self-start sm:self-auto">
        <button
          type="button"
          class="flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition-all cursor-pointer select-none"
          :class="
            viewMode === 'PROJECTS'
              ? 'bg-foreground text-background font-medium shadow-2xs'
              : 'text-muted-foreground hover:text-foreground'
          "
          @click="setViewMode('PROJECTS')"
        >
          <FolderKanban class="size-3.5" :stroke-width="1.6" />
          <span>By Project</span>
        </button>
        <button
          type="button"
          class="flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition-all cursor-pointer select-none"
          :class="
            viewMode === 'TASKS'
              ? 'bg-foreground text-background font-medium shadow-2xs'
              : 'text-muted-foreground hover:text-foreground'
          "
          @click="setViewMode('TASKS')"
        >
          <ListFilter class="size-3.5" :stroke-width="1.6" />
          <span>All Tasks</span>
        </button>
      </div>
    </div>

    <!-- Unified Minimalist Metric Strip -->
    <div class="grid grid-cols-2 sm:grid-cols-4 rounded-lg border border-border/70 bg-card divide-x divide-border/60 shadow-xs overflow-hidden">
      <div class="p-3 sm:p-4">
        <span class="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Projects in QA</span>
        <div class="mt-1 flex items-baseline gap-1.5">
          <span class="text-xl font-bold tracking-tight text-foreground tabular-nums">{{ projects.length }}</span>
          <span v-if="activeProjectsCount > 0" class="text-[11px] text-muted-foreground">
            ({{ activeProjectsCount }} active)
          </span>
        </div>
      </div>

      <div class="p-3 sm:p-4">
        <span class="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Pending QA</span>
        <div class="mt-1 flex items-baseline gap-1.5">
          <span class="text-xl font-bold tracking-tight text-foreground tabular-nums">{{ totalPendingTasks }}</span>
          <span class="text-[11px] text-muted-foreground">tasks</span>
        </div>
      </div>

      <div class="p-3 sm:p-4">
        <span class="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Passed Quality</span>
        <div class="mt-1 flex items-baseline gap-1.5">
          <span class="text-xl font-bold tracking-tight text-foreground tabular-nums">{{ totalPassedTasks }}</span>
          <span class="text-[11px] text-muted-foreground">verified</span>
        </div>
      </div>

      <div class="p-3 sm:p-4">
        <span class="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Failed / Disputes</span>
        <div class="mt-1 flex items-baseline gap-1.5">
          <span class="text-xl font-bold tracking-tight text-foreground tabular-nums">{{ totalFailedTasks }}</span>
          <span class="text-[11px] text-muted-foreground">flagged</span>
        </div>
      </div>
    </div>

    <!-- ========================================================================================= -->
    <!-- VIEW A: BY PROJECT OVERVIEW (Default) -->
    <!-- ========================================================================================= -->
    <template v-if="viewMode === 'PROJECTS' && !selectedProjectId">
      <!-- Toolbar: Search & Filter Pills -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <!-- Filter Pills -->
        <div class="inline-flex p-0.5 rounded-md bg-muted/60 border border-border shadow-2xs self-start">
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
            Needs QA ({{ activeProjectsCount }})
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
            Completed
          </button>
        </div>

        <!-- Search Bar -->
        <div class="relative w-full sm:w-72">
          <Search class="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" :stroke-width="1.6" />
          <Input
            v-model="projectSearchQuery"
            placeholder="Search projects..."
            class="pl-8 h-8 text-xs bg-card border-border"
            @input="handleProjectSearchInput"
          />
          <button
            v-if="projectSearchQuery"
            type="button"
            class="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
            @click="projectSearchQuery = ''; fetchProjects()"
          >
            <X class="size-3" :stroke-width="1.6" />
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="isLoadingProjects" class="flex flex-col items-center justify-center p-16 rounded-lg border border-border bg-card shadow-2xs">
        <RefreshCw class="size-5 animate-spin text-primary mb-2" :stroke-width="1.6" />
        <span class="text-xs text-muted-foreground font-medium">Loading QA projects...</span>
      </div>

      <!-- Empty State -->
      <div v-else-if="filteredProjects.length === 0" class="flex flex-col items-center justify-center p-16 rounded-lg border border-border bg-card text-center shadow-2xs">
        <div class="flex size-10 items-center justify-center rounded-md bg-muted text-muted-foreground border border-border mb-3">
          <FolderKanban class="size-5 text-foreground" :stroke-width="1.6" />
        </div>
        <h3 class="text-sm font-semibold text-foreground tracking-tight">No QA Projects Found</h3>
        <p class="text-xs text-muted-foreground mt-1 max-w-sm leading-relaxed">
          {{ projectSearchQuery ? `No projects matching "${projectSearchQuery}".` : 'No projects have tasks in the QA pipeline yet.' }}
        </p>
        <Button variant="outline" size="sm" class="mt-4 gap-1.5 text-xs font-medium cursor-pointer" @click="projectSearchQuery = ''; fetchProjects()">
          <RefreshCw class="size-3" :stroke-width="1.6" />
          <span>Refresh Projects</span>
        </Button>
      </div>

      <!-- Projects Grid -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <ProjectQACard
          v-for="project in filteredProjects"
          :key="project.project_id"
          :project="project"
          :can-evaluate="canEvaluate"
          @open="openProjectQueue"
          @pass-all="openProjectPassAll"
        />
      </div>
    </template>

    <!-- ========================================================================================= -->
    <!-- VIEW B: PROJECT DRILL-DOWN QA QUEUE -->
    <!-- ========================================================================================= -->
    <template v-else-if="selectedProjectId">
      <!-- Project Drill-Down Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-border/60">
        <div class="flex items-center gap-2 flex-wrap min-w-0">
          <button
            type="button"
            class="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            @click="backToAllProjects"
          >
            <ArrowLeft class="size-3.5" :stroke-width="1.6" />
            <span>Projects</span>
          </button>
          <span class="text-border">/</span>
          <h2 class="text-sm font-semibold text-foreground tracking-tight truncate max-w-md">
            {{ currentProject?.project_name || `Project #${selectedProjectId}` }}
          </h2>
          <span
            v-if="currentProject?.modality"
            class="px-1.5 py-0.2 rounded text-[10px] font-medium bg-muted text-muted-foreground uppercase"
          >
            {{ currentProject.modality }}
          </span>
          <span
            v-if="currentProject?.annotation_type"
            class="text-[11px] text-muted-foreground truncate hidden md:inline"
          >
            · {{ currentProject.annotation_type }}
          </span>
        </div>

        <div class="flex items-center gap-2 shrink-0">
          <button
            v-if="currentProject && currentProject.pending_count > 0 && canEvaluate"
            type="button"
            class="inline-flex items-center gap-1.5 h-7 px-2.5 rounded text-xs font-medium bg-foreground text-background hover:bg-foreground/90 transition-all cursor-pointer active:scale-[0.98]"
            @click="openProjectPassAll(currentProject)"
          >
            <CheckCheck class="size-3.5" :stroke-width="1.6" />
            <span>Pass All Pending ({{ currentProject.pending_count }})</span>
          </button>
          <button
            type="button"
            class="inline-flex items-center gap-1.5 h-7 px-2.5 rounded text-xs font-medium text-muted-foreground hover:text-foreground border border-border/70 hover:bg-muted transition-colors cursor-pointer"
            @click="fetchQATasks"
          >
            <RefreshCw class="size-3" :class="{ 'animate-spin': isLoadingTasks }" :stroke-width="1.6" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <!-- Status Tabs -->
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="inline-flex p-0.5 rounded-md bg-muted/60 border border-border shadow-2xs">
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

        <!-- Multi-Selection Summary Counter -->
        <div v-if="selectedTaskIds.size > 0" class="inline-flex items-center gap-2 text-xs font-medium text-foreground bg-muted/50 px-2.5 py-1 rounded-md border border-border">
          <span>{{ selectedTaskIds.size }} task(s) selected</span>
          <button type="button" class="text-muted-foreground hover:text-foreground cursor-pointer" @click="deselectAll">
            <X class="size-3" />
          </button>
        </div>
      </div>

      <!-- Batch Action Toolbar (When items selected) -->
      <div
        v-if="selectedTaskIds.size > 0 && canEvaluate"
        class="flex flex-wrap items-center justify-between gap-3 p-2.5 rounded-lg border border-border bg-card shadow-xs animate-in fade-in duration-150"
      >
        <div class="flex items-center gap-2">
          <button
            type="button"
            class="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground cursor-pointer"
            @click="toggleSelectAllPage"
          >
            <span>{{ isAllPageSelected ? 'Deselect Page' : 'Select All Page' }}</span>
          </button>
        </div>

        <div class="flex items-center gap-2">
          <button
            type="button"
            class="inline-flex items-center gap-1.5 h-7 px-3 rounded text-xs font-medium bg-foreground text-background hover:bg-foreground/90 transition-all cursor-pointer"
            @click="openBatchPassSelected"
          >
            <CheckCheck class="size-3.5" :stroke-width="1.6" />
            <span>Pass Selected ({{ selectedTaskIds.size }})</span>
          </button>

          <button
            type="button"
            class="inline-flex items-center gap-1.5 h-7 px-2.5 rounded text-xs font-medium text-destructive hover:bg-destructive/10 border border-destructive/25 transition-colors cursor-pointer"
            @click="openBatchFailSelected"
          >
            <AlertTriangle class="size-3.5" :stroke-width="1.6" />
            <span>Flag Disputed ({{ selectedTaskIds.size }})</span>
          </button>
        </div>
      </div>

      <!-- Tasks List Loading -->
      <div v-if="isLoadingTasks" class="flex flex-col items-center justify-center p-16 rounded-lg border border-border bg-card shadow-2xs">
        <RefreshCw class="size-5 animate-spin text-primary mb-2" :stroke-width="1.6" />
        <span class="text-xs text-muted-foreground font-medium">Loading QA tasks for project...</span>
      </div>

      <!-- Tasks List Empty -->
      <div v-else-if="qaTasks.length === 0" class="flex flex-col items-center justify-center p-16 rounded-lg border border-border bg-card text-center shadow-2xs">
        <div class="flex size-10 items-center justify-center rounded-md bg-muted text-muted-foreground border border-border mb-3">
          <ShieldCheck class="size-5 text-foreground" :stroke-width="1.6" />
        </div>
        <h3 class="text-sm font-semibold text-foreground tracking-tight">No Tasks In This Tab</h3>
        <p class="text-xs text-muted-foreground mt-1 max-w-sm leading-relaxed">
          No QA tasks match the selected filter ({{ selectedStatusFilter }}) for this project.
        </p>
        <Button variant="outline" size="sm" class="mt-4 gap-1.5 text-xs font-medium cursor-pointer" @click="fetchQATasks">
          <RefreshCw class="size-3" :stroke-width="1.6" />
          <span>Refresh</span>
        </Button>
      </div>

      <!-- Tasks List Cards -->
      <div v-else class="flex flex-col gap-3.5">
        <div class="grid grid-cols-1 gap-3">
          <QATaskCard
            v-for="task in qaTasks"
            :key="task.id"
            :task="task"
            :selectable="canEvaluate"
            :selected="selectedTaskIds.has(task.id)"
            @update:selected="toggleTaskSelection(task.id, $event)"
            @score-consensus="openEvalModal"
          />
        </div>

        <!-- Pagination Bar -->
        <Card class="px-5 py-2 shadow-2xs border border-border">
          <Pagination
            :page="currentPage"
            :limit="pageLimit"
            :total="totalTasks"
            :total-pages="totalPages"
            :disabled="isLoadingTasks"
            @update:page="handlePageChange"
            @update:limit="handleLimitChange"
          />
        </Card>
      </div>
    </template>

    <!-- ========================================================================================= -->
    <!-- VIEW C: ALL TASKS (Flat List Across All Projects) -->
    <!-- ========================================================================================= -->
    <template v-else>
      <!-- Status Tabs -->
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="inline-flex p-0.5 rounded-md bg-muted/60 border border-border shadow-2xs">
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

        <Button variant="outline" size="sm" class="h-7 text-xs gap-1.5 cursor-pointer" @click="fetchQATasks">
          <RefreshCw class="size-3" :class="{ 'animate-spin': isLoadingTasks }" :stroke-width="1.6" />
          <span>Refresh</span>
        </Button>
      </div>

      <!-- Loading State -->
      <div v-if="isLoadingTasks" class="flex flex-col items-center justify-center p-16 rounded-lg border border-border bg-card shadow-2xs">
        <RefreshCw class="size-5 animate-spin text-primary mb-2" :stroke-width="1.6" />
        <span class="text-xs text-muted-foreground font-medium">Loading all QA tasks...</span>
      </div>

      <!-- Empty State -->
      <div v-else-if="qaTasks.length === 0" class="flex flex-col items-center justify-center p-16 rounded-lg border border-border bg-card text-center shadow-2xs">
        <div class="flex size-10 items-center justify-center rounded-md bg-muted text-muted-foreground border border-border mb-3">
          <ShieldCheck class="size-5 text-foreground" :stroke-width="1.6" />
        </div>
        <h3 class="text-sm font-semibold text-foreground tracking-tight">No Tasks Found</h3>
        <p class="text-xs text-muted-foreground mt-1 max-w-sm leading-relaxed">
          No QA tasks are currently queued across any projects with status {{ selectedStatusFilter }}.
        </p>
        <Button variant="outline" size="sm" class="mt-4 gap-1.5 text-xs font-medium cursor-pointer" @click="fetchQATasks">
          <RefreshCw class="size-3" :stroke-width="1.6" />
          <span>Refresh</span>
        </Button>
      </div>

      <!-- Task Cards -->
      <div v-else class="flex flex-col gap-3.5">
        <div class="grid grid-cols-1 gap-3">
          <QATaskCard
            v-for="task in qaTasks"
            :key="task.id"
            :task="task"
            @score-consensus="openEvalModal"
          />
        </div>

        <!-- Pagination Bar -->
        <Card class="px-5 py-2 shadow-2xs border border-border">
          <Pagination
            :page="currentPage"
            :limit="pageLimit"
            :total="totalTasks"
            :total-pages="totalPages"
            :disabled="isLoadingTasks"
            @update:page="handlePageChange"
            @update:limit="handleLimitChange"
          />
        </Card>
      </div>
    </template>

    <!-- ========================================================================================= -->
    <!-- MODALS -->
    <!-- ========================================================================================= -->

    <!-- Single Task Consensus Evaluation Modal -->
    <QAEvalModal
      :show-modal="showEvalModal"
      :task="selectedTask"
      :eval-score="evalScore"
      :eval-passed="evalPassed"
      :eval-issue-type="evalIssueType"
      :custom-issue-reason="customIssueReason"
      :eval-comment="evalComment"
      :score-presets="scorePresets"
      :issue-options="issueOptions"
      @update:show-modal="showEvalModal = $event"
      @update:eval-score="evalScore = $event"
      @update:eval-passed="evalPassed = $event"
      @update:eval-issue-type="evalIssueType = $event"
      @update:custom-issue-reason="customIssueReason = $event"
      @update:eval-comment="evalComment = $event"
      @adjust-score="adjustScore"
      @set-preset="setPresetScore"
      @submit="handleEvaluate"
    />

    <!-- Batch Evaluation Confirmation Modal -->
    <Modal
      :open="showBatchModal"
      :title="batchMode === 'PROJECT_ALL' ? 'Batch Pass Project QA Tasks' : (batchPassed ? 'Batch Pass Selected Tasks' : 'Flag Disputed Selected Tasks')"
      :description="batchMode === 'PROJECT_ALL' ? `Evaluate and pass all ${selectedProject?.pending_count || 0} pending QA tasks for ${selectedProject?.project_name}` : `Apply consensus evaluation to ${selectedTaskIds.size} selected QA tasks simultaneously.`"
      max-width="max-w-md"
      @close="showBatchModal = false"
    >
      <div class="space-y-4 py-2">
        <!-- Target Status Indicator -->
        <div class="flex items-center justify-between p-3 rounded-lg border" :class="batchPassed ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-destructive/10 border-destructive/20 text-destructive'">
          <div class="flex items-center gap-2">
            <CheckCircle2 v-if="batchPassed" class="size-4" />
            <AlertTriangle v-else class="size-4" />
            <span class="text-xs font-semibold uppercase">{{ batchPassed ? 'PASSED CONSENSUS' : 'FAILED / DISPUTED' }}</span>
          </div>
          <span class="text-xs font-medium tabular-nums">{{ batchMode === 'PROJECT_ALL' ? `${selectedProject?.pending_count || 0} tasks` : `${selectedTaskIds.size} tasks` }}</span>
        </div>

        <!-- Consensus Score -->
        <div class="space-y-1.5">
          <label class="text-xs font-medium text-foreground">Consensus Score (%)</label>
          <div class="flex items-center gap-2">
            <Input
              v-model.number="batchScore"
              type="number"
              min="0"
              max="100"
              step="0.5"
              class="h-8 text-xs bg-card"
            />
            <span class="text-xs text-muted-foreground font-medium">%</span>
          </div>
        </div>

        <!-- Issue Type (if failed or flagging discrepancy) -->
        <div v-if="!batchPassed" class="space-y-1.5">
          <label class="text-xs font-medium text-foreground">Discrepancy / Issue Type</label>
          <select
            v-model="batchIssueType"
            class="w-full h-8 px-2.5 rounded-md text-xs bg-card border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option
              v-for="opt in issueOptions"
              :key="opt.value"
              :value="opt.value"
            >
              {{ opt.label }}
            </option>
          </select>
        </div>

        <!-- Custom Reason for Batch if 'OTHER' selected -->
        <div v-if="!batchPassed && batchIssueType === 'OTHER'" class="space-y-1.5">
          <label class="text-xs font-medium text-foreground flex items-center justify-between">
            <span>Specify Custom Reason <span class="text-rose-500">*</span></span>
          </label>
          <input
            v-model="batchCustomIssueReason"
            type="text"
            required
            placeholder="Describe custom discrepancy reason..."
            class="w-full h-8 px-2.5 rounded-md text-xs bg-card border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground"
          />
        </div>

        <!-- Comment / Evaluation Notes -->
        <div class="space-y-1.5">
          <label class="text-xs font-medium text-foreground">Audit / Evaluator Comment</label>
          <textarea
            v-model="batchComment"
            rows="2"
            class="w-full rounded-md border border-border bg-card p-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground"
            placeholder="Provide consensus notes or reasoning for audit trail..."
          ></textarea>
        </div>
      </div>

      <template #footer>
        <div class="flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" class="h-8 text-xs cursor-pointer" @click="showBatchModal = false">
            Cancel
          </Button>
          <Button
            size="sm"
            class="h-8 text-xs font-medium cursor-pointer gap-1.5"
            :class="batchPassed ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-destructive hover:bg-destructive/90 text-white'"
            :disabled="isSubmittingBatch"
            @click="submitBatchEvaluation"
          >
            <RefreshCw v-if="isSubmittingBatch" class="size-3.5 animate-spin" />
            <span>{{ isSubmittingBatch ? 'Submitting...' : (batchPassed ? 'Confirm & Pass All' : 'Confirm & Flag') }}</span>
          </Button>
        </div>
      </template>
    </Modal>
  </div>
</template>
