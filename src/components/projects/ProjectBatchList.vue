<script setup lang="ts">
import type { Batch } from '@/types'
import Button from '@/components/ui/Button.vue'
import Badge from '@/components/ui/Badge.vue'
import Card from '@/components/ui/Card.vue'
import CardContent from '@/components/ui/CardContent.vue'
import {
  Layers,
  Users,
  UploadCloud,
  Play,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
} from 'lucide-vue-next'

defineProps<{
  batches: { batch: Batch; datasetName: string }[]
  canManageWorkforce: boolean
  canUploadDataset: boolean
}>()

const emit = defineEmits<{
  (e: 'createBatch'): void
  (e: 'assignBatch', batch: Batch): void
  (e: 'uploadToBatch', batchId: number): void
  (e: 'launchBatch', batchId: number): void
}>()

function getPriorityVariant(priority?: string): 'default' | 'secondary' | 'warning' | 'destructive' {
  const p = (priority || '').toUpperCase()
  if (p === 'HIGH' || p === 'URGENT') return 'destructive'
  if (p === 'MEDIUM') return 'warning'
  return 'secondary'
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <div>
        <h3 class="text-sm font-semibold text-foreground tracking-tight">Workforce Batches</h3>
        <p class="text-xs text-muted-foreground">
          Assigned annotator allocations and item subsets for parallel labeling
        </p>
      </div>

      <Button
        v-if="canManageWorkforce"
        variant="outline"
        size="sm"
        class="gap-1.5 text-xs h-8"
        @click="emit('createBatch')"
      >
        <Plus class="size-3.5" :stroke-width="1.6" />
        <span>New Batch</span>
      </Button>
    </div>

    <!-- Empty State -->
    <div
      v-if="batches.length === 0"
      class="rounded-2xl border border-dashed border-border/80 bg-muted/10 p-8 text-center"
    >
      <Layers class="mx-auto size-8 text-muted-foreground/60" :stroke-width="1.4" />
      <h4 class="mt-2 text-xs font-semibold text-foreground">No batches created yet</h4>
      <p class="text-[11px] text-muted-foreground max-w-sm mx-auto mt-1">
        Batches divide datasets into manageable workloads assigned to annotator teams.
      </p>
      <Button
        v-if="canManageWorkforce"
        variant="outline"
        size="sm"
        class="mt-4 gap-1.5 text-xs h-7.5"
        @click="emit('createBatch')"
      >
        <Plus class="size-3.5" :stroke-width="1.6" />
        <span>Create First Batch</span>
      </Button>
    </div>

    <!-- Batch Cards Grid (Coss UI Card Frames) -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-3.5">
      <Card
        v-for="item in batches"
        :key="item.batch.id"
        class="hover:border-border transition-all duration-150"
      >
        <CardContent class="p-4 space-y-3">
          <!-- Batch Header -->
          <div class="flex items-start justify-between gap-2">
            <div class="space-y-1 min-w-0">
              <div class="flex items-center gap-2">
                <span class="font-semibold text-xs text-foreground truncate">
                  {{ item.batch.name }}
                </span>
                <Badge :variant="getPriorityVariant(item.batch.priority)">
                  {{ item.batch.priority || 'NORMAL' }}
                </Badge>
              </div>
              <div class="text-[11px] text-muted-foreground flex items-center gap-1.5">
                <span>Dataset: <strong class="text-foreground/80 font-medium">{{ item.datasetName }}</strong></span>
              </div>
            </div>

            <Badge variant="secondary">
              {{ item.batch.status || 'ACTIVE' }}
            </Badge>
          </div>

          <!-- Assignees Info -->
          <div class="flex items-center justify-between pt-2 border-t border-border/50 text-xs">
            <div class="flex items-center gap-1.5 text-muted-foreground">
              <Users class="size-3.5" :stroke-width="1.6" />
              <span v-if="item.batch.assignees && item.batch.assignees.length > 0" class="text-foreground font-medium">
                {{ item.batch.assignees.length }} annotator(s)
              </span>
              <span v-else class="text-muted-foreground/80 italic">
                Unassigned
              </span>
            </div>

            <!-- Action Buttons -->
            <div class="flex items-center gap-1.5">
              <Button
                v-if="canUploadDataset"
                variant="ghost"
                size="sm"
                class="h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground"
                title="Add Data to this Batch"
                @click="emit('uploadToBatch', item.batch.id)"
              >
                <UploadCloud class="size-3.5" :stroke-width="1.6" />
              </Button>

              <Button
                v-if="canManageWorkforce"
                variant="outline"
                size="sm"
                class="h-7 px-2.5 text-[11px] gap-1"
                @click="emit('assignBatch', item.batch)"
              >
                <Users class="size-3" :stroke-width="1.6" />
                <span>Assign</span>
              </Button>

              <Button
                variant="secondary"
                size="sm"
                class="h-7 px-2 text-[11px] gap-1 text-foreground"
                @click="emit('launchBatch', item.batch.id)"
              >
                <Play class="size-3 text-primary" :stroke-width="1.8" />
                <span>Start</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
