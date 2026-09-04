<script setup lang="ts">
import { computed } from 'vue'
import Modal from '@/components/ui/Modal.vue'
import Button from '@/components/ui/Button.vue'
import Badge from '@/components/ui/Badge.vue'
import { Plus, Minus } from 'lucide-vue-next'

const props = defineProps<{
  showModal: boolean
  evalScore: number
  evalPassed: boolean
  evalIssueType: string
  evalComment: string
  scorePresets: Array<{ label: string; value: number }>
}>()

const emit = defineEmits<{
  (e: 'update:showModal', val: boolean): void
  (e: 'update:evalScore', val: number): void
  (e: 'update:evalPassed', val: boolean): void
  (e: 'update:evalIssueType', val: string): void
  (e: 'update:evalComment', val: string): void
  (e: 'adjustScore', delta: number): void
  (e: 'setPreset', val: number): void
  (e: 'submit'): void
}>()

const scoreGrade = computed(() => {
  const score = props.evalScore
  if (score >= 90) return { label: 'Excellent Consensus', variant: 'success' as const, color: 'text-emerald-500' }
  if (score >= 75) return { label: 'Good Consensus', variant: 'info' as const, color: 'text-sky-500' }
  if (score >= 60) return { label: 'Marginal Consensus', variant: 'warning' as const, color: 'text-amber-500' }
  return { label: 'Substandard / Fail', variant: 'destructive' as const, color: 'text-rose-500' }
})
</script>

<template>
  <Modal
    :open="showModal"
    title="Submit QA Consensus Evaluation"
    description="Score inter-annotator agreement and boundary precision"
    @close="emit('update:showModal', false)"
  >
    <form class="space-y-4" @submit.prevent="emit('submit')">
      <!-- Consensus Score Input & Quick Presets -->
      <div class="space-y-2.5">
        <div class="flex items-center justify-between">
          <label class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Agreement Score (%)
          </label>
          <Badge :variant="scoreGrade.variant" class="text-[11px] font-semibold py-0.5 px-2.5">
            {{ scoreGrade.label }}
          </Badge>
        </div>

        <!-- Stepper & Direct Precision Input Box -->
        <div class="flex items-center gap-2">
          <button
            type="button"
            class="flex size-10 items-center justify-center rounded-xl bg-muted/70 hover:bg-muted text-foreground transition-all cursor-pointer active:scale-95 border border-border/40"
            title="Decrease by 1%"
            @click="emit('adjustScore', -1)"
          >
            <Minus class="size-4" />
          </button>

          <div class="relative flex-1">
            <input
              :value="evalScore"
              type="number"
              min="0"
              max="100"
              step="0.1"
              class="h-10 w-full rounded-xl border border-border/70 bg-card px-4 pr-9 text-base font-bold text-foreground text-center focus:outline-none focus:ring-2 focus:ring-primary/40 shadow-inner"
              @input="emit('update:evalScore', Number(($event.target as HTMLInputElement).value))"
            />
            <span class="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">
              %
            </span>
          </div>

          <button
            type="button"
            class="flex size-10 items-center justify-center rounded-xl bg-muted/70 hover:bg-muted text-foreground transition-all cursor-pointer active:scale-95 border border-border/40"
            title="Increase by 1%"
            @click="emit('adjustScore', 1)"
          >
            <Plus class="size-4" />
          </button>
        </div>

        <!-- Quick Preset Chips -->
        <div class="flex flex-wrap items-center gap-1.5 pt-1">
          <button
            v-for="preset in scorePresets"
            :key="preset.value"
            type="button"
            class="px-2.5 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer select-none"
            :class="
              evalScore === preset.value
                ? 'border-primary bg-primary/10 text-primary font-bold shadow-2xs'
                : 'border-border/50 bg-muted/40 text-muted-foreground hover:text-foreground hover:bg-muted'
            "
            @click="emit('setPreset', preset.value)"
          >
            {{ preset.label }}
          </button>
        </div>
      </div>

      <!-- Issue Category Dropdown -->
      <div class="space-y-1.5">
        <label class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Issue Category
        </label>
        <select
          :value="evalIssueType"
          class="h-10 w-full rounded-xl border border-border/60 bg-muted/40 px-3.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 shadow-inner"
          @change="emit('update:evalIssueType', ($event.target as HTMLSelectElement).value)"
        >
          <option value="NONE">None (High Quality & Agreement)</option>
          <option value="BOUNDARY_MISMATCH">Boundary Mismatch (Time / Bounding Box Alignment)</option>
          <option value="SPEAKER_CONFUSION">Speaker Label Confusion</option>
          <option value="TRANSCRIPT_TYPO">Transcript Typo / Hallucination</option>
        </select>
      </div>

      <!-- Audit Notes Textarea -->
      <div class="space-y-1.5">
        <label class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Audit Notes
        </label>
        <textarea
          :value="evalComment"
          rows="2"
          placeholder="Consensus notes and feedback..."
          class="w-full rounded-xl border border-border/60 bg-muted/40 p-3 text-xs text-foreground placeholder:text-muted-foreground/60 focus:bg-card focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none shadow-inner"
          @input="emit('update:evalComment', ($event.target as HTMLTextAreaElement).value)"
        ></textarea>
      </div>

      <!-- Modal Actions -->
      <div class="flex items-center justify-end gap-2.5 pt-2">
        <Button variant="ghost" type="button" class="rounded-xl text-xs h-9 cursor-pointer" @click="emit('update:showModal', false)">
          Cancel
        </Button>
        <Button type="submit" class="rounded-xl text-xs h-9 font-semibold shadow-md cursor-pointer">
          Submit Evaluation
        </Button>
      </div>
    </form>
  </Modal>
</template>
