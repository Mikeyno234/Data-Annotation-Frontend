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
    class="group relative flex flex-col justify-between rounded-xl border border-border/70 bg-card p-5 transition-all duration-200 hover:border-primary/40 hover:shadow-md hover:shadow-primary/5 cursor-pointer"
    @click="navigateToProject"
  >
    <!-- Top Row: Modality Indicator + Code + Status -->
    <div class="space-y-3.5">
      <div class="flex items-center justify-between gap-2">
        <div class="flex items-center gap-2">
          <!-- Modality Icon Badge -->
          <div
            class="flex size-7 items-center justify-center rounded-md border border-border/50 bg-muted/50 text-foreground transition-colors group-hover:border-primary/30 group-hover:bg-primary/5"
          >
            <Headphones v-if="project.modality === 'AUDIO'" class="size-3.5 text-indigo-400" />
            <ImageIcon v-else-if="project.modality === 'IMAGE'" class="size-3.5 text-sky-400" />
            <FileText v-else-if="project.modality === 'TEXT'" class="size-3.5 text-emerald-400" />
            <VideoIcon v-else-if="project.modality === 'VIDEO'" class="size-3.5 text-amber-400" />
            <Layers v-else class="size-3.5 text-primary" />
          </div>

          <!-- Modality Tag & Project Code -->
          <span class="text-xs font-semibold uppercase tracking-wider text-foreground/90">
            {{ project.modality }}
          </span>
          <span class="text-border text-xs">/</span>
          <span class="text-xs text-muted-foreground/80 font-mono tracking-normal">
            {{ project.code }}
          </span>
        </div>

      </div>

      <!-- Project Title & Description -->
      <div class="space-y-1.5">
        <div class="flex items-start justify-between gap-2">
          <h3 class="text-base font-semibold text-foreground tracking-tight line-clamp-1 group-hover:text-primary transition-colors">
            {{ project.name }}
          </h3>
          <ArrowUpRight class="size-4 shrink-0 text-muted-foreground/40 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary" />
        </div>
        <p class="text-xs text-muted-foreground/80 line-clamp-2 leading-relaxed font-normal min-h-[2.25rem]">
          {{ project.description || 'No description provided for this annotation pipeline.' }}
        </p>
      </div>

      <!-- Engine & Metadata Spec -->
      <div class="pt-2">
        <div class="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-muted/40 border border-border/50 text-[11px] text-foreground/85 transition-colors group-hover:bg-muted/60">
          <Cpu class="size-3 text-muted-foreground/70 shrink-0" />
          <span class="truncate font-medium" :title="project.annotation_type">
            {{ formatAnnotationEngine(project.annotation_type) }}
          </span>
        </div>
      </div>
    </div>

    <!-- Bottom Actions Bar -->
    <div
      class="mt-5 flex items-center justify-between border-t border-border/50 pt-3 text-xs"
      @click.stop
    >
      <!-- Dataset Count or Fallback Info -->
      <div class="flex items-center gap-1.5 text-[11px] text-muted-foreground/80 font-mono">
        <Database class="size-3.5 text-muted-foreground/60" />
        <span>{{ project.datasets?.length || 0 }} datasets</span>
      </div>

      <!-- Quick Action Buttons -->
      <div class="flex items-center gap-1">
        <button
          v-if="canUploadDataset"
          type="button"
          class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-medium text-muted-foreground transition-all hover:text-foreground hover:bg-muted/70 cursor-pointer border border-transparent hover:border-border/50"
          title="Upload dataset"
          @click="emit('upload', project.id, project.modality)"
        >
          <UploadCloud class="size-3.5" />
          <span>Upload</span>
        </button>

        <button
          v-if="canEditProject"
          type="button"
          class="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground/70 transition-all hover:text-foreground hover:bg-muted/70 cursor-pointer border border-transparent hover:border-border/50"
          title="Configure project"
          aria-label="Edit project configuration"
          @click="emit('edit', project)"
        >
          <Settings2 class="size-3.5" />
        </button>
      </div>
    </div>
  </div>
</template>
