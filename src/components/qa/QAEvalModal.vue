<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import Modal from '@/components/ui/Modal.vue'
import AnnotationVisualizer from '@/components/annotation/AnnotationVisualizer.vue'
import type { QATask, QAIssueTypeOption } from '@/types'
import { Eye, SlidersHorizontal } from 'lucide-vue-next'

const props = withDefaults(
  defineProps<{
    showModal: boolean
    task?: QATask | null
    evalScore: number
    evalPassed: boolean
    evalIssueType: string
    customIssueReason?: string
    evalComment: string
    scorePresets: Array<{ label: string; value: number }>
    issueOptions?: QAIssueTypeOption[]
  }>(),
  {
    task: null,
    customIssueReason: '',
    issueOptions: () => [],
  }
)

const emit = defineEmits<{
  (e: 'update:showModal', val: boolean): void
  (e: 'update:evalScore', val: number): void
  (e: 'update:evalPassed', val: boolean): void
  (e: 'update:evalIssueType', val: string): void
  (e: 'update:customIssueReason', val: string): void
  (e: 'update:evalComment', val: string): void
  (e: 'adjustScore', delta: number): void
  (e: 'setPreset', val: number): void
  (e: 'submit'): void
}>()

const latestAnnotation = computed(() => {
  const anns = props.task?.data_item?.annotations
  if (anns && anns.length > 0) {
    return anns[0]
  }
  return null
})

const effectiveIssueOptions = computed<QAIssueTypeOption[]>(() => {
  if (props.issueOptions && props.issueOptions.length > 0) {
    return props.issueOptions
  }
  return [
    { value: 'NONE', label: 'None (High Quality & Agreement)', description: 'Full agreement across annotators' },
    { value: 'BOUNDARY_MISMATCH', label: 'Boundary Mismatch (Spatial / Temporal)', description: 'IoU below threshold or boundary offset' },
    { value: 'SPEAKER_CONFUSION', label: 'Speaker Label Confusion', description: 'Diarization misattribution' },
    { value: 'TRANSCRIPT_TYPO', label: 'Transcript Typo / Hallucination', description: 'Spelling, omissions, or hallucinated words' },
    { value: 'OTHER', label: 'Others (Specify Custom Reason)', description: 'Custom unlisted discrepancy' },
  ]
})
</script>

<template>
  <Modal
    :open="showModal"
    title="Consensus Evaluation"
    description="Score agreement and boundary precision"
    max-width="max-w-xl"
    @close="emit('update:showModal', false)"
  >
    <form class="space-y-3.5 py-1" @submit.prevent="emit('submit')">
      <!-- Visual Preview of Data Item & Annotations (Compact) -->
      <div v-if="task" class="rounded-lg border border-border/70 overflow-hidden bg-muted/15">
        <div class="flex items-center justify-between px-3 py-1.5 bg-muted/30 border-b border-border/60 text-xs">
          <div class="flex items-center gap-1.5 truncate text-muted-foreground">
            <Eye class="size-3 text-foreground shrink-0" />
            <span class="font-medium text-foreground truncate text-[11px]">
              {{ task.data_item?.file_name || `Item #${task.data_item_id}` }}
            </span>
            <span
              v-if="task.data_item?.modality"
              class="px-1 py-0.2 rounded text-[9px] font-medium bg-muted text-muted-foreground uppercase"
            >
              {{ task.data_item.modality }}
            </span>
          </div>
          <RouterLink
            v-if="task.data_item_id"
            :to="`/workspace/${task.data_item_id}`"
            target="_blank"
            class="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 shrink-0"
          >
            <span>Canvas</span>
            <SlidersHorizontal class="size-2.5" />
          </RouterLink>
        </div>
        <div class="p-2 max-h-56 overflow-y-auto">
          <AnnotationVisualizer
            :payload="latestAnnotation?.payload"
            :data-item-id="task.data_item_id"
            :file-name="task.data_item?.file_name"
            :modality="task.data_item?.modality"
            :annotation-type="latestAnnotation?.annotation_type"
          />
        </div>
      </div>

      <!-- Agreement Score & Presets -->
      <div class="space-y-2">
        <div class="flex items-center justify-between text-xs">
          <label class="font-medium text-foreground">
            Agreement Score (%)
          </label>
          <span
            class="text-[11px] font-medium"
            :class="evalScore >= 75 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'"
          >
            {{ evalScore >= 75 ? 'Meets Threshold' : 'Discrepancy / Below Threshold' }}
          </span>
        </div>

        <div class="flex items-center gap-3">
          <input
            :value="evalScore"
            type="range"
            min="0"
            max="100"
            step="0.5"
            class="flex-1 accent-foreground h-1.5 bg-muted rounded-full cursor-pointer"
            @input="emit('update:evalScore', Number(($event.target as HTMLInputElement).value))"
          />
          <div class="relative w-20">
            <input
              :value="evalScore"
              type="number"
              min="0"
              max="100"
              step="0.5"
              class="h-8 w-full rounded-md border border-border bg-card px-2 text-right text-xs font-semibold tabular-nums focus:outline-none focus:ring-1 focus:ring-foreground"
              @input="emit('update:evalScore', Number(($event.target as HTMLInputElement).value))"
            />
          </div>
        </div>

        <!-- Preset Chips -->
        <div class="flex items-center gap-1.5 pt-0.5">
          <button
            v-for="preset in scorePresets"
            :key="preset.value"
            type="button"
            class="px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer"
            :class="
              evalScore === preset.value
                ? 'bg-foreground text-background font-semibold'
                : 'bg-muted/60 text-muted-foreground hover:text-foreground'
            "
            @click="emit('setPreset', preset.value)"
          >
            {{ preset.label }}
          </button>
        </div>
      </div>

      <!-- Issue Category Dropdown -->
      <div class="space-y-1">
        <label class="text-xs font-medium text-foreground">
          Issue Category
        </label>
        <select
          :value="evalIssueType"
          class="h-8 w-full rounded-md border border-border bg-card px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-foreground"
          @change="emit('update:evalIssueType', ($event.target as HTMLSelectElement).value)"
        >
          <option
            v-for="opt in effectiveIssueOptions"
            :key="opt.value"
            :value="opt.value"
          >
            {{ opt.label }}
          </option>
        </select>
      </div>

      <!-- Custom Reason input when 'OTHER' is selected -->
      <div v-if="evalIssueType === 'OTHER'" class="space-y-1 animate-in fade-in duration-150">
        <label class="text-xs font-medium text-foreground">
          Specify Custom Reason <span class="text-destructive">*</span>
        </label>
        <input
          :value="customIssueReason"
          type="text"
          required
          placeholder="e.g. Incomplete boundary coverage, ambiguous utterance..."
          class="h-8 w-full rounded-md border border-border bg-card px-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-foreground"
          @input="emit('update:customIssueReason', ($event.target as HTMLInputElement).value)"
        />
      </div>

      <!-- Audit Notes Textarea -->
      <div class="space-y-1">
        <label class="text-xs font-medium text-foreground">
          Audit Notes (Optional)
        </label>
        <textarea
          :value="evalComment"
          rows="2"
          placeholder="Consensus notes..."
          class="w-full rounded-md border border-border bg-card p-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-foreground resize-none"
          @input="emit('update:evalComment', ($event.target as HTMLTextAreaElement).value)"
        ></textarea>
      </div>

      <!-- Modal Actions -->
      <div class="flex items-center justify-end gap-2 pt-2 border-t border-border/60">
        <button
          type="button"
          class="h-8 px-3 rounded text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          @click="emit('update:showModal', false)"
        >
          Cancel
        </button>
        <button
          type="submit"
          class="h-8 px-3.5 rounded text-xs font-medium bg-foreground text-background hover:bg-foreground/90 transition-all cursor-pointer active:scale-[0.98]"
        >
          Submit Evaluation
        </button>
      </div>
    </form>
  </Modal>
</template>
