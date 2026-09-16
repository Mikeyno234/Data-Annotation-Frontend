<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { annotationsApi } from '@/api/annotations'
import { workflowApi } from '@/api/workflow'
import type { DataItem } from '@/types'
import type { LabelOption } from '@/types'
import { projectsApi } from '@/api/projects'
import { toast } from '@/utils/toast'
import { parseLabelConfigXml } from '@/utils/annotation'
import AudioWorkspace from '@/components/workspace/AudioWorkspace.vue'
import ImageWorkspace from '@/components/workspace/ImageWorkspace.vue'
import TextWorkspace from '@/components/workspace/TextWorkspace.vue'
import VideoWorkspace from '@/components/workspace/VideoWorkspace.vue'
import Button from '@/components/ui/Button.vue'
import Badge from '@/components/ui/Badge.vue'
import { ChevronLeft, ChevronRight, RefreshCw, SlidersHorizontal, ArrowLeft, RotateCcw } from 'lucide-vue-next'
import { getModalityConfig } from '@/utils/design'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const dataItems = ref<DataItem[]>([])
const currentIndex = ref(0)
const activeItem = ref<DataItem | null>(null)
const isLoading = ref(true)
const projectLabels = ref<LabelOption[]>([])
const projectAnnotationType = ref('')
const projectToolType = ref('')
const projectModality = ref('')
const submittedIds = new Set<number>()

const effectiveModality = computed(() => {
  return (projectModality.value || activeItem.value?.modality || 'IMAGE').toUpperCase()
})

const modalityMeta = computed(() => getModalityConfig(effectiveModality.value))

async function loadProjectConfig(projectId: number) {
  try {
    const projectRes: any = await projectsApi.getProject(projectId)
    const project = projectRes.data || projectRes
    projectLabels.value = parseLabelConfigXml(project.label_config)
    projectAnnotationType.value = project.annotation_type || ''
    projectToolType.value = project.tool_type || ''
    projectModality.value = project.modality || ''
  } catch (e) {
    console.error('Failed to load project config', e)
  }
}

async function fetchTasks() {
  isLoading.value = true
  try {
    const projectIdQuery = route.query.project_id ? Number(route.query.project_id) : undefined
    if (projectIdQuery) {
      await loadProjectConfig(projectIdQuery)
    }

    const taskIdQuery = route.query.task_id ? Number(route.query.task_id) : undefined

    const myId = authStore.user?.id

    // 1. Load project tasks queue (or task by ID).
    //    REWORK items are fetched alongside IN_PROGRESS/UNASSIGNED because the
    //    backend leases a rejected item back to its original annotator
    //    (Backend/internal/annotation/repository CheckoutTask) rather than
    //    dropping it into the shared pool; the annotator must see it here to
    //    close the review feedback loop.
    const [mineRes, reworkRes, queueRes, allRes]: any = await Promise.all([
      annotationsApi.getDataItems({ project_id: projectIdQuery, limit: 100, status: 'IN_PROGRESS' }),
      annotationsApi.getDataItems({ project_id: projectIdQuery, limit: 100, status: 'REWORK' }),
      annotationsApi.getDataItems({ project_id: projectIdQuery, limit: 100, status: 'UNASSIGNED' }),
      taskIdQuery ? annotationsApi.getDataItems({ project_id: projectIdQuery, limit: 100 }) : Promise.resolve({ data: [] }),
    ])

    const mine = (mineRes.data || []).filter(
      (item: DataItem) => !myId || item.locked_by_id === myId
    )

    // Rework leased to me surfaces first (closing feedback loops takes
    // priority); rework still unclaimed joins the shared queue like UNASSIGNED.
    const myRework = (reworkRes.data || []).filter(
      (item: DataItem) => myId && item.locked_by_id === myId
    )
    const unclaimedRework = (reworkRes.data || []).filter(
      (item: DataItem) => !myId || item.locked_by_id !== myId
    )

    // Build the active working queue
    let merged: DataItem[] = [...myRework, ...mine, ...unclaimedRework, ...(queueRes.data || [])]

    // If opening a specific task ID (e.g. from Project Table), ensure it's in dataItems and find its index
    if (taskIdQuery) {
      const allItems: DataItem[] = allRes.data || []
      const foundInAll = allItems.find((i) => i.id === taskIdQuery)
      if (foundInAll && !merged.some((i) => i.id === taskIdQuery)) {
        merged.unshift(foundInAll)
      } else if (!foundInAll) {
        try {
          const singleRes: any = await annotationsApi.getDataItem(taskIdQuery)
          const single = singleRes.data || singleRes
          if (single && !merged.some((i) => i.id === taskIdQuery)) {
            merged.unshift(single)
          }
        } catch {}
      }
    }

    if (merged.length > 0) {
      dataItems.value = merged
      if (taskIdQuery) {
        const foundIdx = merged.findIndex((i) => i.id === taskIdQuery)
        currentIndex.value = foundIdx >= 0 ? foundIdx : 0
      } else if (currentIndex.value >= merged.length) {
        currentIndex.value = 0
      }
      const candidate = dataItems.value[currentIndex.value]
      await loadProjectConfig(candidate.project_id)

      const isMine = myId && candidate.locked_by_id === myId

      if ((candidate.status === 'IN_PROGRESS' || candidate.status === 'REWORK') && isMine) {
        activeItem.value = candidate
        if (candidate.status === 'REWORK') {
          toast.info(
            'Task returned for rework',
            candidate.last_rejection_reason || 'A reviewer sent this task back. Your previous work has been restored as a draft.'
          )
        } else {
          toast.info('Resuming task', `Continuing task #${candidate.id}. Your draft will be restored.`)
        }
      } else if (candidate.status === 'UNASSIGNED' || (candidate.status === 'REWORK' && !candidate.locked_by_id)) {
        try {
          const checkout: any = await workflowApi.checkoutTask(candidate.project_id)
          activeItem.value = checkout.data || checkout
        } catch {
          activeItem.value = candidate
        }
      } else {
        // ANNOTATED, QA_PENDING, COMPLETED, ESCALATED, EXCLUDED, or leased to
        // another annotator: nothing left for this user to do but view it.
        activeItem.value = candidate
      }
      return
    } else {
      dataItems.value = []
      activeItem.value = null
    }
  } catch (err: any) {
    toast.error('Failed to load task queue', err?.message)
  } finally {
    isLoading.value = false
  }
}

watch(
  () => [route.query.task_id, route.query.project_id],
  () => {
    fetchTasks()
  }
)


function prevTask() {
  if (currentIndex.value > 0) {
    currentIndex.value--
    activeItem.value = dataItems.value[currentIndex.value]
    loadProjectConfig(activeItem.value.project_id)
  }
}

function nextTask() {
  if (currentIndex.value < dataItems.value.length - 1) {
    currentIndex.value++
    activeItem.value = dataItems.value[currentIndex.value]
    loadProjectConfig(activeItem.value.project_id)
  }
}

function handleSubmitted() {
  toast.success('Task finished', 'Advancing to next task in queue')
  // Submitted tasks are ANNOTATED server-side; never release their lock on unmount
  submittedIds.add(activeItem.value?.id ?? -1)
  if (currentIndex.value < dataItems.value.length - 1) {
    nextTask()
  } else {
    fetchTasks()
  }
}

onMounted(() => {
  fetchTasks()
})

// Release the lock when leaving the workspace without submitting,
// so the task returns to the queue instead of being stuck for 15 minutes.
onBeforeUnmount(() => {
  const item = activeItem.value
  const isActiveLease = item?.status === 'IN_PROGRESS' || item?.status === 'REWORK'
  if (item && isActiveLease && !submittedIds.has(item.id)) {
    workflowApi.releaseTask(item.id).catch(() => {})
  }
})
</script>

<template>
  <div class="mx-auto flex max-w-7xl flex-col gap-5">
    <!-- Task Queue Navigator Bar -->
    <div class="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card p-3 shadow-2xs">
      <div class="flex items-center gap-3">
        <div class="flex items-center gap-1 bg-muted/60 p-0.5 rounded-md border border-border">
          <Button variant="ghost" size="icon" class="size-7 rounded" :disabled="currentIndex <= 0" @click="prevTask">
            <ChevronLeft class="size-3.5" :stroke-width="1.6" />
          </Button>
          <span class="text-[11px] text-muted-foreground px-1.5 tabular-nums font-medium">
            Task <strong class="text-foreground font-semibold">{{ dataItems.length ? currentIndex + 1 : 0 }}</strong>/{{ dataItems.length }}
          </span>
          <Button variant="ghost" size="icon" class="size-7 rounded" :disabled="currentIndex >= dataItems.length - 1" @click="nextTask">
            <ChevronRight class="size-3.5" :stroke-width="1.6" />
          </Button>
        </div>

        <div class="hidden min-w-0 items-center gap-3 sm:flex pl-1">
          <div class="min-w-0">
            <div class="max-w-[22rem] truncate text-xs font-semibold text-foreground tracking-tight">{{ activeItem?.file_name || 'Preparing next task...' }}</div>
            <div class="mt-0.5 flex items-center gap-2 text-[10px] text-muted-foreground">
              <span class="tabular-nums font-medium">#{{ activeItem?.id || '-' }}</span>
              <span v-if="projectAnnotationType" class="text-border/70">/</span>
              <span v-if="projectAnnotationType" class="max-w-[16rem] truncate font-medium text-foreground/80">{{ projectAnnotationType }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <span
          class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border shadow-2xs"
          :class="modalityMeta.badgeClass"
        >
          <component :is="modalityMeta.icon" class="size-3.5" :stroke-width="1.75" />
          <span>{{ modalityMeta.shortLabel }}</span>
        </span>
        <Button variant="outline" size="sm" class="h-7 px-2 text-[11px] gap-1.5 font-medium" @click="fetchTasks">
          <RefreshCw class="size-3" :stroke-width="1.6" :class="{ 'animate-spin': isLoading }" />
          <span class="hidden sm:inline">Refresh</span>
        </Button>
      </div>
    </div>

    <!-- Rework Feedback Banner: surfaces the reviewer/QA rejection reason so
         the annotator knows what to fix without leaving the workspace. -->
    <div
      v-if="activeItem?.status === 'REWORK'"
      class="flex items-start gap-2.5 rounded-lg border border-orange-500/25 bg-orange-500/10 p-3 text-orange-700 dark:text-orange-400"
    >
      <RotateCcw class="mt-0.5 size-4 shrink-0" :stroke-width="1.8" />
      <div class="min-w-0">
        <p class="text-xs font-semibold">Returned for rework</p>
        <p class="mt-0.5 text-xs leading-relaxed text-orange-700/90 dark:text-orange-400/90">
          {{ activeItem.last_rejection_reason || 'A reviewer sent this task back without a specific comment.' }}
        </p>
      </div>
    </div>

    <!-- Active Modality Workspace Switcher -->
    <div v-if="isLoading" class="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_16rem]">
      <div class="h-72 animate-pulse rounded-2xl bg-card/60 border border-border/40"></div>
      <div class="hidden h-72 animate-pulse rounded-2xl bg-card/40 border border-border/40 lg:block"></div>
    </div>

    <div v-else-if="activeItem">
      <AudioWorkspace
        v-if="effectiveModality === 'AUDIO'"
        :key="`audio-${activeItem.id}`"
        :item="activeItem"
        :labels="projectLabels"
        :annotation-type="projectAnnotationType"
        :has-next="currentIndex < dataItems.length - 1"
        :has-prev="currentIndex > 0"
        @submitted="handleSubmitted"
        @next="nextTask"
        @prev="prevTask"
      />
      <ImageWorkspace
        v-else-if="effectiveModality === 'IMAGE'"
        :key="`image-${activeItem.id}`"
        :item="activeItem"
        :labels="projectLabels"
        :annotation-type="projectAnnotationType"
        :tool-type="projectToolType"
        :has-next="currentIndex < dataItems.length - 1"
        :has-prev="currentIndex > 0"
        @submitted="handleSubmitted"
        @next="nextTask"
        @prev="prevTask"
      />
      <TextWorkspace
        v-else-if="effectiveModality === 'TEXT'"
        :key="`text-${activeItem.id}`"
        :item="activeItem"
        :labels="projectLabels"
        :annotation-type="projectAnnotationType"
        :tool-type="projectToolType"
        :has-next="currentIndex < dataItems.length - 1"
        :has-prev="currentIndex > 0"
        @submitted="handleSubmitted"
        @next="nextTask"
        @prev="prevTask"
      />
      <VideoWorkspace
        v-else-if="effectiveModality === 'VIDEO'"
        :key="`video-${activeItem.id}`"
        :item="activeItem"
        :labels="projectLabels"
        :annotation-type="projectAnnotationType"
        :tool-type="projectToolType"
        :has-next="currentIndex < dataItems.length - 1"
        :has-prev="currentIndex > 0"
        @submitted="handleSubmitted"
        @next="nextTask"
        @prev="prevTask"
      />
      <div v-else class="rounded-2xl border border-border/60 bg-card/90 p-16 text-center shadow-2xs">
        <h2 class="text-base font-bold text-foreground">No editor available</h2>
        <p class="mt-2 text-xs text-muted-foreground">This modality ({{ effectiveModality }}) is configured in the backend but does not have a frontend editor yet.</p>
      </div>
    </div>

    <div v-else class="rounded-2xl border border-border/60 bg-card/90 px-6 py-20 text-center shadow-2xs">
      <div class="mx-auto flex size-14 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground border border-border/40">
        <SlidersHorizontal class="size-6" />
      </div>
      <h2 class="mt-4 text-base font-bold text-foreground tracking-tight">No Tasks in Queue</h2>
      <p class="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-muted-foreground">
        All tasks in this queue are completed or locked by other annotators. Select another project or refresh to check for new batches.
      </p>
      <div class="mt-6 flex items-center justify-center gap-3">
        <Button variant="outline" size="sm" class="gap-1.5" @click="fetchTasks">
          <RefreshCw class="size-3.5" />
          <span>Refresh Queue</span>
        </Button>
        <Button variant="default" size="sm" @click="router.push('/projects')">
          Browse Projects
        </Button>
      </div>
    </div>
  </div>
</template>
