<script setup lang="ts">
import { useRouter } from 'vue-router'
import type { Project, Dataset } from '@/types'
import Button from '@/components/ui/Button.vue'
import Badge from '@/components/ui/Badge.vue'
import Card from '@/components/ui/Card.vue'
import CardContent from '@/components/ui/CardContent.vue'
import {
  ArrowLeft,
  Download,
  Lock,
  Layers,
  Database,
  Calendar,
} from 'lucide-vue-next'

defineProps<{
  project: Project | null
  datasets: Dataset[]
  canExport: boolean
}>()

const emit = defineEmits<{
  (e: 'export'): void
}>()

const router = useRouter()
</script>

<template>
  <div class="space-y-6">
    <!-- Top Header -->
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <Button
          variant="outline"
          size="icon"
          class="size-10 rounded-xl cursor-pointer"
          @click="router.push('/projects')"
        >
          <ArrowLeft class="size-4" />
        </Button>
        <div>
          <div class="flex items-center gap-2">
            <h1 class="text-2xl font-bold text-foreground font-sans">{{ project?.name || 'Project Details' }}</h1>
            <Badge v-if="project" :variant="project.modality === 'AUDIO' ? 'success' : 'info'" class="text-xs font-sans">
              {{ project.modality }}
            </Badge>
          </div>
          <span class="text-xs text-muted-foreground font-sans">{{ project?.code }} • Organization ID: {{ project?.organization_id }}</span>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex items-center gap-2">
        <Button
          v-if="canExport"
          variant="outline"
          class="h-10 gap-2 px-4 rounded-xl text-xs font-semibold shadow-xs cursor-pointer font-sans"
          @click="emit('export')"
        >
          <Download class="size-4 text-primary" />
          <span>Export Dataset</span>
        </Button>
        <div
          v-else
          class="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-muted/60 text-muted-foreground text-xs font-medium font-sans select-none"
          title="Export is locked until tasks in this project are annotated and approved through Review/QA"
        >
          <Lock class="size-3.5" />
          <span>Export Locked (Pending QA)</span>
        </div>
      </div>
    </div>

    <!-- Metadata Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
      <Card class="bg-card/90 shadow-sm">
        <CardContent class="p-5 flex items-center gap-4">
          <div class="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Layers class="size-6" />
          </div>
          <div>
            <span class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Annotation Type</span>
            <div class="text-base font-bold text-foreground mt-0.5">{{ project?.annotation_type }}</div>
          </div>
        </CardContent>
      </Card>

      <Card class="bg-card/90 shadow-sm">
        <CardContent class="p-5 flex items-center gap-4">
          <div class="flex size-12 items-center justify-center rounded-2xl bg-info/15 text-info">
            <Database class="size-6" />
          </div>
          <div>
            <span class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Datasets & Batches</span>
            <div class="text-base font-bold text-foreground mt-0.5">{{ datasets.length }} Datasets Registered</div>
          </div>
        </CardContent>
      </Card>

      <Card class="bg-card/90 shadow-sm">
        <CardContent class="p-5 flex items-center gap-4">
          <div class="flex size-12 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
            <Calendar class="size-6" />
          </div>
          <div>
            <span class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status & Priority</span>
            <div class="text-base font-bold text-foreground mt-0.5">{{ project?.status }} • {{ project?.priority }}</div>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
