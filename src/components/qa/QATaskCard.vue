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
</script>

<template>
  <div
    class="rounded-lg border bg-card transition-all duration-150 overflow-hidden"
    :class="selected ? 'border-foreground/50 ring-1 ring-foreground/20' : 'border-border/70 hover:border-foreground/30 shadow-2xs'"
  >
    <!-- Main Task Row -->
    <div class="p-3.5 sm:p-4 flex flex-wrap items-center justify-between gap-3">
      <div class="flex items-center gap-3 min-w-0 flex-1">
        <!-- Optional checkbox for batch actions -->
        <input
          v-if="selectable"
          type="checkbox"
          :checked="selected"
          @change="emit('update:selected', ($event.target as HTMLInputElement).checked)"
          class="size-3.5 rounded border-border text-foreground focus:ring-0 cursor-pointer shrink-0 accent-foreground"
        />

        <!-- Task Metadata Strip -->
        <div class="min-w-0 space-y-1">
          <div class="flex items-center gap-2 flex-wrap text-xs">
            <span class="font-semibold text-foreground tracking-tight tabular-nums">
              #{{ task.id }}
            </span>

            <span
              v-if="task.data_item?.modality"
              class="px-1.5 py-0.2 rounded text-[10px] font-medium bg-muted text-muted-foreground uppercase"
            >
              {{ task.data_item.modality }}
            </span>

            <!-- Subtle Status Pill -->
            <span
              class="px-1.5 py-0.2 rounded text-[10px] font-medium"
              :class="
                task.status === 'PASSED'
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : task.status === 'FAILED'
                    ? 'bg-destructive/10 text-destructive'
                    : 'bg-muted text-foreground'
              "
            >
              {{ task.status }}
            </span>

            <span
              v-if="task.results && task.results.length > 0"
              class="text-[11px] font-medium text-muted-foreground tabular-nums"
            >
              Consensus: <strong class="text-foreground font-semibold">{{ task.results[0].score }}%</strong>
            </span>
          </div>

          <!-- Secondary Line: File & Evaluator -->
          <div class="text-xs text-muted-foreground flex flex-wrap items-center gap-2">
            <span class="truncate max-w-[280px]" :title="task.data_item?.file_name">
              File: <span class="font-medium text-foreground">{{ task.data_item?.file_name || `#${task.data_item_id}` }}</span>
            </span>
            <span class="text-border">·</span>
            <span>Evaluator: <span class="text-foreground">{{ getEvaluatorName(task) }}</span></span>
          </div>

          <!-- Evaluation Comment (if any) -->
          <p
            v-if="task.results && task.results[0]?.comment"
            class="text-[11px] text-muted-foreground line-clamp-1 italic"
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
          class="inline-flex items-center gap-1 h-7 px-2 rounded text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          :title="showPreview ? 'Hide preview' : 'View preview'"
          @click="showPreview = !showPreview"
        >
          <EyeOff v-if="showPreview" class="size-3.5" :stroke-width="1.6" />
          <Eye v-else class="size-3.5" :stroke-width="1.6" />
          <span>{{ showPreview ? 'Hide' : 'Preview' }}</span>
        </button>

        <!-- Inspect in Canvas Workspace -->
        <button
          v-if="task.data_item_id"
          type="button"
          class="inline-flex items-center gap-1 h-7 px-2 rounded text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          title="Open in canvas workspace"
          @click="openInspectWorkspace"
        >
          <SlidersHorizontal class="size-3" :stroke-width="1.6" />
          <span>Inspect</span>
        </button>

        <!-- Score Consensus Button -->
        <button
          v-if="task.status === 'PENDING' || task.status === 'UNASSIGNED'"
          type="button"
          class="inline-flex items-center gap-1.5 h-7 px-3 rounded text-xs font-medium bg-foreground text-background hover:bg-foreground/90 transition-all cursor-pointer active:scale-[0.98]"
          @click="emit('scoreConsensus', task)"
        >
          <Check class="size-3.5" :stroke-width="1.6" />
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
