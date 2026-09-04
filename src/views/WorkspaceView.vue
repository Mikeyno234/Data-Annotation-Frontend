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
import { ChevronLeft, ChevronRight, RefreshCw, SlidersHorizontal, ArrowLeft } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const dataItems = ref<DataItem[]>([])
const currentIndex = ref(0)
const activeItem = ref<DataItem | null>(null)
const isLoading = ref(true)
const projectLabels = ref<LabelOption[]>([])
const projectAnnotationType = ref('')
const projectModality = ref('')
const submittedIds = new Set<number>()

const effectiveModality = computed(() => {
  return (projectModality.value || activeItem.value?.modality || 'IMAGE').toUpperCase()
})

async function loadProjectConfig(projectId: number) {
  try {
    const projectRes: any = await projectsApi.getProject(projectId)
    const project = projectRes.data || projectRes
    projectLabels.value = parseLabelConfigXml(project.label_config)
    projectAnnotationType.value = project.annotation_type || ''
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

    const taskIdQuery = route.query.task_id
    if (taskIdQuery) {
      const selected: any = await annotationsApi.getDataItem(Number(taskIdQuery))
      const item = selected.data || selected
      dataItems.value = [item]
      currentIndex.value = 0
      await loadProjectConfig(item.project_id)
      if (item.status === 'UNASSIGNED') {
        const checkout: any = await workflowApi.checkoutTask(item.project_id)
        activeItem.value = checkout.data || checkout
      } else {
        // Resume without re-checking out — item already locked to this user
        activeItem.value = item
      }
      return
    }

    const myId = authStore.user?.id

    // 1. Load own IN_PROGRESS tasks first — always resume without a new checkout
    const [mineRes, queueRes]: any = await Promise.all([
      annotationsApi.getDataItems({ project_id: projectIdQuery, limit: 50, status: 'IN_PROGRESS' }),
      annotationsApi.getDataItems({ project_id: projectIdQuery, limit: 50, status: 'UNASSIGNED' }),
    ])

    const mine = (mineRes.data || []).filter(
      (item: DataItem) => !myId || item.locked_by_id === myId
    )
    const merged = [...mine, ...(queueRes.data || [])]

    if (merged.length > 0) {
      dataItems.value = merged
      if (currentIndex.value >= merged.length) currentIndex.value = 0
      const candidate = dataItems.value[currentIndex.value]
      await loadProjectConfig(candidate.project_id)

      if (candidate.status === 'IN_PROGRESS' && myId && candidate.locked_by_id === myId) {
        // Already checked out by me — resume without a new checkout (draft will restore)
        activeItem.value = candidate
        toast.info('Resuming task', `Continuing task #${candidate.id} — your draft will be restored.`)
      } else {
        try {
          const checkout: any = await workflowApi.checkoutTask(candidate.project_id)
          activeItem.value = checkout.data || checkout
        } catch {
          // Task was claimed by someone else between list and checkout — skip it
          dataItems.value = merged.filter((item: DataItem) => item.id !== candidate.id)
          activeItem.value = dataItems.value[0] || null
          if (activeItem.value) await loadProjectConfig(activeItem.value.project_id)
        }
      }
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
  if (item && item.status === 'IN_PROGRESS' && !submittedIds.has(item.id)) {
    workflowApi.releaseTask(item.id).catch(() => {})
  }
})
</script>

<template>
  <div class="mx-auto flex max-w-7xl flex-col gap-6">
    <!-- Task Queue Navigator Bar -->
    <div class="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border/60 bg-card/95 p-4 shadow-2xs">
      <div class="flex items-center gap-4">
        <div class="flex items-center gap-1.5 bg-muted/60 p-1 rounded-xl border border-border/40">
          <Button variant="ghost" size="icon" class="size-8 rounded-lg" :disabled="currentIndex <= 0" @click="prevTask">
            <ChevronLeft class="size-4" />
          </Button>
          <span class="text-xs text-muted-foreground px-2 font-mono">
            Task <strong class="text-foreground font-bold">{{ dataItems.length ? currentIndex + 1 : 0 }}</strong>/{{ dataItems.length }}
          </span>
          <Button variant="ghost" size="icon" class="size-8 rounded-lg" :disabled="currentIndex >= dataItems.length - 1" @click="nextTask">
            <ChevronRight class="size-4" />
          </Button>
        </div>

        <div class="hidden min-w-0 items-center gap-3 sm:flex pl-2">
          <div class="min-w-0">
            <div class="max-w-[20rem] truncate text-sm font-bold text-foreground tracking-tight">{{ activeItem?.file_name || 'Preparing next task...' }}</div>
            <div class="mt-0.5 flex items-center gap-2 text-[10px] text-muted-foreground font-mono">
              <span>Task #{{ activeItem?.id || '—' }}</span>
              <span v-if="projectAnnotationType">•</span>
              <span v-if="projectAnnotationType" class="max-w-[14rem] truncate font-sans font-semibold text-foreground/80">{{ projectAnnotationType }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <Badge variant="outline" class="font-mono text-[10px] uppercase font-bold">
          {{ effectiveModality }}
        </Badge>
        <Button variant="outline" size="sm" class="h-8 px-2.5 text-xs gap-1.5" @click="fetchTasks">
          <RefreshCw class="size-3.5" :class="{ 'animate-spin': isLoading }" />
          <span class="hidden sm:inline">Refresh</span>
        </Button>
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
        @submitted="handleSubmitted"
      />
      <ImageWorkspace
        v-else-if="effectiveModality === 'IMAGE'"
        :key="`image-${activeItem.id}`"
        :item="activeItem"
        :labels="projectLabels"
        :annotation-type="projectAnnotationType"
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
        @submitted="handleSubmitted"
      />
      <VideoWorkspace
        v-else-if="effectiveModality === 'VIDEO'"
        :key="`video-${activeItem.id}`"
        :item="activeItem"
        :labels="projectLabels"
        :annotation-type="projectAnnotationType"
        @submitted="handleSubmitted"
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
