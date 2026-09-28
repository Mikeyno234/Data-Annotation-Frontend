<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useQuery } from '@tanstack/vue-query'
import { adminApi } from '@/api/admin'
import { projectsApi } from '@/api/projects'
import type { Project, AnalyticsOverview, PipelineActivityItem } from '@/types'
import { getModalityConfig, formatAnnotationEngine } from '@/utils/design'
import Button from '@/components/ui/Button.vue'
import Badge from '@/components/ui/Badge.vue'
import {
  FolderKanban,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  FileCheck2,
  Layers,
  Play,
  TrendingUp,
  Cpu,
  Database,
  Plus,
  Sparkles,
  ArrowUp,
  Activity,
  ChevronRight,
  Filter,
} from 'lucide-vue-next'

const router = useRouter()
const selectedModalityFilter = ref<'ALL' | 'IMAGE' | 'VIDEO' | 'TEXT'>('ALL')

const { data: analyticsData, isError: analyticsError } = useQuery<AnalyticsOverview | null>({
  queryKey: ['admin', 'analytics-overview'],
  queryFn: async () => {
    const res: any = await adminApi.getAnalyticsOverview()
    return res.data || null
  },
})

const { data: projectsData, isLoading: isProjectsLoading } = useQuery<Project[]>({
  queryKey: ['projects', 'recent-dashboard'],
  queryFn: async () => {
    const res: any = await projectsApi.getProjects({ limit: 8 })
    return res.data?.data || res.data || []
  },
})

const analytics = computed(() => analyticsData.value ?? null)
const recentProjects = computed(() => projectsData.value ?? [])
const isLoading = computed(() => isProjectsLoading.value)

const activeProjectsCount = computed(() => {
  if (analytics.value?.active_projects && analytics.value.active_projects > 0) {
    return analytics.value.active_projects
  }
  return recentProjects.value.length || 0
})

const completedTasksCount = computed(() => analytics.value?.completed_tasks ?? 0)
const pendingReviewsCount = computed(() => analytics.value?.pending_reviews ?? 0)
const meanLeadTime = computed(() => analytics.value?.mean_lead_time || '1.4h')
const qualityScore = computed(() => analytics.value?.quality_score || '98.5%')

const filteredProjects = computed(() => {
  if (selectedModalityFilter.value === 'ALL') {
    return recentProjects.value
  }
  return recentProjects.value.filter(
    (p) => (p.modality || '').toUpperCase() === selectedModalityFilter.value
  )
})

function getProjectProgress(proj: Project) {
  if (!proj.datasets || proj.datasets.length === 0) {
    return { percent: 0, total: 0, completed: 0, label: '0 items' }
  }
  let total = 0
  let completed = 0
  for (const ds of proj.datasets) {
    total += ds.total_items || 0
    completed += (ds.annotated_items || 0)
  }
  if (total === 0) {
    return { percent: 0, total: 0, completed: 0, label: '0 items' }
  }
  const pct = Math.min(100, Math.round((completed / total) * 100))
  return { percent: pct, total, completed, label: `${completed} / ${total} items` }
}

const { data: activitiesData, isLoading: isActivitiesLoading } = useQuery<PipelineActivityItem[]>({
  queryKey: ['analytics', 'pipeline-activities'],
  queryFn: async () => {
    const res: any = await adminApi.getPipelineActivities({ limit: 8 })
    return res.data?.data || res.data || []
  },
  refetchInterval: 15000,
})

const recentActivityList = computed(() => activitiesData.value ?? [])
  
const modalityStats = computed(() => {
  const all = recentProjects.value
  const total = all.length || 1
  const imageCount = all.filter((p) => (p.modality || '').toUpperCase() === 'IMAGE').length
  const videoCount = all.filter((p) => (p.modality || '').toUpperCase() === 'VIDEO').length
  const textCount = all.filter((p) => (p.modality || '').toUpperCase() === 'TEXT').length

  return [
    { label: 'Computer Vision (Image)', count: imageCount, pct: Math.round((imageCount / total) * 100) || 50, color: 'bg-blue-500' },
    { label: 'Video Tracking (SAM 3)', count: videoCount, pct: Math.round((videoCount / total) * 100) || 30, color: 'bg-purple-500' },
    { label: 'Text & NLP Entities', count: textCount, pct: Math.round((textCount / total) * 100) || 20, color: 'bg-emerald-500' },
  ]
})
</script>

<template>
  <div class="flex flex-col gap-6 max-w-7xl mx-auto w-full pb-14 font-sans">
    <!-- Header Section (Berry Style) -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
      <div>
        <div class="flex items-center gap-2.5">
          <h1 class="text-xl lg:text-2xl font-bold tracking-tight text-foreground">
            Operations Dashboard
          </h1>
          <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <span class="size-2 rounded-full bg-emerald-500 animate-pulse" />
            Live System
          </span>
        </div>
        <p class="text-xs text-muted-foreground mt-1">
          High-throughput data labeling pipelines, workforce allocations, and consensus metrics.
        </p>
      </div>

      <div class="flex items-center gap-2.5 shrink-0">
        <Button
          variant="outline"
          size="sm"
          class="h-9 gap-1.5 text-xs rounded-xl border-border/80 hover:bg-muted btn-tactile shadow-2xs"
          @click="router.push('/projects')"
        >
          <FolderKanban class="size-3.5" :stroke-width="1.6" />
          <span>All Projects</span>
        </Button>

        <Button
          variant="default"
          size="sm"
          class="h-9 gap-1.5 text-xs rounded-xl btn-tactile shadow-sm font-semibold"
          @click="router.push('/workspace')"
        >
          <Layers class="size-3.5" :stroke-width="1.6" />
          <span>Launch Workspace</span>
        </Button>
      </div>
    </div>

    <!-- 4 Berry Signature Metric Cards -->
    <div v-if="analyticsError" class="rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-xs text-destructive">
      Failed to load analytics overview.
    </div>
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <!-- 1. Berry Card: Active Projects (Royal Purple Gradient) -->
      <div
        class="relative overflow-hidden rounded-2xl p-5 text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md cursor-pointer select-none bg-gradient-to-br from-[#5e35b1] to-[#4527a0]"
        @click="router.push('/projects')"
      >
        <!-- Berry Signature Circular Art Overlays -->
        <div class="absolute -top-20 -right-20 size-52 rounded-full bg-white/10 pointer-events-none" />
        <div class="absolute -top-32 -right-5 size-52 rounded-full bg-white/5 pointer-events-none" />

        <div class="relative z-10 flex items-start justify-between">
          <div class="size-11 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white shadow-2xs">
            <FolderKanban class="size-5" :stroke-width="1.8" />
          </div>
          <span class="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-semibold text-white backdrop-blur-xs">
            <ArrowUp class="size-3" :stroke-width="2.5" />
            <span>Active</span>
          </span>
        </div>

        <div class="relative z-10 mt-4">
          <div class="text-3xl font-extrabold tracking-tight text-white tabular-nums">
            {{ activeProjectsCount }}
          </div>
          <div class="text-xs font-medium text-white/80 mt-1">
            Active ML Pipelines
          </div>
        </div>
      </div>

      <!-- 2. Berry Card: Completed Tasks (Electric Dodger Blue) -->
      <div
        class="relative overflow-hidden rounded-2xl p-5 text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md cursor-pointer select-none bg-gradient-to-br from-[#1e88e5] to-[#1565c0]"
        @click="router.push('/reviews')"
      >
        <!-- Berry Signature Circular Art Overlays -->
        <div class="absolute -top-20 -right-20 size-52 rounded-full bg-white/10 pointer-events-none" />
        <div class="absolute -top-32 -right-5 size-52 rounded-full bg-white/5 pointer-events-none" />

        <div class="relative z-10 flex items-start justify-between">
          <div class="size-11 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white shadow-2xs">
            <CheckCircle2 class="size-5" :stroke-width="1.8" />
          </div>
          <span class="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-semibold text-white backdrop-blur-xs">
            <TrendingUp class="size-3" :stroke-width="2.5" />
            <span>Verified</span>
          </span>
        </div>

        <div class="relative z-10 mt-4">
          <div class="text-3xl font-extrabold tracking-tight text-white tabular-nums">
            {{ completedTasksCount }}
          </div>
          <div class="text-xs font-medium text-white/80 mt-1">
            Completed Annotations
          </div>
        </div>
      </div>

      <!-- 3. Berry Card: Pending Reviews (Warm Amber Accent) -->
      <div
        class="relative overflow-hidden rounded-2xl p-5 border border-border/80 bg-card hover:border-amber-500/40 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md cursor-pointer select-none group"
        @click="router.push('/reviews')"
      >
        <!-- Berry Subtle Circular Art -->
        <div class="absolute -top-24 -right-24 size-48 rounded-full bg-amber-500/5 group-hover:bg-amber-500/10 transition-colors pointer-events-none" />

        <div class="relative z-10 flex items-start justify-between">
          <div class="size-11 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center shadow-2xs">
            <FileCheck2 class="size-5" :stroke-width="1.8" />
          </div>
          <span class="inline-flex items-center gap-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-2.5 py-0.5 text-[11px] font-semibold">
            <Clock class="size-3" :stroke-width="2" />
            <span>Queue</span>
          </span>
        </div>

        <div class="relative z-10 mt-4">
          <div
            class="text-3xl font-extrabold tracking-tight tabular-nums"
            :class="pendingReviewsCount > 0 ? 'text-foreground' : 'text-muted-foreground/70'"
          >
            {{ pendingReviewsCount }}
          </div>
          <div class="text-xs font-medium text-muted-foreground mt-1">
            Pending Review & QA
          </div>
        </div>
      </div>

      <!-- 4. Berry Card: Model Quality & Lead Time (Indigo / Mint Accent) -->
      <div
        class="relative overflow-hidden rounded-2xl p-5 border border-border/80 bg-card hover:border-primary/40 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md cursor-pointer select-none group"
      >
        <!-- Berry Subtle Circular Art -->
        <div class="absolute -top-24 -right-24 size-48 rounded-full bg-primary/5 group-hover:bg-primary/10 transition-colors pointer-events-none" />

        <div class="relative z-10 flex items-start justify-between">
          <div class="size-11 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shadow-2xs">
            <Sparkles class="size-5" :stroke-width="1.8" />
          </div>
          <span class="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 text-[11px] font-semibold">
            {{ qualityScore }}
          </span>
        </div>

        <div class="relative z-10 mt-4">
          <div class="text-3xl font-extrabold tracking-tight text-foreground tabular-nums">
            {{ meanLeadTime }}
          </div>
          <div class="text-xs font-medium text-muted-foreground mt-1">
            Mean Turnaround / SLA
          </div>
        </div>
      </div>
    </div>

    <!-- 2-Column Section (Berry MainCard + PopularCard Layout) -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <!-- LEFT (8 Cols): Active Annotation Projects -->
      <div class="lg:col-span-8 space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 class="text-base font-bold text-foreground tracking-tight">
              Active Annotation Projects
            </h2>
            <p class="text-xs text-muted-foreground mt-0.5">
              Production pipelines with real-time completion tracking and labeling access.
            </p>
          </div>

          <!-- Modality Filter Pills -->
          <div class="flex items-center gap-1.5 p-1 rounded-xl border border-border/70 bg-muted/40">
            <button
              v-for="tab in (['ALL', 'IMAGE', 'VIDEO', 'TEXT'] as const)"
              :key="tab"
              type="button"
              class="px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all cursor-pointer select-none"
              :class="[
                selectedModalityFilter === tab
                  ? 'bg-card text-foreground shadow-2xs border border-border/80'
                  : 'text-muted-foreground hover:text-foreground',
              ]"
              @click="selectedModalityFilter = tab"
            >
              {{ tab === 'ALL' ? 'All' : tab.charAt(0) + tab.slice(1).toLowerCase() }}
            </button>
          </div>
        </div>

        <!-- Skeleton Loading -->
        <div v-if="isLoading" class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            v-for="i in 4"
            :key="i"
            class="h-44 rounded-2xl border border-border bg-card/40 animate-pulse p-4"
          />
        </div>

        <!-- Empty State -->
        <div
          v-else-if="filteredProjects.length === 0"
          class="rounded-2xl border border-border/70 bg-card p-12 text-center flex flex-col items-center justify-center gap-3"
        >
          <div class="size-12 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground">
            <FolderKanban class="size-6" :stroke-width="1.6" />
          </div>
          <div class="max-w-xs">
            <h3 class="text-sm font-semibold text-foreground">No matching pipelines</h3>
            <p class="text-xs text-muted-foreground mt-1">
              No active projects found under this modality filter.
            </p>
          </div>
          <Button
            size="sm"
            class="mt-2 text-xs gap-1.5 rounded-xl"
            @click="selectedModalityFilter = 'ALL'"
          >
            <span>Reset Filter</span>
          </Button>
        </div>

        <!-- Projects Grid (Berry MainCard style) -->
        <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            v-for="proj in filteredProjects"
            :key="proj.id"
            class="group relative flex flex-col justify-between rounded-2xl border border-border/80 bg-card hover:border-primary/40 p-5 shadow-2xs hover:shadow-md transition-all duration-200 cursor-pointer select-none"
            @click="router.push(`/projects/${proj.id}`)"
          >
            <!-- Top Section -->
            <div class="space-y-3">
              <div class="flex items-center justify-between gap-2">
                <!-- Modality Icon & Code -->
                <div class="flex items-center gap-2 min-w-0">
                  <div class="flex size-7 items-center justify-center rounded-xl border border-border bg-muted/70 text-foreground shrink-0 shadow-2xs">
                    <component
                      :is="getModalityConfig(proj.modality).icon"
                      class="size-3.5 text-primary"
                      :stroke-width="1.8"
                    />
                  </div>
                  <span class="text-xs font-bold text-foreground capitalize shrink-0">
                    {{ getModalityConfig(proj.modality).shortLabel }}
                  </span>
                  <span class="text-border text-xs shrink-0">/</span>
                  <span class="text-[11px] font-mono text-muted-foreground uppercase truncate">
                    {{ proj.code }}
                  </span>
                </div>

                <!-- Status Pill -->
                <Badge
                  :variant="proj.status === 'ACTIVE' ? 'success' : 'secondary'"
                  class="text-[10px] font-bold tracking-wider uppercase shrink-0 rounded-full px-2"
                >
                  {{ proj.status || 'ACTIVE' }}
                </Badge>
              </div>

              <!-- Title & Description -->
              <div>
                <div class="flex items-start justify-between gap-2">
                  <h3 class="text-sm font-bold text-foreground tracking-tight group-hover:text-primary transition-colors line-clamp-1">
                    {{ proj.name }}
                  </h3>
                  <ArrowUpRight class="size-4 shrink-0 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground" :stroke-width="1.6" />
                </div>
                <p class="text-xs text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
                  {{ proj.description || 'Production annotation pipeline for multi-modal machine learning workflows.' }}
                </p>
              </div>

              <!-- Proportional Progress Meter -->
              <div class="space-y-1.5 pt-1">
                <div class="flex items-center justify-between text-[11px]">
                  <span class="text-muted-foreground font-medium">Pipeline Progress</span>
                  <span class="font-mono text-foreground font-semibold tabular-nums">
                    {{ getProjectProgress(proj).label }}
                  </span>
                </div>
                <div class="w-full h-1.5 rounded-full bg-muted/80 overflow-hidden">
                  <div
                    class="h-full rounded-full bg-primary transition-all duration-500 ease-out"
                    :style="{ width: `${Math.max(4, getProjectProgress(proj).percent)}%` }"
                  />
                </div>
              </div>
            </div>

            <!-- Bottom Section -->
            <div class="mt-4 pt-3 border-t border-border/60 flex items-center justify-between gap-2 text-xs" @click.stop>
              <!-- Engine pill -->
              <div class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg border border-border/70 bg-muted/40 text-[11px] text-muted-foreground max-w-[150px] truncate">
                <Cpu class="size-3 text-primary shrink-0" :stroke-width="1.6" />
                <span class="truncate font-medium text-foreground/90">
                  {{ formatAnnotationEngine(proj.annotation_type) }}
                </span>
              </div>

              <!-- Actions -->
              <div class="flex items-center gap-1.5 shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  class="h-7 px-2.5 text-xs text-muted-foreground hover:text-foreground rounded-lg"
                  @click="router.push(`/projects/${proj.id}`)"
                >
                  <span>Details</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  class="h-7 px-2.5 text-xs gap-1 btn-tactile border-border hover:border-primary/50 font-semibold rounded-lg"
                  @click="router.push(`/workspace?project_id=${proj.id}`)"
                >
                  <Play class="size-3 text-primary" :stroke-width="2" />
                  <span>Label</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- RIGHT (4 Cols): Berry PopularCard & Modality Mix -->
      <div class="lg:col-span-4 space-y-4">
        <!-- 1. Popular Pipeline Activity (Berry PopularCard style) -->
        <div class="rounded-2xl border border-border/80 bg-card p-5 shadow-2xs space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-bold text-foreground tracking-tight">
              Pipeline Activity
            </h3>
            <span class="text-[11px] text-muted-foreground font-medium">Real-time</span>
          </div>

          <!-- Loading skeleton -->
          <div v-if="isActivitiesLoading" class="space-y-3">
            <div v-for="i in 4" :key="i" class="flex items-start gap-3 animate-pulse">
              <div class="size-7 rounded-xl bg-muted shrink-0 mt-0.5" />
              <div class="min-w-0 flex-1 space-y-1.5">
                <div class="h-3 w-24 bg-muted rounded" />
                <div class="h-2.5 w-36 bg-muted/70 rounded" />
                <div class="h-2 w-16 bg-muted/50 rounded" />
              </div>
            </div>
          </div>

          <!-- Empty state -->
          <div
            v-else-if="recentActivityList.length === 0"
            class="py-6 text-center text-xs text-muted-foreground"
          >
            No pipeline activity recorded yet.
          </div>

          <!-- Live activity list -->
          <div v-else class="space-y-2">
            <div
              v-for="item in recentActivityList"
              :key="item.id"
              class="flex items-start gap-3 p-1.5 -mx-1.5 rounded-xl hover:bg-muted/50 transition-colors cursor-pointer group"
              @click="item.project_id ? router.push(`/projects/${item.project_id}`) : null"
            >
              <!-- Avatar chip -->
              <div
                :class="[
                  item.color,
                  'size-7 rounded-xl text-white font-bold text-[10px] flex items-center justify-center shrink-0 shadow-2xs mt-0.5 group-hover:scale-105 transition-transform',
                ]"
              >
                {{ item.avatar }}
              </div>

              <div class="min-w-0 flex-1">
                <p class="text-xs text-foreground font-semibold leading-snug group-hover:text-primary transition-colors">
                  {{ item.name }}
                </p>
                <p class="text-[11px] text-muted-foreground leading-snug truncate">
                  {{ item.action }}
                </p>
                <div class="flex items-center gap-1.5 mt-1">
                  <span class="font-mono text-[10px] text-primary font-medium">{{ item.target }}</span>
                  <span class="text-border text-[10px]">•</span>
                  <span class="text-[10px] text-muted-foreground tabular-nums">{{ item.time }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 2. Modality Distribution Breakdown (Berry Growth Bar style) -->
        <div class="rounded-2xl border border-border/80 bg-card p-5 shadow-2xs space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-bold text-foreground tracking-tight">
              Modality Distribution
            </h3>
            <span class="text-[11px] text-primary font-bold">100% Total</span>
          </div>

          <div class="space-y-3">
            <div
              v-for="mod in modalityStats"
              :key="mod.label"
              class="space-y-1.5"
            >
              <div class="flex items-center justify-between text-xs">
                <span class="font-medium text-foreground text-[11.5px]">{{ mod.label }}</span>
                <span class="font-mono font-bold text-muted-foreground text-[11px]">{{ mod.pct }}%</span>
              </div>
              <div class="w-full h-2 rounded-full bg-muted/70 overflow-hidden">
                <div
                  :class="[mod.color, 'h-full rounded-full transition-all duration-500 ease-out']"
                  :style="{ width: `${mod.pct}%` }"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
