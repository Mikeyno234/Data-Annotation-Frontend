<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import type { Project } from '@/types'
import {
  UploadCloud,
  ArrowUpRight,
  Settings2,
  Database,
  Cpu,
} from 'lucide-vue-next'
import { getModalityConfig, formatAnnotationEngine } from '@/utils/design'

const props = defineProps<{
  project: Project
  canUploadDataset: boolean
  canEditProject: boolean
}>()

const emit = defineEmits<{
  (e: 'upload', id: number, modality: string): void
  (e: 'edit', project: Project): void
}>()

const router = useRouter()
const modalityConfig = computed(() => getModalityConfig(props.project.modality))

function navigateToProject() {
  router.push(`/projects/${props.project.id}`)
}
</script>

<template>
  <div
    role="button"
    tabindex="0"
    :aria-label="`Open project ${project.name}`"
    class="group relative flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-primary/40 cursor-pointer overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 before:absolute before:size-36 before:rounded-full before:bg-primary/5 before:-top-12 before:-right-12 before:pointer-events-none before:transition-transform before:duration-300 group-hover:before:scale-125"
    @click="navigateToProject"
    @keydown.enter.prevent="navigateToProject"
    @keydown.space.prevent="navigateToProject"
  >
    <!-- Top Row: Modality Indicator + Code + Status -->
    <div class="space-y-3.5 relative z-10">
      <div class="flex items-center justify-between gap-2">
        <div class="flex items-center gap-2.5">
          <!-- Modality Icon Badge (Berry Rounded-xl Icon Box) -->
          <div
            class="flex size-9 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary shadow-2xs group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-200"
          >
            <component :is="modalityConfig.icon" class="size-4" :stroke-width="1.8" />
          </div>

          <!-- Modality Tag & Project Code -->
          <div class="flex flex-col">
            <span class="text-xs font-semibold text-foreground capitalize tracking-tight">
              {{ modalityConfig.shortLabel }}
            </span>
            <span class="text-[10px] text-muted-foreground font-mono">
              {{ project.code }}
            </span>
          </div>
        </div>

        <div class="flex items-center gap-1.5">
          <span
            v-if="project.status"
            class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium tracking-wide uppercase"
            :class="project.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' : 'bg-muted text-muted-foreground border border-border'"
          >
            {{ project.status }}
          </span>
        </div>
      </div>

      <!-- Project Title & Description -->
      <div class="space-y-1">
        <div class="flex items-start justify-between gap-2">
          <h3 class="text-sm font-semibold text-foreground tracking-tight line-clamp-1 group-hover:text-primary transition-colors">
            {{ project.name }}
          </h3>
          <div class="size-6 rounded-lg bg-muted/50 flex items-center justify-center text-muted-foreground group-hover:text-primary group-hover:bg-primary/10 transition-colors shrink-0">
            <ArrowUpRight class="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" :stroke-width="1.8" />
          </div>
        </div>
        <p class="text-xs text-muted-foreground line-clamp-2 leading-relaxed min-h-[2.25rem]">
          {{ project.description || 'No description provided for this annotation pipeline.' }}
        </p>
      </div>

      <!-- Engine & Metadata Spec -->
      <div class="pt-0.5">
        <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-border/70 bg-muted/40 text-[11px] text-muted-foreground">
          <Cpu class="size-3 text-muted-foreground shrink-0" :stroke-width="1.6" />
          <span class="truncate font-medium text-foreground/90" :title="project.annotation_type">
            {{ formatAnnotationEngine(project.annotation_type) }}
          </span>
        </div>
      </div>
    </div>

    <!-- Bottom Actions Bar -->
    <div
      class="mt-4 flex items-center justify-between border-t border-border/70 pt-3 text-xs relative z-10"
      @click.stop
    >
      <!-- Dataset Count or Fallback Info -->
      <div class="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Database class="size-3.5 text-muted-foreground/80" :stroke-width="1.6" />
        <span class="font-medium tabular-nums text-foreground/80">{{ project.datasets?.length || 0 }}</span>
        <span>datasets</span>
      </div>

      <!-- Quick Action Buttons (Berry Pill/Rounded Buttons) -->
      <div class="flex items-center gap-1.5">
        <button
          v-if="canUploadDataset"
          type="button"
          class="inline-flex min-h-[30px] items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-muted-foreground transition-all hover:text-foreground hover:bg-muted cursor-pointer border border-border/60 hover:border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          title="Upload dataset"
          aria-label="Upload dataset"
          @click="emit('upload', project.id, project.modality)"
        >
          <UploadCloud class="size-3" :stroke-width="1.8" />
          <span>Upload</span>
        </button>

        <button
          v-if="canEditProject"
          type="button"
          class="inline-flex size-7.5 items-center justify-center rounded-lg text-muted-foreground transition-all hover:text-foreground hover:bg-muted cursor-pointer border border-border/60 hover:border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          title="Configure project"
          aria-label="Edit project configuration"
          @click="emit('edit', project)"
        >
          <Settings2 class="size-3.5" :stroke-width="1.6" />
        </button>
      </div>
    </div>
  </div>
</template>
