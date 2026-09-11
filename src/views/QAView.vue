<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { workflowApi } from '@/api/workflow'
import type { QATask } from '@/types'
import { toast } from '@/utils/toast'
import Card from '@/components/ui/Card.vue'
import Pagination from '@/components/ui/Pagination.vue'
import QATaskCard from '@/components/qa/QATaskCard.vue'
import QAEvalModal from '@/components/qa/QAEvalModal.vue'
import Button from '@/components/ui/Button.vue'
import { ShieldCheck, RefreshCw } from 'lucide-vue-next'

const qaTasks = ref<QATask[]>([])
const selectedTask = ref<QATask | null>(null)
const evalScore = ref(95.0)
const evalPassed = ref(true)
const evalIssueType = ref('NONE')
const evalComment = ref('')
const showEvalModal = ref(false)
const isLoading = ref(true)

const selectedStatusFilter = ref('PENDING')
const currentPage = ref(1)
const pageLimit = ref(10)
const totalTasks = ref(0)
const totalPages = ref(1)

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

async function fetchQATasks() {
  isLoading.value = true
  try {
    const res: any = await workflowApi.getQATasks({
      page: currentPage.value,
      limit: pageLimit.value,
      status: selectedStatusFilter.value !== 'ALL' ? selectedStatusFilter.value : undefined,
    })
    const payload = res?.data?.data || res?.data || res
    qaTasks.value = Array.isArray(payload) ? payload : []
    const pagination = res?.pagination || res?.data?.pagination
    if (pagination) {
      totalTasks.value = pagination.total ?? qaTasks.value.length
      totalPages.value = pagination.total_pages ?? 1
    } else {
      totalTasks.value = qaTasks.value.length
      totalPages.value = 1
    }
  } catch (err: any) {
    toast.error('Failed to load QA tasks', err?.message)
  } finally {
    isLoading.value = false
  }
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

function openEvalModal(task: QATask) {
  selectedTask.value = task
  evalScore.value = 95.0
  evalPassed.value = true
  evalIssueType.value = 'NONE'
  evalComment.value = ''
  showEvalModal.value = true
}

async function handleEvaluate() {
  if (!selectedTask.value) return
  const isPassed = evalScore.value >= 70.0
  try {
    await workflowApi.evaluateQA(selectedTask.value.id, {
      score: evalScore.value,
      passed: isPassed,
      issue_type: evalIssueType.value,
      comment: evalComment.value || (isPassed ? 'Agreement IoU overlap validated.' : 'Substandard consensus agreement.'),
    })
    toast.success('QA Evaluated', `Consensus score ${evalScore.value}% (${isPassed ? 'Passed' : 'Failed'}) recorded`)
    showEvalModal.value = false
    fetchQATasks()
  } catch (err: any) {
    toast.error('Failed to evaluate QA', err?.message)
  }
}

onMounted(fetchQATasks)
</script>

<template>
  <div class="flex flex-col gap-5 max-w-7xl mx-auto">
    <!-- Top Header -->
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <div class="flex items-center gap-2">
          <h1 class="text-xl font-semibold tracking-tight text-foreground">QA & Consensus Evaluation</h1>
          <span class="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium bg-muted text-muted-foreground border border-border">
            {{ totalTasks }} queued
          </span>
        </div>
        <p class="text-xs text-muted-foreground mt-0.5">
          Quality assurance scoring, inter-annotator agreement metrics, and conflict resolution
        </p>
      </div>
    </div>

    <!-- Status Tabs -->
    <div class="inline-flex p-0.5 rounded-md bg-muted/60 border border-border shadow-2xs self-start">
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

    <!-- QA Tasks List -->
    <div v-if="isLoading" class="flex flex-col items-center justify-center p-16 rounded-lg border border-border bg-card shadow-2xs">
      <RefreshCw class="size-5 animate-spin text-primary mb-2" :stroke-width="1.6" />
      <span class="text-xs text-muted-foreground font-medium">Loading QA tasks...</span>
    </div>

    <div v-else-if="qaTasks.length === 0" class="flex flex-col items-center justify-center p-16 rounded-lg border border-border bg-card text-center shadow-2xs">
      <div class="flex size-10 items-center justify-center rounded-md bg-muted text-muted-foreground border border-border mb-3">
        <ShieldCheck class="size-5 text-foreground" :stroke-width="1.6" />
      </div>
      <h3 class="text-sm font-semibold text-foreground tracking-tight">No Tasks Pending Evaluation</h3>
      <p class="text-xs text-muted-foreground mt-1 max-w-sm leading-relaxed">
        All submitted annotations have been evaluated, or no tasks are currently waiting for review.
      </p>
      <Button variant="outline" size="sm" class="mt-4 gap-1.5 text-xs font-medium" @click="fetchQATasks">
        <RefreshCw class="size-3" :stroke-width="1.6" />
        <span>Check for Submissions</span>
      </Button>
    </div>

    <div v-else class="flex flex-col gap-4">
      <div class="grid grid-cols-1 gap-4">
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
          :disabled="isLoading"
          @update:page="handlePageChange"
          @update:limit="handleLimitChange"
        />
      </Card>
    </div>

    <!-- Evaluation Modal -->
    <QAEvalModal
      :show-modal="showEvalModal"
      :eval-score="evalScore"
      :eval-passed="evalPassed"
      :eval-issue-type="evalIssueType"
      :eval-comment="evalComment"
      :score-presets="scorePresets"
      @update:show-modal="showEvalModal = $event"
      @update:eval-score="evalScore = $event"
      @update:eval-passed="evalPassed = $event"
      @update:eval-issue-type="evalIssueType = $event"
      @update:eval-comment="evalComment = $event"
      @adjust-score="adjustScore"
      @set-preset="setPresetScore"
      @submit="handleEvaluate"
    />
  </div>
</template>
