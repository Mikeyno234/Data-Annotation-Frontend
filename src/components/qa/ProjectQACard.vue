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
    class="group relative flex flex-col justify-between rounded-lg border border-border/70 bg-card p-4 transition-all duration-150 hover:border-foreground/40 shadow-xs"
  >
    <!-- Top Details -->
    <div class="space-y-3">
      <!-- Header: Modality / Engine & Status -->
      <div class="flex items-center justify-between gap-2 text-xs">
        <div class="flex items-center gap-1.5 text-muted-foreground min-w-0">
          <Headphones v-if="project.modality === 'AUDIO'" class="size-3.5 shrink-0 text-foreground" :stroke-width="1.6" />
          <ImageIcon v-else-if="project.modality === 'IMAGE'" class="size-3.5 shrink-0 text-foreground" :stroke-width="1.6" />
          <FileText v-else-if="project.modality === 'TEXT'" class="size-3.5 shrink-0 text-foreground" :stroke-width="1.6" />
          <VideoIcon v-else-if="project.modality === 'VIDEO'" class="size-3.5 shrink-0 text-foreground" :stroke-width="1.6" />
          <Layers v-else class="size-3.5 shrink-0 text-foreground" :stroke-width="1.6" />
          
          <span class="font-medium text-foreground capitalize">{{ project.modality.toLowerCase() }}</span>
          <span class="text-border">·</span>
          <span class="truncate text-[11px]" :title="project.annotation_type">
            {{ formatAnnotationEngine(project.annotation_type) }}
          </span>
        </div>

        <!-- Status Tag -->
        <span
          v-if="project.pending_count > 0"
          class="inline-flex items-center gap-1 text-[11px] font-medium text-amber-600 dark:text-amber-400 shrink-0"
        >
          <Clock class="size-3" :stroke-width="1.6" />
          {{ project.pending_count }} pending QA
        </span>
        <span
          v-else
          class="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 shrink-0"
        >
          <CheckCircle2 class="size-3" :stroke-width="1.6" />
          All evaluated
        </span>
      </div>

      <!-- Project Name -->
      <div>
        <h3
          class="text-sm font-semibold text-foreground tracking-tight line-clamp-1 group-hover:text-foreground group-hover:underline underline-offset-2 transition-all cursor-pointer"
          :title="project.project_name"
          @click="emit('open', project)"
        >
          {{ project.project_name }}
        </h3>
      </div>

      <!-- Minimal Flat Stat Row -->
      <div class="flex items-center gap-2.5 py-0.5 text-xs text-muted-foreground">
        <span><strong class="font-semibold text-foreground tabular-nums">{{ project.pending_count }}</strong> pending</span>
        <span class="text-border">·</span>
        <span><strong class="font-semibold text-foreground tabular-nums">{{ project.passed_count }}</strong> passed</span>
        <span class="text-border">·</span>
        <span><strong class="font-semibold text-foreground tabular-nums">{{ project.failed_count }}</strong> failed</span>
      </div>

      <!-- Compact Progress Line -->
      <div class="space-y-1.5 pt-1">
        <div class="flex items-center justify-between text-[11px] text-muted-foreground">
          <span>QA Progress ({{ project.passed_count + project.failed_count }}/{{ project.total_tasks }})</span>
          <div class="flex items-center gap-1.5 font-medium text-foreground tabular-nums">
            <span v-if="project.avg_score > 0" class="text-muted-foreground">
              {{ Number(project.avg_score).toFixed(1) }}% avg
            </span>
            <span>{{ completionRate }}%</span>
          </div>
        </div>
        <div class="h-1 w-full rounded-full bg-muted overflow-hidden">
          <div
            class="h-full bg-foreground transition-all duration-300 rounded-full"
            :style="{ width: `${completionRate}%` }"
          ></div>
        </div>
      </div>
    </div>

    <!-- Bottom Actions Bar -->
    <div class="flex items-center justify-between gap-2 pt-3 mt-3 border-t border-border/60">
      <!-- Quick Action: Pass All Pending in this project -->
      <div>
        <button
          v-if="project.pending_count > 0 && canEvaluate !== false"
          type="button"
          class="inline-flex items-center gap-1.5 h-7 px-2 rounded text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          title="Batch approve all pending QA tasks for this project"
          @click.stop="emit('passAll', project)"
        >
          <CheckCheck class="size-3.5 text-emerald-600 dark:text-emerald-400" :stroke-width="1.6" />
          <span>Pass All ({{ project.pending_count }})</span>
        </button>
      </div>

      <!-- Primary Action: Open Project QA Queue -->
      <button
        type="button"
        class="inline-flex items-center gap-1.5 h-7 px-3 rounded text-xs font-medium bg-foreground text-background hover:bg-foreground/90 transition-all cursor-pointer active:scale-[0.98]"
        @click="emit('open', project)"
      >
        <span>Evaluate Queue</span>
        <ArrowRight class="size-3.5 transition-transform group-hover:translate-x-0.5" :stroke-width="1.6" />
      </button>
    </div>
  </div>
</template>
