<script setup lang="ts">
import { computed } from 'vue'
import type { QAProjectSummary } from '@/types'
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
  Cpu,
} from 'lucide-vue-next'

const props = defineProps<{
  project: QAProjectSummary
  canEvaluate?: boolean
}>()

const emit = defineEmits<{
  (e: 'open', project: QAProjectSummary): void
  (e: 'passAll', project: QAProjectSummary): void
}>()

function formatAnnotationEngine(raw: string): string {
  if (!raw) return 'Standard Engine'
  return raw
    .replace(/[_-]+/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

const completionRate = computed(() => {
  if (!props.project.total_tasks || props.project.total_tasks === 0) return 0
  const evaluated = props.project.passed_count + props.project.failed_count
  return Math.min(100, Math.round((evaluated / props.project.total_tasks) * 100))
})
</script>

<template>
  <div
    class="group relative flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-5 transition-all duration-200 hover:border-primary/40 shadow-2xs overflow-hidden before:absolute before:size-28 before:rounded-full before:bg-primary/5 before:-top-8 before:-right-8 after:absolute after:size-28 after:rounded-full after:bg-primary/5 after:-bottom-8 after:-right-4 before:pointer-events-none after:pointer-events-none"
  >
    <!-- Top Details -->
    <div class="relative z-10 space-y-3.5">
      <!-- Header: Modality / Engine & Status -->
      <div class="flex items-center justify-between gap-2 text-xs">
        <div class="flex items-center gap-2 min-w-0">
          <div class="flex size-8 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary shadow-2xs">
            <Headphones v-if="project.modality === 'AUDIO'" class="size-4" :stroke-width="1.8" />
            <ImageIcon v-else-if="project.modality === 'IMAGE'" class="size-4" :stroke-width="1.8" />
            <FileText v-else-if="project.modality === 'TEXT'" class="size-4" :stroke-width="1.8" />
            <VideoIcon v-else-if="project.modality === 'VIDEO'" class="size-4" :stroke-width="1.8" />
            <Layers v-else class="size-4" :stroke-width="1.8" />
          </div>
          
          <span class="font-bold text-foreground capitalize">{{ project.modality.toLowerCase() }}</span>
          <span class="text-border/80 text-xs">/</span>
          <span class="truncate text-[11px] text-muted-foreground font-medium" :title="project.annotation_type">
            {{ formatAnnotationEngine(project.annotation_type) }}
          </span>
        </div>

        <!-- Status Tag -->
        <span
          v-if="project.pending_count > 0"
          class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25 shadow-2xs shrink-0"
        >
          <Clock class="size-3" :stroke-width="1.8" />
          {{ project.pending_count }} pending QA
        </span>
        <span
          v-else
          class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 shadow-2xs shrink-0"
        >
          <CheckCircle2 class="size-3" :stroke-width="1.8" />
          All evaluated
        </span>
      </div>

      <!-- Project Name -->
      <div>
        <h3
          class="text-sm font-bold text-foreground tracking-tight line-clamp-1 group-hover:text-primary transition-colors cursor-pointer"
          :title="project.project_name"
          @click="emit('open', project)"
        >
          {{ project.project_name }}
        </h3>
      </div>

      <!-- Stat Blocks in Berry style -->
      <div class="grid grid-cols-3 gap-2 py-1">
        <div class="flex flex-col items-center justify-center p-2.5 rounded-xl bg-muted/40 border border-border/70 shadow-2xs">
          <span class="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">Pending</span>
          <span class="text-sm font-bold text-amber-600 dark:text-amber-400 tabular-nums">
            {{ project.pending_count }}
          </span>
        </div>
        <div class="flex flex-col items-center justify-center p-2.5 rounded-xl bg-muted/40 border border-border/70 shadow-2xs">
          <span class="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">Passed</span>
          <span class="text-sm font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
            {{ project.passed_count }}
          </span>
        </div>
        <div class="flex flex-col items-center justify-center p-2.5 rounded-xl bg-muted/40 border border-border/70 shadow-2xs">
          <span class="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">Failed</span>
          <span class="text-sm font-bold text-destructive tabular-nums">
            {{ project.failed_count }}
          </span>
        </div>
      </div>

      <!-- Compact Progress Line -->
      <div class="space-y-1.5 pt-1">
        <div class="flex items-center justify-between text-[11px] text-muted-foreground">
          <span class="font-medium">QA Progress ({{ project.passed_count + project.failed_count }}/{{ project.total_tasks }})</span>
          <div class="flex items-center gap-2 font-bold text-foreground tabular-nums">
            <span v-if="project.avg_score > 0" class="text-muted-foreground font-medium">
              {{ Number(project.avg_score).toFixed(1) }}% avg
            </span>
            <span>{{ completionRate }}%</span>
          </div>
        </div>
        <div class="h-2 w-full rounded-full bg-muted/80 overflow-hidden shadow-inner">
          <div
            class="h-full bg-primary transition-all duration-300 rounded-full"
            :style="{ width: `${completionRate}%` }"
          ></div>
        </div>
      </div>
    </div>

    <!-- Bottom Actions Bar -->
    <div class="relative z-10 flex items-center justify-between gap-2 pt-4 mt-3 border-t border-border/80">
      <!-- Quick Action: Pass All Pending in this project -->
      <div>
        <button
          v-if="project.pending_count > 0 && canEvaluate !== false"
          type="button"
          class="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl text-xs font-semibold text-muted-foreground hover:text-emerald-600 hover:bg-emerald-500/10 transition-colors border border-border/80 hover:border-emerald-500/25 cursor-pointer shadow-2xs"
          title="Batch approve all pending QA tasks for this project"
          @click.stop="emit('passAll', project)"
        >
          <CheckCheck class="size-3.5 text-emerald-600 dark:text-emerald-400" :stroke-width="1.8" />
          <span>Pass All ({{ project.pending_count }})</span>
        </button>
      </div>

      <!-- Primary Action: Open Project QA Queue -->
      <button
        type="button"
        class="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-xl text-xs font-semibold bg-foreground text-background hover:bg-foreground/90 transition-all cursor-pointer shadow-2xs active:scale-[0.98] ml-auto"
        @click="emit('open', project)"
      >
        <span>Evaluate Queue</span>
        <ArrowRight class="size-3.5 transition-transform group-hover:translate-x-0.5" :stroke-width="1.8" />
      </button>
    </div>
  </div>
</template>
