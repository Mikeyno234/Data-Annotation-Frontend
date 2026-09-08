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
}>()

const emit = defineEmits<{
  (e: 'inspect', taskItemId: number | undefined): void
  (e: 'approve', rev: Review): void
  (e: 'reject', rev: Review): void
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
  <div class="rounded-xl border border-border/70 bg-card overflow-hidden transition-all duration-200 hover:border-primary/40 shadow-xs">
    <!-- Slim Workstation Action Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 py-3 bg-muted/20 border-b border-border/50 gap-3">
      <!-- Left: Item Identity & Annotator Spec -->
      <div class="flex items-center gap-3 min-w-0">
        <!-- Status Badge -->
        <span
          class="px-2 py-0.5 rounded-md text-[11px] font-medium border select-none"
          :class="
            rev.status === 'APPROVED'
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25'
              : rev.status === 'REJECTED'
                ? 'bg-destructive/10 text-destructive border-destructive/25'
                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25'
          "
        >
          {{ rev.status === 'APPROVED' ? 'Approved' : rev.status === 'REJECTED' ? 'Rejected' : rev.status === 'PENDING' ? 'Pending' : rev.status }}
        </span>

        <!-- File Name & Meta -->
        <div class="flex items-center gap-2 min-w-0 text-xs">
          <span class="font-mono text-muted-foreground/80">#{{ rev.id }}</span>
          <span class="text-border/60">•</span>
          <span class="font-semibold text-foreground truncate max-w-[220px]" :title="rev.annotation?.data_item?.file_name">
            {{ rev.annotation?.data_item?.file_name || `Data Item #${rev.annotation?.data_item_id || '-'}` }}
          </span>
          <span class="text-border/60 hidden sm:inline">•</span>
          <span class="hidden sm:inline-flex items-center gap-1 text-muted-foreground/80">
            <UserIcon class="size-3 text-muted-foreground/60" />
            <span class="font-medium text-foreground/90">{{ getAnnotatorName(rev) }}</span>
          </span>
        </div>
      </div>

      <!-- Right: Decision Button Group -->
      <div class="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
        <button
          type="button"
          class="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer"
          title="Open interactive canvas workspace"
          @click="emit('inspect', rev.annotation?.data_item_id)"
        >
          <SlidersHorizontal class="size-3" />
          <span>Inspect</span>
        </button>

        <template v-if="rev.status === 'PENDING'">
          <div class="h-3.5 w-px bg-border/60 mx-0.5"></div>

          <button
            type="button"
            class="inline-flex items-center gap-1 h-7 px-2.5 rounded-md text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
            @click="emit('reject', rev)"
          >
            <X class="size-3 stroke-[2.5]" />
            <span>Reject</span>
          </button>

          <button
            type="button"
            class="inline-flex items-center gap-1.5 h-7 px-3 rounded-md text-xs font-medium bg-foreground text-background hover:opacity-90 transition-opacity cursor-pointer shadow-2xs active:scale-[0.98]"
            @click="emit('approve', rev)"
          >
            <Check class="size-3.5 stroke-[2.5]" />
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
