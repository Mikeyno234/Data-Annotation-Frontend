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
    if (res.data) {
      qaTasks.value = res.data.data || res.data
      if (res.data.pagination) {
        totalTasks.value = res.data.pagination.total
        totalPages.value = res.data.pagination.total_pages
      } else {
        totalTasks.value = qaTasks.value.length
        totalPages.value = 1
      }
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
  <div class="flex flex-col gap-6 max-w-7xl mx-auto">
    <!-- Top Header -->
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-foreground">QA & Consensus Evaluation</h1>
        <p class="text-xs text-muted-foreground mt-1">
          Quality assurance scoring, inter-annotator agreement IoU metrics, and conflict resolution
        </p>
      </div>
    </div>

    <!-- Status Tabs -->
    <div class="flex flex-wrap items-center gap-1.5 rounded-2xl bg-card/90 p-1.5 shadow-xs">
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

    <!-- QA Tasks List -->
    <div v-if="isLoading" class="flex flex-col items-center justify-center p-16 rounded-3xl bg-card/60 shadow-sm">
      <RefreshCw class="size-6 animate-spin text-primary mb-2" />
      <span class="text-xs text-muted-foreground">Loading QA tasks...</span>
    </div>

    <div v-else-if="qaTasks.length === 0" class="flex flex-col items-center justify-center p-16 rounded-2xl border border-border/60 bg-card/90 text-center shadow-2xs">
      <div class="flex size-14 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground border border-border/40 mb-4">
        <ShieldCheck class="size-7 text-emerald-500/80" />
      </div>
      <h3 class="text-base font-bold text-foreground tracking-tight">Queue in Equilibrium</h3>
      <p class="text-xs text-muted-foreground mt-1.5 max-w-sm leading-relaxed">
        All active submissions have achieved consensus criteria, or no tasks are currently waiting for evaluator review.
      </p>
      <Button variant="outline" size="sm" class="mt-5 gap-1.5" @click="fetchQATasks">
        <RefreshCw class="size-3.5" />
        <span>Sync Quality Stream</span>
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
      <Card class="bg-card/90 px-5 py-2 shadow-sm">
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
