<script setup lang="ts">
import type { Review } from '@/types'
import AnnotationVisualizer from '@/components/annotation/AnnotationVisualizer.vue'
import {
  Check,
  X,
  SlidersHorizontal,
  Clock,
  User as UserIcon,
  MessageSquare,
  FileCode2,
} from 'lucide-vue-next'

defineProps<{
  rev: Review
  selectable?: boolean
  selected?: boolean
}>()

const emit = defineEmits<{
  (e: 'inspect', taskItemId: number | undefined): void
  (e: 'approve', rev: Review): void
  (e: 'editApprove', rev: Review): void
  (e: 'reject', rev: Review): void
  (e: 'update:selected', value: boolean): void
}>()

function getAnnotatorName(rev: Review): string {
  if (rev.annotation?.annotator?.full_name) {
    return rev.annotation.annotator.full_name
  }
  if (rev.annotation?.annotator?.email) {
    return rev.annotation.annotator.email.split('@')[0]
  }
  if (rev.annotation?.annotator_id) {
    return `Annotator #${rev.annotation.annotator_id}`
  }
  return 'Workforce'
}
</script>

<template>
  <div
    class="rounded-2xl border bg-card overflow-hidden transition-all shadow-2xs"
    :class="selected ? 'border-primary/60 ring-2 ring-primary/20' : 'border-border/80 hover:border-primary/40'"
  >
    <!-- Slim Workstation Action Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 py-3 bg-muted/30 border-b border-border/80 gap-2.5">
      <!-- Left: Item Identity & Annotator Spec -->
      <div class="flex items-center gap-2.5 min-w-0">
        <!-- Checkbox for batch select -->
        <input
          v-if="selectable"
          type="checkbox"
          :checked="selected"
          @change="emit('update:selected', ($event.target as HTMLInputElement).checked)"
          class="size-4 rounded-md border-border text-primary cursor-pointer shrink-0 accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
        />

        <!-- Status Badge -->
        <span
          class="px-2.5 py-0.5 rounded-full text-[10px] font-semibold border select-none uppercase tracking-wider shadow-2xs"
          :class="
            rev.status === 'APPROVED'
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25'
              : rev.status === 'REJECTED'
                ? 'bg-destructive/10 text-destructive border-destructive/20'
                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25'
          "
        >
          {{ rev.status }}
        </span>

        <!-- File Name & Meta -->
        <div class="flex items-center gap-2 min-w-0 text-xs">
          <span class="tabular-nums font-semibold text-muted-foreground">#{{ rev.id }}</span>
          <span class="text-border/70">/</span>
          <span class="font-bold text-foreground truncate max-w-[220px]" :title="rev.annotation?.data_item?.file_name">
            {{ rev.annotation?.data_item?.file_name || `Data Item #${rev.annotation?.data_item_id || '-'}` }}
          </span>
          <span class="text-border/70 hidden sm:inline">/</span>
          <span class="hidden sm:inline-flex items-center gap-1.5 text-muted-foreground text-[11px]">
            <UserIcon class="size-3 text-muted-foreground" :stroke-width="1.6" />
            <span class="font-medium text-foreground/80">{{ getAnnotatorName(rev) }}</span>
          </span>
        </div>
      </div>

      <!-- Right: Decision Button Group -->
      <div class="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
        <button
          type="button"
          class="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors cursor-pointer border border-border/60 hover:border-border shadow-2xs"
          title="Open interactive canvas workspace"
          @click="emit('inspect', rev.annotation?.data_item_id)"
        >
          <SlidersHorizontal class="size-3" :stroke-width="1.8" />
          <span>Inspect</span>
        </button>

        <template v-if="rev.status === 'PENDING'">
          <div class="h-3 w-px bg-border mx-0.5"></div>

          <button
            type="button"
            class="inline-flex items-center gap-1 h-7 px-2.5 rounded-xl text-xs font-semibold text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer border border-border/60 hover:border-destructive/20 shadow-2xs"
            @click="emit('reject', rev)"
          >
            <X class="size-3" :stroke-width="1.8" />
            <span>Reject</span>
          </button>

          <button
            type="button"
            class="inline-flex items-center gap-1 h-7 px-2.5 rounded-xl text-xs font-semibold text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 transition-colors cursor-pointer border border-amber-500/20 shadow-2xs"
            title="Directly edit annotation payload in-place and approve"
            @click="emit('editApprove', rev)"
          >
            <FileCode2 class="size-3" :stroke-width="1.8" />
            <span>Edit & Approve</span>
          </button>

          <button
            type="button"
            class="inline-flex items-center gap-1 h-7 px-3 rounded-xl text-xs font-semibold bg-foreground text-background hover:bg-foreground/90 transition-all cursor-pointer shadow-2xs active:scale-[0.98]"
            @click="emit('approve', rev)"
          >
            <Check class="size-3" :stroke-width="1.8" />
            <span>Approve</span>
          </button>
        </template>
      </div>
    </div>

    <!-- Reviewer Rejection / Feedback Note -->
    <div
      v-if="rev.comment"
      class="px-4 py-2.5 bg-muted/40 border-b border-border/60 flex items-start gap-2.5 text-xs"
    >
      <MessageSquare class="size-3.5 text-muted-foreground shrink-0 mt-0.5" />
      <div class="space-y-0.5">
        <span class="text-[11px] font-medium text-foreground">Catatan Reviewer:</span>
        <p class="text-xs text-muted-foreground leading-relaxed">{{ rev.comment }}</p>
      </div>
    </div>

    <!-- Main Visualizer Area -->
    <div class="p-4 sm:p-5">
      <AnnotationVisualizer
        :payload="rev.annotation?.payload"
        :data-item-id="rev.annotation?.data_item_id"
        :file-name="rev.annotation?.data_item?.file_name"
        :modality="rev.annotation?.data_item?.modality"
        :annotation-type="rev.annotation?.annotation_type"
      />
    </div>
  </div>
</template>
