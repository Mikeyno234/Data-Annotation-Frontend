<script setup lang="ts">
import { useRouter } from 'vue-router'
import type { Project, Dataset } from '@/types'
import Button from '@/components/ui/Button.vue'
import Badge from '@/components/ui/Badge.vue'
import {
  ArrowLeft,
  Download,
  Upload,
  Lock,
  Users,
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
  <header class="flex flex-col gap-3 pb-2 border-b border-border/60">
    <!-- Main Toolbar -->
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div class="flex items-center gap-3">
        <Button
          variant="outline"
          size="icon"
          class="size-8 rounded-lg cursor-pointer shrink-0"
          @click="router.push('/projects')"
        >
          <ArrowLeft class="size-3.5" :stroke-width="1.6" />
        </Button>
        <div class="flex items-center gap-2.5 flex-wrap">
          <h1 class="text-lg font-semibold text-foreground tracking-tight">
            {{ project?.name || 'Project Details' }}
          </h1>
          <Badge v-if="project" variant="secondary" class="text-[11px] font-medium capitalize">
            {{ project.modality.toLowerCase() }}
          </Badge>
          <Badge
            v-if="project?.status"
            variant="outline"
            class="text-[10px] capitalize text-muted-foreground"
          >
            {{ project.status.toLowerCase() }}
          </Badge>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex items-center gap-2">
        <Button
          v-if="canUpload"
          variant="outline"
          size="sm"
          class="h-8 gap-1.5 px-3 rounded-lg text-xs font-medium cursor-pointer"
          @click="emit('upload')"
        >
          <Upload class="size-3.5" :stroke-width="1.6" />
          <span>Upload Dataset</span>
        </Button>

        <Button
          v-if="canExport"
          variant="outline"
          size="sm"
          class="h-8 gap-1.5 px-3 rounded-lg text-xs font-medium cursor-pointer"
          @click="emit('export')"
        >
          <Download class="size-3.5" :stroke-width="1.6" />
          <span>Export Dataset</span>
        </Button>
        <div
          v-else
          class="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-border/70 bg-muted/40 text-muted-foreground text-xs select-none"
          title="Export is locked until tasks in this project are annotated and approved through Review/QA"
        >
          <Lock class="size-3" :stroke-width="1.6" />
          <span>Export (Pending QA)</span>
        </div>
      </div>
    </div>

    <!-- Unified Metadata Strip -->
    <div class="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
      <span class="font-medium text-foreground">
        {{ project?.code }}
      </span>
      <span class="text-border">•</span>
      <span>
        {{ project?.organization?.name || (project?.organization_id ? `Organization #${project.organization_id}` : 'All Organizations') }}
      </span>
      <span class="text-border">•</span>
      <span class="capitalize">
        {{ (project?.annotation_type || '').replace(/[_-]+/g, ' ').toLowerCase() }}
      </span>
      <span class="text-border">•</span>
      <span>
        Priority: <span class="text-foreground capitalize">{{ (project?.priority || 'Normal').toLowerCase() }}</span>
      </span>
      <span class="text-border">•</span>
      <span>
        {{ datasets?.length || 0 }} Dataset(s)
      </span>

      <!-- Assignees Mini Strip -->
      <div v-if="project?.assignees && project.assignees.length > 0" class="flex items-center gap-1.5 ml-auto">
        <Users class="size-3.5 text-muted-foreground" />
        <span class="text-[11px] text-muted-foreground">Team:</span>
        <div class="flex items-center gap-1">
          <span
            v-for="user in project.assignees"
            :key="user.id"
            class="text-[11px] px-1.5 py-0.2 rounded bg-muted text-foreground"
          >
            {{ user.full_name }}
          </span>
        </div>
      </div>
    </div>
  </header>
</template>
