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
  <header class="relative rounded-2xl border border-border/80 bg-card p-5 shadow-xs overflow-hidden before:absolute before:size-48 before:rounded-full before:bg-primary/5 before:-top-16 before:-right-16 before:pointer-events-none">
    <!-- Main Toolbar -->
    <div class="flex flex-wrap items-center justify-between gap-3 relative z-10">
      <div class="flex items-center gap-3">
        <Button
          variant="outline"
          size="icon"
          class="size-9 rounded-xl border-border/80 hover:bg-muted cursor-pointer shrink-0 shadow-2xs"
          @click="router.push('/projects')"
          title="Back to Projects"
        >
          <ArrowLeft class="size-4" :stroke-width="1.8" />
        </Button>
        <div class="flex items-center gap-2.5 flex-wrap">
          <div class="flex flex-col">
            <div class="flex items-center gap-2">
              <span class="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">PROJECT</span>
              <span class="text-xs text-border">/</span>
              <span class="text-xs font-mono text-primary font-semibold">{{ project?.code }}</span>
            </div>
            <h1 class="text-lg font-bold text-foreground tracking-tight">
              {{ project?.name || 'Project Details' }}
            </h1>
          </div>
          <div class="flex items-center gap-1.5 self-end mb-0.5">
            <span
              v-if="project"
              class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20 capitalize"
            >
              {{ project.modality.toLowerCase() }}
            </span>
            <span
              v-if="project?.status"
              class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium uppercase tracking-wide"
              :class="project.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' : 'bg-muted text-muted-foreground border border-border'"
            >
              {{ project.status }}
            </span>
          </div>
        </div>
      </div>

      <!-- Actions (Berry Rounded-xl Button Suite) -->
      <div class="flex items-center gap-2">
        <Button
          v-if="canUpload"
          variant="outline"
          size="sm"
          class="h-9 gap-1.5 px-3.5 rounded-xl text-xs font-medium cursor-pointer shadow-2xs"
          @click="emit('upload')"
        >
          <Upload class="size-3.5" :stroke-width="1.8" />
          <span>Upload Dataset</span>
        </Button>

        <Button
          v-if="canExport"
          size="sm"
          class="h-9 gap-1.5 px-3.5 rounded-xl text-xs font-medium cursor-pointer shadow-2xs"
          @click="emit('export')"
        >
          <Download class="size-3.5" :stroke-width="1.8" />
          <span>Export Dataset</span>
        </Button>
        <div
          v-else
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border/70 bg-muted/40 text-muted-foreground text-xs select-none shadow-2xs"
          title="Export is locked until tasks in this project are annotated and approved through Review/QA"
        >
          <Lock class="size-3.5" :stroke-width="1.6" />
          <span>Export (Pending QA)</span>
        </div>
      </div>
    </div>

    <!-- Unified Metadata Strip -->
    <div class="mt-4 pt-3.5 border-t border-border/70 flex items-center gap-3 text-xs text-muted-foreground flex-wrap relative z-10">
      <span class="inline-flex items-center gap-1 font-medium text-foreground">
        {{ project?.organization?.name || (project?.organization_id ? `Organization #${project.organization_id}` : 'All Organizations') }}
      </span>
      <span class="text-border">•</span>
      <span class="capitalize">
        {{ (project?.annotation_type || '').replace(/[_-]+/g, ' ').toLowerCase() }}
      </span>
      <span class="text-border">•</span>
      <span>
        Priority: <span class="font-medium text-foreground capitalize">{{ (project?.priority || 'Normal').toLowerCase() }}</span>
      </span>
      <span class="text-border">•</span>
      <span>
        <strong class="text-foreground tabular-nums">{{ datasets?.length || 0 }}</strong> Dataset(s)
      </span>

      <!-- Assignees Mini Strip -->
      <div v-if="project?.assignees && project.assignees.length > 0" class="flex items-center gap-2 ml-auto">
        <Users class="size-3.5 text-muted-foreground" />
        <span class="text-[11px] text-muted-foreground font-medium">Team:</span>
        <div class="flex items-center gap-1 flex-wrap">
          <span
            v-for="user in project.assignees"
            :key="user.id"
            class="text-[11px] px-2 py-0.5 rounded-lg bg-muted text-foreground border border-border/60 font-medium"
          >
            {{ user.full_name }}
          </span>
        </div>
      </div>
    </div>
  </header>
</template>
