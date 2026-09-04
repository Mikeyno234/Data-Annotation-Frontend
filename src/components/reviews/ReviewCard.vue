<script setup lang="ts">
import type { Review } from '@/types'
import Card from '@/components/ui/Card.vue'
import CardContent from '@/components/ui/CardContent.vue'
import Badge from '@/components/ui/Badge.vue'
import Button from '@/components/ui/Button.vue'
import AnnotationVisualizer from '@/components/annotation/AnnotationVisualizer.vue'
import { FileCheck2, Check, X, SlidersHorizontal } from 'lucide-vue-next'

defineProps<{
  rev: Review
}>()

const emit = defineEmits<{
  (e: 'inspect', taskItemId: number | undefined): void
  (e: 'approve', rev: Review): void
  (e: 'reject', rev: Review): void
}>()
</script>

<template>
  <Card class="bg-card/95 border border-border/60 hover:border-primary/40 hover:shadow-md transition-all duration-200">
    <CardContent class="p-6">
      <div class="flex flex-wrap items-center justify-between gap-4 pb-4">
        <div class="flex items-center gap-3">
          <div
            class="flex size-11 items-center justify-center rounded-2xl border shrink-0"
            :class="
              rev.status === 'APPROVED'
                ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/25'
                : rev.status === 'REJECTED'
                  ? 'bg-destructive/10 text-destructive border-destructive/25'
                  : 'bg-amber-500/10 text-amber-500 border-amber-500/25'
            "
          >
            <FileCheck2 class="size-5" />
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h3 class="text-sm font-bold text-foreground font-mono">Review Item #{{ rev.id }}</h3>
              <Badge
                :variant="
                  rev.status === 'APPROVED'
                    ? 'success'
                    : rev.status === 'REJECTED'
                      ? 'destructive'
                      : 'warning'
                "
                :dot="rev.status === 'APPROVED'"
                class="text-[10px] font-mono font-bold"
              >
                {{ rev.status }}
              </Badge>
            </div>
            <div class="mt-1 text-xs text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <span>Annotation: <strong class="font-mono text-foreground font-medium">#{{ rev.annotation_id }}</strong></span>
              <span class="text-muted-foreground/40">•</span>
              <span>Annotator: <span class="font-medium text-foreground">{{ rev.annotation?.annotator_id || 'Workforce' }}</span></span>
              <span v-if="rev.annotation?.data_item?.file_name" class="flex items-center gap-1.5">
                <span class="text-muted-foreground/40">•</span>
                <span class="font-medium text-foreground truncate max-w-xs">{{ rev.annotation.data_item.file_name }}</span>
              </span>
            </div>
            <div v-if="rev.comment" class="mt-1.5 text-xs text-foreground/85 bg-muted/30 border border-border/30 rounded-lg px-2.5 py-1">
              Feedback: "{{ rev.comment }}"
            </div>
          </div>
        </div>

        <!-- Reviewer Actions -->
        <div class="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            class="gap-1.5 text-xs font-semibold rounded-xl h-9 px-3.5"
            title="Open this data item in the full interactive workspace editor"
            @click="emit('inspect', rev.annotation?.data_item_id)"
          >
            <SlidersHorizontal class="size-3.5 text-primary" />
            <span>Inspect in Workspace</span>
          </Button>

          <Button
            v-if="rev.status === 'PENDING'"
            variant="destructive"
            size="sm"
            class="gap-1.5 text-xs font-semibold rounded-xl h-9 px-4"
            @click="emit('reject', rev)"
          >
            <X class="size-3.5" />
            <span>Reject & Rework</span>
          </Button>

          <Button
            v-if="rev.status === 'PENDING'"
            size="sm"
            class="gap-1.5 text-xs font-semibold rounded-xl h-9 px-4"
            @click="emit('approve', rev)"
          >
            <Check class="size-3.5" />
            <span>Approve Quality</span>
          </Button>
        </div>
      </div>

      <!-- Interactive Annotation Visualizer -->
      <div class="mt-4 pt-4 border-t border-border/40">
        <AnnotationVisualizer
          :payload="rev.annotation?.payload"
          :data-item-id="rev.annotation?.data_item_id"
          :file-name="rev.annotation?.data_item?.file_name"
          :modality="rev.annotation?.data_item?.modality"
          :annotation-type="rev.annotation?.annotation_type"
        />
      </div>
    </CardContent>
  </Card>
</template>
