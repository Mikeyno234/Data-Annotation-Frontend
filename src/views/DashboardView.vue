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
        <Button class="gap-2 shadow-xs transition-transform duration-200 active:scale-95" @click="router.push('/workspace')">
          <Headphones class="size-4" />
          <span>Launch Workspace</span>
        </Button>
      </div>
    </div>

    <!-- KPI Metric Cards Grid with Staggered Cascading Entrance -->
    <div v-if="analyticsError" class="rounded-2xl bg-destructive/10 p-5 text-sm text-destructive-foreground">
      Failed to load analytics overview.
    </div>
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      <Card class="bg-card/90 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 animate-fade-in-up-delay-1">
        <CardContent class="p-6 flex items-center justify-between">
          <div>
            <span class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Active Projects</span>
            <div class="text-3xl font-extrabold text-foreground mt-1 tracking-tight">
              {{ analytics?.active_projects ?? '—' }}
            </div>
          </div>
          <div class="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-transform duration-300 hover:scale-110">
            <FolderKanban class="size-6" />
          </div>
        </CardContent>
      </Card>

      <Card class="bg-card/90 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 animate-fade-in-up-delay-2">
        <CardContent class="p-6 flex items-center justify-between">
          <div>
            <span class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Completed Tasks</span>
            <div class="text-3xl font-extrabold text-foreground mt-1 tracking-tight">
              {{ analytics?.completed_tasks ?? '—' }}
            </div>
          </div>
          <div class="flex size-12 items-center justify-center rounded-2xl bg-success/15 text-success transition-transform duration-300 hover:scale-110">
            <CheckCircle2 class="size-6" />
          </div>
        </CardContent>
      </Card>

      <Card class="bg-card/90 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 animate-fade-in-up-delay-3">
        <CardContent class="p-6 flex items-center justify-between">
          <div>
            <span class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pending Reviews</span>
            <div class="text-3xl font-extrabold text-foreground mt-1 tracking-tight">
              {{ analytics?.pending_reviews ?? '—' }}
            </div>
          </div>
          <div class="flex size-12 items-center justify-center rounded-2xl bg-warning/15 text-warning transition-transform duration-300 hover:scale-110">
            <FileCheck2 class="size-6" />
          </div>
        </CardContent>
      </Card>

      <Card class="bg-card/90 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 animate-fade-in-up-delay-4">
        <CardContent class="p-6 flex items-center justify-between">
          <div>
            <span class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Mean Lead Time</span>
            <div class="text-3xl font-extrabold text-foreground mt-1 tracking-tight">
              {{ analytics?.mean_lead_time ?? '—' }}
            </div>
            <div class="text-xs font-medium text-muted-foreground mt-1">
              Quality: <span class="text-foreground font-semibold">{{ analytics?.quality_score ?? '—' }}</span>
            </div>
          </div>
          <div class="flex size-12 items-center justify-center rounded-2xl bg-info/15 text-info transition-transform duration-300 hover:scale-110">
            <Clock class="size-6" />
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Active Projects Table with Entrance Animation -->
    <div class="flex flex-col gap-4 mt-2 animate-fade-in-up-delay-4">
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-bold text-foreground tracking-tight">Active Annotation Projects</h2>
        <Button variant="ghost" size="sm" class="text-xs gap-1.5 font-semibold" @click="router.push('/projects')">
          <span>View All</span>
          <ArrowUpRight class="size-3.5" />
        </Button>
      </div>

      <div v-if="!isLoading && recentProjects.length === 0" class="rounded-3xl bg-card/60 p-10 text-center text-sm text-muted-foreground shadow-sm">
        No active projects yet.
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card
          v-for="proj in recentProjects"
          :key="proj.id"
          class="hover:shadow-md hover:-translate-y-0.5 cursor-pointer group bg-card/90"
          @click="router.push(`/projects/${proj.id}`)"
        >
          <CardContent class="p-6 flex items-center justify-between">
            <div class="flex items-start gap-4">
              <div class="flex size-12 items-center justify-center rounded-2xl bg-secondary text-foreground shrink-0 group-hover:bg-primary/10 transition-colors">
                <Headphones v-if="proj.modality === 'AUDIO'" class="size-6 text-primary" />
                <Layers v-else class="size-6 text-primary" />
              </div>

              <div>
                <div class="flex items-center gap-2">
                  <h3 class="text-sm font-bold text-foreground group-hover:text-primary transition-colors">{{ proj.name }}</h3>
                  <Badge variant="outline" class="text-[11px]">{{ proj.code }}</Badge>
                </div>
                <p class="text-xs text-muted-foreground line-clamp-1 mt-1">{{ proj.description || 'No description' }}</p>
              </div>
            </div>

            <div class="flex items-center gap-3">
              <Badge variant="secondary" class="text-[11px]">
                {{ proj.modality }}
              </Badge>
              <ArrowUpRight class="size-4 text-muted-foreground group-hover:text-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>

  </div>
</template>
