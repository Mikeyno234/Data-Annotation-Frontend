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
  Upload,
  Lock,
  Layers,
  Database,
  Calendar,
} from 'lucide-vue-next'

defineProps<{
  project: Project | null
  datasets?: Dataset[]
  canExport: boolean
  canUpload?: boolean
}>()

const emit = defineEmits<{
  (e: 'export'): void
  (e: 'upload'): void
}>()

const router = useRouter()
</script>

<template>
  <div class="space-y-5">
    <!-- Top Header -->
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <Button
          variant="outline"
          size="icon"
          class="size-8 rounded-md cursor-pointer"
          @click="router.push('/projects')"
        >
          <ArrowLeft class="size-3.5" :stroke-width="1.6" />
        </Button>
        <div>
          <div class="flex items-center gap-2">
            <h1 class="text-xl font-semibold text-foreground tracking-tight">{{ project?.name || 'Project Details' }}</h1>
            <Badge v-if="project" variant="outline" class="capitalize">
              {{ project.modality.toLowerCase() }}
            </Badge>
          </div>
          <span class="text-xs text-muted-foreground">{{ project?.code }} • Organization #{{ project?.organization_id }}</span>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex items-center gap-2">
        <Button
          v-if="canUpload"
          variant="outline"
          size="sm"
          class="h-8 gap-1.5 px-3 rounded-md text-xs font-medium shadow-2xs cursor-pointer"
          @click="emit('upload')"
        >
          <Upload class="size-3.5" :stroke-width="1.6" />
          <span>Upload Dataset</span>
        </Button>

        <Button
          v-if="canExport"
          variant="outline"
          size="sm"
          class="h-8 gap-1.5 px-3 rounded-md text-xs font-medium shadow-2xs cursor-pointer"
          @click="emit('export')"
        >
          <Download class="size-3.5" :stroke-width="1.6" />
          <span>Export Dataset</span>
        </Button>
        <div
          v-else
          class="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-border bg-muted/40 text-muted-foreground text-xs select-none"
          title="Export is locked until tasks in this project are annotated and approved through Review/QA"
        >
          <Lock class="size-3" :stroke-width="1.6" />
          <span>Export (Pending QA)</span>
        </div>
      </div>
    </div>

    <!-- Metadata Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-3.5">
      <Card class="hover:border-foreground/30 transition-all">
        <CardContent class="p-4 flex items-center justify-between">
          <div>
            <div class="text-[11px] font-medium text-muted-foreground">Annotation Type</div>
            <div class="text-sm font-semibold text-foreground mt-1 tracking-tight capitalize">
              {{ (project?.annotation_type || '').replace(/[_-]+/g, ' ').toLowerCase() }}
            </div>
          </div>
          <div class="flex size-9 items-center justify-center rounded-md bg-muted text-muted-foreground border border-border">
            <Layers class="size-4" :stroke-width="1.6" />
          </div>
        </CardContent>
      </Card>

      <Card class="hover:border-foreground/30 transition-all">
        <CardContent class="p-4 flex items-center justify-between">
          <div>
            <div class="text-[11px] font-medium text-muted-foreground">Datasets & Batches</div>
            <div class="text-sm font-semibold text-foreground mt-1">{{ datasets?.length || 0 }} Registered</div>
          </div>
          <div class="flex size-9 items-center justify-center rounded-md bg-muted text-muted-foreground border border-border">
            <Database class="size-4" :stroke-width="1.6" />
          </div>
        </CardContent>
      </Card>

      <Card class="hover:border-foreground/30 transition-all">
        <CardContent class="p-4 flex items-center justify-between">
          <div>
            <div class="text-[11px] font-medium text-muted-foreground">Status & Priority</div>
            <div class="text-sm font-semibold text-foreground mt-1 capitalize">
              {{ (project?.status || 'Active').toLowerCase() }} • {{ (project?.priority || 'Normal').toLowerCase() }}
            </div>
          </div>
          <div class="flex size-9 items-center justify-center rounded-md bg-muted text-muted-foreground border border-border">
            <Calendar class="size-4" :stroke-width="1.6" />
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
