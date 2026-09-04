<script setup lang="ts">
import type { QATask } from '@/types'
import Card from '@/components/ui/Card.vue'
import CardContent from '@/components/ui/CardContent.vue'
import Badge from '@/components/ui/Badge.vue'
import Button from '@/components/ui/Button.vue'
import { CheckCircle2, Check, ShieldCheck, AlertCircle, Clock } from 'lucide-vue-next'

defineProps<{
  task: QATask
}>()

const emit = defineEmits<{
  (e: 'scoreConsensus', task: QATask): void
}>()
</script>

<template>
  <Card class="bg-card/95 border border-border/60 hover:border-primary/40 hover:shadow-md transition-all duration-200">
    <CardContent class="p-5 flex flex-wrap items-center justify-between gap-4">
      <div class="flex items-center gap-3.5">
        <div
          class="flex size-11 items-center justify-center rounded-2xl border shrink-0"
          :class="
            task.status === 'PASSED'
              ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/25'
              : task.status === 'FAILED'
                ? 'bg-destructive/10 text-destructive border-destructive/25'
                : 'bg-sky-500/10 text-sky-500 border-sky-500/25'
          "
        >
          <ShieldCheck v-if="task.status === 'PASSED'" class="size-5" />
          <AlertCircle v-else-if="task.status === 'FAILED'" class="size-5" />
          <Clock v-else class="size-5" />
        </div>
        <div>
          <div class="flex items-center gap-2">
            <h3 class="text-sm font-bold text-foreground font-mono">QA-Task #{{ task.id }}</h3>
            <Badge
              :variant="
                task.status === 'PASSED'
                  ? 'success'
                  : task.status === 'FAILED'
                    ? 'destructive'
                    : 'info'
              "
              :dot="task.status === 'PASSED'"
              class="text-[10px] font-mono font-bold"
            >
              {{ task.status }}
            </Badge>
          </div>
          <div class="mt-1 text-xs text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1">
            <span>Item: <strong class="font-mono text-foreground font-medium">#{{ task.data_item_id }}</strong></span>
            <span class="text-muted-foreground/40">•</span>
            <span>Evaluator: <span class="font-medium text-foreground">{{ task.assigned_to_id ? `#${task.assigned_to_id}` : 'Auto-Evaluator' }}</span></span>
            <span v-if="task.results && task.results.length > 0" class="flex items-center gap-1.5 ml-1">
              <span class="text-muted-foreground/40">•</span>
              <span class="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] font-bold text-foreground">
                {{ task.results[0].score }}%
              </span>
            </span>
          </div>
          <div v-if="task.results && task.results[0]?.comment" class="mt-1.5 text-xs text-foreground/85 bg-muted/30 border border-border/30 rounded-lg px-2.5 py-1">
            "{{ task.results[0].comment }}"
          </div>
        </div>
      </div>

      <!-- Action Button -->
      <Button
        v-if="task.status === 'PENDING' || task.status === 'UNASSIGNED'"
        size="sm"
        class="gap-1.5 text-xs font-semibold rounded-xl h-9 px-4"
        @click="emit('scoreConsensus', task)"
      >
        <Check class="size-3.5" />
        <span>Score Consensus</span>
      </Button>
    </CardContent>
  </Card>
</template>
