<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import type { QATask } from '@/types'
import AnnotationVisualizer from '@/components/annotation/AnnotationVisualizer.vue'
import { Check, Eye, EyeOff, SlidersHorizontal } from 'lucide-vue-next'

const props = defineProps<{
  task: QATask
  selectable?: boolean
  selected?: boolean
}>()

const emit = defineEmits<{
  (e: 'scoreConsensus', task: QATask): void
  (e: 'update:selected', value: boolean): void
}>()

const router = useRouter()
// Collapsed by default for clean, high-density, minimalist queue scanning
const showPreview = ref(false)

const latestAnnotation = computed(() => {
  const anns = props.task.data_item?.annotations
  if (anns && anns.length > 0) {
    return anns[0]
  }
  return null
})

function getEvaluatorName(task: QATask): string {
  if (task.assigned_to?.full_name) return task.assigned_to.full_name
  if (task.assigned_to?.email) return task.assigned_to.email.split('@')[0]
  if (task.assigned_to_id) return `Evaluator #${task.assigned_to_id}`
  return 'Auto-Evaluator'
}

function openInspectWorkspace() {
  if (props.task.data_item_id) {
    router.push(`/workspace/${props.task.data_item_id}`)
  }
}

const isSelectable = computed(() => {
  return !!props.selectable && (props.task.status === 'PENDING' || props.task.status === 'UNASSIGNED')
})
</script>

<template>
  <div
    class="rounded-2xl border bg-card transition-all duration-150 overflow-hidden shadow-2xs"
    :class="selected && isSelectable ? 'border-primary/60 ring-2 ring-primary/20' : 'border-border/80 hover:border-primary/40'"
  >
    <!-- Main Task Row -->
    <div class="p-4 flex flex-wrap items-center justify-between gap-3">
      <div class="flex items-center gap-3.5 min-w-0 flex-1">
        <!-- Optional checkbox for batch actions (only for pending tasks) -->
        <input
          v-if="isSelectable"
          type="checkbox"
          :checked="selected"
          @change="emit('update:selected', ($event.target as HTMLInputElement).checked)"
          class="size-4 rounded-md border-border text-primary cursor-pointer shrink-0 accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
        />

        <!-- Task Metadata Strip -->
        <div class="min-w-0 space-y-1.5">
          <div class="flex items-center gap-2 flex-wrap text-xs">
            <span class="font-bold text-foreground tracking-tight tabular-nums">
              #{{ task.id }}
            </span>

            <span
              v-if="task.data_item?.modality"
              class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-muted text-muted-foreground uppercase border border-border/60"
            >
              {{ task.data_item.modality }}
            </span>

            <!-- Subtle Status Pill -->
            <span
              class="px-2.5 py-0.5 rounded-full text-[10px] font-semibold shadow-2xs uppercase tracking-wider"
              :class="
                task.status === 'PASSED'
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25'
                  : task.status === 'FAILED'
                    ? 'bg-destructive/10 text-destructive border border-destructive/25'
                    : 'bg-muted text-foreground border border-border/80'
              "
            >
              {{ task.status }}
            </span>

            <span
              v-if="task.results && task.results.length > 0"
              class="text-[11px] font-semibold text-muted-foreground tabular-nums ml-1"
            >
              Consensus: <strong class="text-foreground font-bold">{{ task.results[0].score }}%</strong>
            </span>
          </div>

          <!-- Secondary Line: File & Evaluator -->
          <div class="text-xs text-muted-foreground flex flex-wrap items-center gap-2">
            <span class="truncate max-w-[280px]" :title="task.data_item?.file_name">
              File: <span class="font-bold text-foreground">{{ task.data_item?.file_name || `#${task.data_item_id}` }}</span>
            </span>
            <span class="text-border/70">/</span>
            <span>Evaluator: <span class="text-foreground font-medium">{{ getEvaluatorName(task) }}</span></span>
          </div>

          <!-- Evaluation Comment (if any) -->
          <p
            v-if="task.results && task.results[0]?.comment"
            class="text-[11px] text-muted-foreground line-clamp-1 italic bg-muted/30 px-2 py-0.5 rounded-md border border-border/40 inline-block"
          >
            "{{ task.results[0].comment }}"
          </p>
        </div>
      </div>

      <!-- Action Button Group -->
      <div class="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
        <!-- Toggle Preview Button -->
        <button
          type="button"
          class="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors cursor-pointer border border-border/70 hover:border-border shadow-2xs"
          :title="showPreview ? 'Hide preview' : 'View preview'"
          @click="showPreview = !showPreview"
        >
          <EyeOff v-if="showPreview" class="size-3.5" :stroke-width="1.8" />
          <Eye v-else class="size-3.5" :stroke-width="1.8" />
          <span>{{ showPreview ? 'Hide' : 'Preview' }}</span>
        </button>

        <!-- Inspect in Canvas Workspace -->
        <button
          v-if="task.data_item_id"
          type="button"
          class="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors cursor-pointer border border-border/70 hover:border-border shadow-2xs"
          title="Open in canvas workspace"
          @click="openInspectWorkspace"
        >
          <SlidersHorizontal class="size-3.5" :stroke-width="1.8" />
          <span>Inspect</span>
        </button>

        <!-- Score Consensus Button -->
        <button
          v-if="task.status === 'PENDING' || task.status === 'UNASSIGNED'"
          type="button"
          class="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-xl text-xs font-semibold bg-foreground text-background hover:bg-foreground/90 transition-all cursor-pointer shadow-2xs active:scale-[0.98]"
          @click="emit('scoreConsensus', task)"
        >
          <Check class="size-3.5" :stroke-width="1.8" />
          <span>Score</span>
        </button>
      </div>
    </div>

    <!-- Collapsible Visualizer Area (Rendered on demand) -->
    <div v-if="showPreview" class="border-t border-border/60 p-3 bg-muted/15 animate-in fade-in duration-150">
      <AnnotationVisualizer
        :payload="latestAnnotation?.payload"
        :data-item-id="task.data_item_id"
        :file-name="task.data_item?.file_name"
        :modality="task.data_item?.modality"
        :annotation-type="latestAnnotation?.annotation_type"
      />
    </div>
  </div>
</template>
