<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useQuery } from '@tanstack/vue-query'
import { adminApi } from '@/api/admin'
import { projectsApi } from '@/api/projects'
import type { Project, AnalyticsOverview } from '@/types'
import Card from '@/components/ui/Card.vue'
import CardHeader from '@/components/ui/CardHeader.vue'
import CardTitle from '@/components/ui/CardTitle.vue'
import CardDescription from '@/components/ui/CardDescription.vue'
import CardContent from '@/components/ui/CardContent.vue'
import Badge from '@/components/ui/Badge.vue'
import Button from '@/components/ui/Button.vue'
import {
  FolderKanban,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Headphones,
  FileCheck2,
  Layers,
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
  <div class="flex flex-col gap-8 max-w-7xl mx-auto">
    <!-- Executive Title & Shortcuts with Slide-down Entrance -->
    <div class="flex flex-wrap items-center justify-between gap-4 animate-fade-in-up">
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-foreground">
          Operations Dashboard
        </h1>
        <p class="text-xs text-muted-foreground mt-1">
          High-throughput data labeling metrics, workforce allocations, and quality consensus
        </p>
      </div>

      <div class="flex items-center gap-3">
        <Button class="gap-2 shadow-2xs" @click="router.push('/workspace')">
          <Layers class="size-4" :stroke-width="1.6" />
          <span>Launch Workspace</span>
        </Button>
      </div>
    </div>

    <!-- KPI Metric Cards Grid -->
    <div v-if="analyticsError" class="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-xs text-destructive">
      Failed to load analytics overview.
    </div>
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
      <Card class="hover:border-foreground/30 transition-all">
        <CardContent class="p-4 flex items-center justify-between">
          <div>
            <div class="text-[11px] font-medium text-muted-foreground">Active Projects</div>
            <div class="text-2xl font-semibold text-foreground mt-1 tracking-tight">
              {{ analytics?.active_projects ?? '0' }}
            </div>
          </div>
          <div class="flex size-9 items-center justify-center rounded-md bg-muted text-muted-foreground border border-border">
            <FolderKanban class="size-4" :stroke-width="1.6" />
          </div>
        </CardContent>
      </Card>

      <Card class="hover:border-foreground/30 transition-all">
        <CardContent class="p-4 flex items-center justify-between">
          <div>
            <div class="text-[11px] font-medium text-muted-foreground">Completed Tasks</div>
            <div class="text-2xl font-semibold text-foreground mt-1 tracking-tight">
              {{ analytics?.completed_tasks ?? '0' }}
            </div>
          </div>
          <div class="flex size-9 items-center justify-center rounded-md bg-muted text-muted-foreground border border-border">
            <CheckCircle2 class="size-4" :stroke-width="1.6" />
          </div>
        </CardContent>
      </Card>

      <Card class="hover:border-foreground/30 transition-all">
        <CardContent class="p-4 flex items-center justify-between">
          <div>
            <div class="text-[11px] font-medium text-muted-foreground">Pending Reviews</div>
            <div class="text-2xl font-semibold text-foreground mt-1 tracking-tight">
              {{ analytics?.pending_reviews ?? '0' }}
            </div>
          </div>
          <div class="flex size-9 items-center justify-center rounded-md bg-muted text-muted-foreground border border-border">
            <FileCheck2 class="size-4" :stroke-width="1.6" />
          </div>
        </CardContent>
      </Card>

      <Card class="hover:border-foreground/30 transition-all">
        <CardContent class="p-4 flex items-center justify-between">
          <div>
            <div class="text-[11px] font-medium text-muted-foreground">Mean Lead Time</div>
            <div class="text-2xl font-semibold text-foreground mt-1 tracking-tight">
              {{ analytics?.mean_lead_time ?? '—' }}
            </div>
            <div class="text-[11px] text-muted-foreground mt-0.5">
              Score: <span class="text-foreground font-medium">{{ analytics?.quality_score ?? '—' }}</span>
            </div>
          </div>
          <div class="flex size-9 items-center justify-center rounded-md bg-muted text-muted-foreground border border-border">
            <Clock class="size-4" :stroke-width="1.6" />
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Active Projects Table -->
    <div class="flex flex-col gap-3 mt-2">
      <div class="flex items-center justify-between">
        <h2 class="text-sm font-semibold text-foreground tracking-tight">Active Annotation Projects</h2>
        <Button variant="ghost" size="sm" class="text-xs gap-1 text-muted-foreground hover:text-foreground" @click="router.push('/projects')">
          <span>View All</span>
          <ArrowUpRight class="size-3.5" :stroke-width="1.6" />
        </Button>
      </div>

      <div v-if="!isLoading && recentProjects.length === 0" class="rounded-lg border border-border bg-card p-8 text-center text-xs text-muted-foreground">
        No active projects yet.
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Card
          v-for="proj in recentProjects"
          :key="proj.id"
          class="hover:border-foreground/30 cursor-pointer group"
          @click="router.push(`/projects/${proj.id}`)"
        >
          <CardContent class="p-4 flex items-center justify-between">
            <div class="flex items-start gap-3 min-w-0">
              <div class="flex size-9 items-center justify-center rounded-md bg-muted text-foreground border border-border shrink-0">
                <Headphones v-if="proj.modality === 'AUDIO'" class="size-4 text-foreground" :stroke-width="1.6" />
                <Layers v-else class="size-4 text-foreground" :stroke-width="1.6" />
              </div>

              <div class="min-w-0">
                <div class="flex items-center gap-2">
                  <h3 class="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors">{{ proj.name }}</h3>
                  <Badge variant="outline">{{ proj.code }}</Badge>
                </div>
                <p class="text-xs text-muted-foreground line-clamp-1 mt-0.5">{{ proj.description || 'No description' }}</p>
              </div>
            </div>

            <div class="flex items-center gap-2.5 shrink-0 ml-3">
              <Badge variant="secondary" class="capitalize">
                {{ proj.modality.toLowerCase() }}
              </Badge>
              <ArrowUpRight class="size-3.5 text-muted-foreground group-hover:text-foreground transition-transform" :stroke-width="1.6" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>

  </div>
</template>
