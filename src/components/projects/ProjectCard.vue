<script setup lang="ts">
import { useRouter } from 'vue-router'
import type { Project } from '@/types'
import {
  Headphones,
  FileText,
  Image as ImageIcon,
  Video as VideoIcon,
  Layers,
  UploadCloud,
  ArrowUpRight,
  Settings2,
  Database,
  Cpu,
} from 'lucide-vue-next'

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

function formatAnnotationEngine(raw: string): string {
  if (!raw) return 'Standard Engine'
  // Humanize SNAKE_CASE or RAW_CODES to readable Title Case
  return raw
    .replace(/[_-]+/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function navigateToProject() {
  router.push(`/projects/${props.project.id}`)
}
</script>

<template>
  <div
    class="group relative flex flex-col justify-between rounded-lg border border-border bg-card p-4 transition-all duration-150 hover:border-foreground/30 cursor-pointer shadow-2xs"
    @click="navigateToProject"
  >
    <!-- Top Row: Modality Indicator + Code + Status -->
    <div class="space-y-3">
      <div class="flex items-center justify-between gap-2">
        <div class="flex items-center gap-2">
          <!-- Modality Icon Badge -->
          <div
            class="flex size-6.5 items-center justify-center rounded-md border border-border bg-muted text-foreground"
          >
            <Headphones v-if="project.modality === 'AUDIO'" class="size-3.5 text-foreground" :stroke-width="1.6" />
            <ImageIcon v-else-if="project.modality === 'IMAGE'" class="size-3.5 text-foreground" :stroke-width="1.6" />
            <FileText v-else-if="project.modality === 'TEXT'" class="size-3.5 text-foreground" :stroke-width="1.6" />
            <VideoIcon v-else-if="project.modality === 'VIDEO'" class="size-3.5 text-foreground" :stroke-width="1.6" />
            <Layers v-else class="size-3.5 text-foreground" :stroke-width="1.6" />
          </div>

          <!-- Modality Tag & Project Code -->
          <span class="text-xs font-medium text-foreground capitalize">
            {{ project.modality.toLowerCase() }}
          </span>
          <span class="text-border text-xs">/</span>
          <span class="text-xs text-muted-foreground font-mono">
            {{ project.code }}
          </span>
        </div>
      </div>

      <!-- Project Title & Description -->
      <div class="space-y-1">
        <div class="flex items-start justify-between gap-2">
          <h3 class="text-sm font-semibold text-foreground tracking-tight line-clamp-1 group-hover:text-primary transition-colors">
            {{ project.name }}
          </h3>
          <ArrowUpRight class="size-3.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground" :stroke-width="1.6" />
        </div>
        <p class="text-xs text-muted-foreground line-clamp-2 leading-relaxed min-h-[2.25rem]">
          {{ project.description || 'No description provided for this annotation pipeline.' }}
        </p>
      </div>

      <!-- Engine & Metadata Spec -->
      <div class="pt-1">
        <div class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded border border-border bg-muted/40 text-[11px] text-muted-foreground">
          <Cpu class="size-3 text-muted-foreground shrink-0" :stroke-width="1.6" />
          <span class="truncate font-medium text-foreground/90" :title="project.annotation_type">
            {{ formatAnnotationEngine(project.annotation_type) }}
          </span>
        </div>
      </div>
    </div>

    <!-- Bottom Actions Bar -->
    <div
      class="mt-4 flex items-center justify-between border-t border-border pt-2.5 text-xs"
      @click.stop
    >
      <!-- Dataset Count or Fallback Info -->
      <div class="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Database class="size-3 text-muted-foreground" :stroke-width="1.6" />
        <span>{{ project.datasets?.length || 0 }} datasets</span>
      </div>

      <!-- Quick Action Buttons -->
      <div class="flex items-center gap-1">
        <button
          v-if="canUploadDataset"
          type="button"
          class="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-muted-foreground transition-all hover:text-foreground hover:bg-muted cursor-pointer border border-transparent hover:border-border"
          title="Upload dataset"
          @click="emit('upload', project.id, project.modality)"
        >
          <UploadCloud class="size-3" :stroke-width="1.6" />
          <span>Upload</span>
        </button>

        <button
          v-if="canEditProject"
          type="button"
          class="inline-flex size-6 items-center justify-center rounded text-muted-foreground transition-all hover:text-foreground hover:bg-muted cursor-pointer border border-transparent hover:border-border"
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
