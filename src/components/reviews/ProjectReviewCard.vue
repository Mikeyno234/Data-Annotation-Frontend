<script setup lang="ts">
import { computed } from 'vue'
import type { ReviewProjectSummary } from '@/types'
import {
  Headphones,
  FileText,
  Image as ImageIcon,
  Video as VideoIcon,
  Layers,
  ArrowRight,
  CheckCheck,
  Clock,
  CheckCircle2,
  XCircle,
  Cpu,
} from 'lucide-vue-next'

const props = defineProps<{
  project: ReviewProjectSummary
  canApprove?: boolean
}>()

const emit = defineEmits<{
  (e: 'open', project: ReviewProjectSummary): void
  (e: 'approveAll', project: ReviewProjectSummary): void
}>()

function formatAnnotationEngine(raw: string): string {
  if (!raw) return 'Standard Engine'
  return raw
    .replace(/[_-]+/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

const completionRate = computed(() => {
  if (!props.project.total_reviews || props.project.total_reviews === 0) return 0
  const reviewed = props.project.approved_count + props.project.rejected_count
  return Math.min(100, Math.round((reviewed / props.project.total_reviews) * 100))
})
</script>

<template>
  <div
    class="group relative flex flex-col justify-between rounded-lg border border-border bg-card p-4 transition-all duration-150 hover:border-foreground/30 shadow-2xs"
  >
    <!-- Top Section: Modality & Title -->
    <div class="space-y-3">
      <!-- Modality Badge & Tag -->
      <div class="flex items-center justify-between gap-2">
        <div class="flex items-center gap-2">
          <div class="flex size-7 items-center justify-center rounded-md border border-border bg-muted text-foreground">
            <Headphones v-if="project.modality === 'AUDIO'" class="size-3.5 text-foreground" :stroke-width="1.6" />
            <ImageIcon v-else-if="project.modality === 'IMAGE'" class="size-3.5 text-foreground" :stroke-width="1.6" />
            <FileText v-else-if="project.modality === 'TEXT'" class="size-3.5 text-foreground" :stroke-width="1.6" />
            <VideoIcon v-else-if="project.modality === 'VIDEO'" class="size-3.5 text-foreground" :stroke-width="1.6" />
            <Layers v-else class="size-3.5 text-foreground" :stroke-width="1.6" />
          </div>
          <span class="text-xs font-medium text-foreground capitalize">
            {{ project.modality.toLowerCase() }}
          </span>
          <span class="text-border text-xs">/</span>
          <div class="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
            <Cpu class="size-3 text-muted-foreground" :stroke-width="1.6" />
            <span class="truncate max-w-[140px] font-medium" :title="project.annotation_type">
              {{ formatAnnotationEngine(project.annotation_type) }}
            </span>
          </div>
        </div>

        <!-- Pending Badge -->
        <span
          v-if="project.pending_count > 0"
          class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25 animate-pulse"
        >
          <Clock class="size-3" :stroke-width="1.6" />
          {{ project.pending_count }} pending
        </span>
        <span
          v-else
          class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
        >
          <CheckCircle2 class="size-3" :stroke-width="1.6" />
          All reviewed
        </span>
      </div>

      <!-- Project Name -->
      <div class="space-y-1">
        <h3
          class="text-sm font-semibold text-foreground tracking-tight line-clamp-1 group-hover:text-primary transition-colors cursor-pointer"
          :title="project.project_name"
          @click="emit('open', project)"
        >
          {{ project.project_name }}
        </h3>
      </div>

      <!-- Review Counts Pills -->
      <div class="grid grid-cols-3 gap-1.5 py-1">
        <div class="flex flex-col items-center justify-center p-2 rounded-md bg-muted/40 border border-border/60">
          <span class="text-[10px] text-muted-foreground uppercase font-medium tracking-wider">Pending</span>
          <span class="text-sm font-semibold text-amber-600 dark:text-amber-400 tabular-nums">
            {{ project.pending_count }}
          </span>
        </div>
        <div class="flex flex-col items-center justify-center p-2 rounded-md bg-muted/40 border border-border/60">
          <span class="text-[10px] text-muted-foreground uppercase font-medium tracking-wider">Approved</span>
          <span class="text-sm font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
            {{ project.approved_count }}
          </span>
        </div>
        <div class="flex flex-col items-center justify-center p-2 rounded-md bg-muted/40 border border-border/60">
          <span class="text-[10px] text-muted-foreground uppercase font-medium tracking-wider">Rejected</span>
          <span class="text-sm font-semibold text-destructive tabular-nums">
            {{ project.rejected_count }}
          </span>
        </div>
      </div>

      <!-- Completion Rate & Progress Bar -->
      <div class="space-y-1.5 pt-0.5">
        <div class="flex items-center justify-between text-[11px] text-muted-foreground">
          <span>Review Progress</span>
          <span class="font-medium text-foreground tabular-nums">{{ completionRate }}% ({{ project.approved_count + project.rejected_count }}/{{ project.total_reviews }})</span>
        </div>
        <div class="h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <div
            class="h-full bg-primary transition-all duration-300 rounded-full"
            :style="{ width: `${completionRate}%` }"
          ></div>
        </div>
      </div>
    </div>

    <!-- Bottom Actions Bar -->
    <div class="flex items-center justify-between gap-2 pt-4 mt-3 border-t border-border">
      <!-- Quick Action: Approve All Pending in this project -->
      <div>
        <button
          v-if="project.pending_count > 0 && canApprove !== false"
          type="button"
          class="inline-flex items-center gap-1.5 h-7 px-2.5 rounded text-xs font-medium text-muted-foreground hover:text-emerald-600 hover:bg-emerald-500/10 transition-colors border border-border hover:border-emerald-500/25 cursor-pointer"
          title="Approve all pending annotations in this project"
          @click.stop="emit('approveAll', project)"
        >
          <CheckCheck class="size-3.5 text-emerald-600 dark:text-emerald-400" :stroke-width="1.6" />
          <span>Approve All ({{ project.pending_count }})</span>
        </button>
      </div>

      <!-- Primary Action: Open Project Review Queue -->
      <button
        type="button"
        class="inline-flex items-center gap-1.5 h-7 px-3 rounded text-xs font-medium bg-foreground text-background hover:bg-foreground/90 transition-all shadow-2xs active:scale-[0.98] cursor-pointer"
        @click="emit('open', project)"
      >
        <span>Review Queue</span>
        <ArrowRight class="size-3.5 transition-transform group-hover:translate-x-0.5" :stroke-width="1.6" />
      </button>
    </div>
  </div>
</template>
