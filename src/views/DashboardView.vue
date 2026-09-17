<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useQuery } from '@tanstack/vue-query'
import { adminApi } from '@/api/admin'
import { projectsApi } from '@/api/projects'
import type { Project, AnalyticsOverview } from '@/types'
import { getModalityConfig } from '@/utils/design'
import Card from '@/components/ui/Card.vue'
import CardContent from '@/components/ui/CardContent.vue'
import Badge from '@/components/ui/Badge.vue'
import Button from '@/components/ui/Button.vue'
import {
  FolderKanban,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  FileCheck2,
  Layers,
  Play,
  TrendingUp,
} from 'lucide-vue-next'

const router = useRouter()

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
    const res: any = await projectsApi.getProjects({ limit: 4 })
    return res.data?.data || res.data || []
  },
})

const analytics = computed(() => analyticsData.value ?? null)
const recentProjects = computed(() => projectsData.value ?? [])
const isLoading = computed(() => isProjectsLoading.value)
</script>

<template>
  <div class="flex flex-col gap-6 max-w-7xl mx-auto w-full pb-10">
    <!-- Executive Title & Shortcuts (TailAdmin Header) -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-xl font-bold tracking-tight text-foreground font-sans">
          Operations Dashboard
        </h1>
        <p class="text-xs text-muted-foreground mt-0.5 font-sans">
          High-throughput data labeling pipelines, workforce allocations, and consensus metrics.
        </p>
      </div>

      <div class="flex items-center gap-2.5">
        <Button
          variant="outline"
          size="sm"
          class="h-8 gap-1.5 text-xs rounded-lg"
          @click="router.push('/projects')"
        >
          <FolderKanban class="size-3.5" :stroke-width="1.6" />
          <span>All Projects</span>
        </Button>

        <Button
          variant="default"
          size="sm"
          class="h-8 gap-1.5 text-xs rounded-lg"
          @click="router.push('/workspace')"
        >
          <Layers class="size-3.5" :stroke-width="1.6" />
          <span>Launch Workspace</span>
        </Button>
      </div>
    </div>

    <!-- 4 Bento KPI Metric Cards (TailAdmin eCommerce style with Coss UI Card Frame) -->
    <div v-if="analyticsError" class="rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-xs text-destructive">
      Failed to load analytics overview.
    </div>
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <!-- Active Projects -->
      <Card class="hover:border-border transition-all">
        <CardContent class="p-4 flex items-center justify-between">
          <div class="space-y-1">
            <span class="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Active Projects
            </span>
            <div class="text-2xl font-bold text-foreground tracking-tight tabular-nums">
              {{ analytics?.active_projects ?? '0' }}
            </div>
            <div class="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
              <TrendingUp class="size-3" :stroke-width="2" />
              <span>Pipelines Online</span>
            </div>
          </div>
          <div class="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
            <FolderKanban class="size-5" :stroke-width="1.6" />
          </div>
        </CardContent>
      </Card>

      <!-- Completed Tasks -->
      <Card class="hover:border-border transition-all">
        <CardContent class="p-4 flex items-center justify-between">
          <div class="space-y-1">
            <span class="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Completed Tasks
            </span>
            <div class="text-2xl font-bold text-foreground tracking-tight tabular-nums">
              {{ analytics?.completed_tasks ?? '0' }}
            </div>
            <div class="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
              <CheckCircle2 class="size-3" :stroke-width="2" />
              <span>Verified Annotations</span>
            </div>
          </div>
          <div class="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 class="size-5" :stroke-width="1.6" />
          </div>
        </CardContent>
      </Card>

      <!-- Pending Reviews -->
      <Card class="hover:border-border transition-all">
        <CardContent class="p-4 flex items-center justify-between">
          <div class="space-y-1">
            <span class="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Pending Reviews
            </span>
            <div class="text-2xl font-bold text-foreground tracking-tight tabular-nums">
              {{ analytics?.pending_reviews ?? '0' }}
            </div>
            <div class="flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400 font-medium">
              <Clock class="size-3" :stroke-width="2" />
              <span>Queue Awaiting Consensus</span>
            </div>
          </div>
          <div class="flex size-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <FileCheck2 class="size-5" :stroke-width="1.6" />
          </div>
        </CardContent>
      </Card>

      <!-- Mean Lead Time & Quality -->
      <Card class="hover:border-border transition-all">
        <CardContent class="p-4 flex items-center justify-between">
          <div class="space-y-1">
            <span class="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Mean Lead Time
            </span>
            <div class="text-2xl font-bold text-foreground tracking-tight tabular-nums">
              {{ analytics?.mean_lead_time ?? 'N/A' }}
            </div>
            <div class="text-[11px] text-muted-foreground">
              Score: <strong class="text-foreground font-semibold tabular-nums">{{ analytics?.quality_score ?? 'N/A' }}</strong>
            </div>
          </div>
          <div class="flex size-10 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
            <Clock class="size-5" :stroke-width="1.6" />
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Active Projects Section (TailAdmin eCommerce style table & cards) -->
    <div class="space-y-3 mt-2">
      <div class="flex items-center justify-between">
        <h2 class="text-sm font-semibold text-foreground tracking-tight">
          Active Annotation Projects
        </h2>
        <Button
          variant="ghost"
          size="sm"
          class="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground"
          @click="router.push('/projects')"
        >
          <span>View All</span>
          <ArrowUpRight class="size-3.5" :stroke-width="1.6" />
        </Button>
      </div>

      <!-- Empty State -->
      <div
        v-if="!isLoading && recentProjects.length === 0"
        class="rounded-2xl border border-border/70 bg-card p-10 text-center text-xs text-muted-foreground"
      >
        No active projects found.
      </div>

      <!-- Projects Grid (TailAdmin 2-column balanced bento cards) -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card
          v-for="proj in recentProjects"
          :key="proj.id"
          class="hover:border-border transition-all group cursor-pointer"
          @click="router.push(`/projects/${proj.id}`)"
        >
          <CardContent class="p-4 space-y-3">
            <div class="flex items-start justify-between gap-3">
              <div class="flex items-center gap-3 min-w-0">
                <div class="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground border border-border">
                  <component
                    :is="getModalityConfig(proj.modality).icon"
                    class="size-4.5 text-primary"
                    :stroke-width="1.6"
                  />
                </div>
                <div class="min-w-0">
                  <h3 class="font-semibold text-xs text-foreground group-hover:text-primary transition-colors truncate">
                    {{ proj.name }}
                  </h3>
                  <div class="flex items-center gap-2 mt-0.5">
                    <span class="font-mono text-[10px] uppercase text-muted-foreground">
                      {{ proj.code }}
                    </span>
                    <span v-if="proj.organization?.name" class="text-[10px] text-muted-foreground/70 truncate">
                      • {{ proj.organization.name }}
                    </span>
                  </div>
                </div>
              </div>

              <Badge :variant="proj.status === 'ACTIVE' ? 'success' : 'secondary'">
                {{ proj.status || 'ACTIVE' }}
              </Badge>
            </div>

            <div class="flex items-center justify-between pt-2 border-t border-border/50 text-xs">
              <span class="text-muted-foreground text-[11px]">
                Engine: <strong class="text-foreground/80 font-medium">{{ proj.annotation_type || 'Standard' }}</strong>
              </span>

              <Button
                variant="outline"
                size="sm"
                class="h-7 px-2.5 text-[11px] gap-1"
                @click.stop="router.push(`/workspace?project_id=${proj.id}`)"
              >
                <Play class="size-3 text-primary" :stroke-width="1.8" />
                <span>Label</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
</template>
