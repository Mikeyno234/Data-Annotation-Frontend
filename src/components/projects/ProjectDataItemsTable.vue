<script setup lang="ts">
import { computed } from 'vue'
import type { DataItem, TaskStatus, Batch } from '@/types'
import { getStatusConfig } from '@/utils/design'
import Button from '@/components/ui/Button.vue'
import Badge from '@/components/ui/Badge.vue'
import Pagination from '@/components/ui/Pagination.vue'
import Select, { type SelectOption } from '@/components/ui/Select.vue'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableEmpty,
} from '@/components/ui/table'
import {
  SlidersHorizontal,
  RotateCcw,
  Play,
  Layers,
  Users,
  Clock,
  CheckCircle2,
} from 'lucide-vue-next'

const props = defineProps<{
  dataItems: DataItem[]
  batches?: Batch[]
  selectedBatchFilter?: number | ''
  selectedStatusFilter: TaskStatus | ''
  myInProgressTask: DataItem | undefined
  currentUserId?: number
  currentPage: number
  pageLimit: number
  totalDataItems: number
  totalPages: number
  isLoading: boolean
}>()

const emit = defineEmits<{
  'update:selectedStatusFilter': [val: TaskStatus | '']
  'update:selectedBatchFilter': [val: number | '']
  filterChange: []
  batchFilterChange: []
  checkoutNext: []
  openTask: [item: DataItem]
  pageChange: [page: number]
  limitChange: [limit: number]
}>()

function getInitials(name?: string): string {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function getAssigneeInfo(item: DataItem) {
  // Case 1: Actively locked/worked on
  if (item.locked_by) {
    return {
      type: 'locked' as const,
      name: item.locked_by.full_name || item.locked_by.email,
      subtext: 'In Progress',
    }
  }

  // Case 2: Has completed annotation
  if (item.annotations && item.annotations.length > 0 && item.annotations[0].annotator) {
    const annotator = item.annotations[0].annotator
    return {
      type: 'annotated' as const,
      name: annotator.full_name || annotator.email,
      subtext: 'Annotated',
    }
  }

  // Case 3: Assigned to batch workforce pool
  if (item.batch?.assignees && item.batch.assignees.length > 0) {
    return {
      type: 'pool' as const,
      pool: item.batch.assignees,
      subtext: `${item.batch.assignees.length} in Pool`,
    }
  }

  // Case 4: Unassigned
  return {
    type: 'unassigned' as const,
    subtext: 'Unassigned',
  }
}

const batchOptions = computed<SelectOption<number | ''>[]>(() => [
  { value: '', label: 'All Batches' },
  ...(props.batches || []).map((b) => ({
    value: b.id,
    label: `Batch #${b.sequence || b.id} - ${b.name}`,
  })),
])

const statusOptions: SelectOption<TaskStatus | ''>[] = [
  { value: '', label: 'All Statuses' },
  { value: 'UNASSIGNED', label: 'Unassigned', badge: 'New' },
  { value: 'IN_PROGRESS', label: 'In Progress', badge: 'Active' },
  { value: 'ANNOTATED', label: 'Awaiting Review' },
  { value: 'QA_PENDING', label: 'Awaiting QA' },
  { value: 'REWORK', label: 'Rework' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'ESCALATED', label: 'Escalated' },
]

function onBatchChange(val: number | '') {
  emit('update:selectedBatchFilter', val)
  emit('batchFilterChange')
}

function onStatusChange(val: TaskStatus | '') {
  emit('update:selectedStatusFilter', val)
  emit('filterChange')
}
</script>

<template>
  <div class="flex flex-col gap-4 mt-2">
    <!-- Toolbar: Title & Dynamic Filters -->
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div class="flex flex-wrap items-center gap-3">
        <div class="flex items-center gap-2">
          <h2 class="text-sm font-bold text-foreground tracking-tight">Data Items & Tasks</h2>
          <span class="rounded-full bg-primary/10 text-primary border border-primary/20 px-2.5 py-0.5 text-xs font-semibold tabular-nums">
            {{ totalDataItems.toLocaleString() }}
          </span>
        </div>

        <div class="flex items-center gap-2.5 ml-1">
          <!-- Custom Batch Filter -->
          <div v-if="batches && batches.length > 0" class="flex items-center gap-1.5 w-44 sm:w-56">
            <Layers class="size-3.5 text-muted-foreground shrink-0" :stroke-width="1.8" />
            <Select
              :model-value="selectedBatchFilter ?? ''"
              :options="batchOptions"
              class-name="w-full text-xs shadow-2xs"
              @change="onBatchChange"
            />
          </div>

          <!-- Custom Status Filter -->
          <div class="flex items-center gap-1.5 w-36 sm:w-44">
            <SlidersHorizontal class="size-3.5 text-muted-foreground shrink-0" :stroke-width="1.8" />
            <Select
              :model-value="selectedStatusFilter ?? ''"
              :options="statusOptions"
              class-name="w-full text-xs shadow-2xs"
              @change="onStatusChange"
            />
          </div>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <!-- Resume in-progress task banner -->
        <div v-if="myInProgressTask" class="flex items-center gap-2 rounded-xl bg-amber-500/10 px-3.5 py-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400 border border-amber-500/20 shadow-2xs">
          <RotateCcw class="size-3.5" :stroke-width="1.8" />
          <span>You have an in-progress task</span>
        </div>
        <Button size="sm" class="gap-2 shadow-xs rounded-xl h-9 px-4 font-semibold cursor-pointer" @click="emit('checkoutNext')">
          <Play class="size-3 fill-current" />
          <span>Checkout Next Task</span>
        </Button>
      </div>
    </div>

    <!-- Data Items Table (Berry MainCard style) -->
    <div class="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-xs">
      <Table>
        <TableHeader>
          <TableRow class="bg-muted/50 hover:bg-muted/50 border-b border-border/70">
            <TableHead class="px-5 py-3 text-[11px] font-semibold text-muted-foreground w-20">Task ID</TableHead>
            <TableHead class="px-5 py-3 text-[11px] font-semibold text-muted-foreground">File Name</TableHead>
            <TableHead class="px-5 py-3 text-[11px] font-semibold text-muted-foreground">Batch</TableHead>
            <TableHead class="px-5 py-3 text-[11px] font-semibold text-muted-foreground w-24">Modality</TableHead>
            <TableHead class="px-5 py-3 text-[11px] font-semibold text-muted-foreground">Status</TableHead>
            <TableHead class="px-5 py-3 text-[11px] font-semibold text-muted-foreground">Assignee</TableHead>
            <TableHead class="px-5 py-3 text-right text-[11px] font-semibold text-muted-foreground w-28">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableEmpty v-if="!isLoading && dataItems.length === 0" :colspan="7">
            No data items found for this filter.
          </TableEmpty>

          <TableRow v-for="item in dataItems" :key="item.id" class="hover:bg-muted/20 transition-colors">
            <!-- Task ID -->
            <TableCell class="px-5 py-3.5 tabular-nums font-mono text-xs font-medium text-muted-foreground">
              #{{ item.id }}
            </TableCell>

            <!-- File Name -->
            <TableCell class="px-5 py-3.5">
              <span class="text-xs font-medium text-foreground truncate block max-w-[200px]" :title="item.file_name">
                {{ item.file_name }}
              </span>
            </TableCell>

            <!-- Batch Column -->
            <TableCell class="px-5 py-3.5">
              <div class="flex items-center gap-1.5" :title="item.batch?.name ? `Batch #${item.batch?.sequence || item.batch_id}: ${item.batch.name}` : undefined">
                <span class="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-foreground border border-border/80">
                  <Layers class="size-3 text-muted-foreground" :stroke-width="1.6" />
                  <span>Batch #{{ item.batch?.sequence || item.batch_id }}</span>
                </span>
                <span v-if="item.batch?.name" class="text-[11px] text-muted-foreground truncate max-w-[110px]">
                  {{ item.batch.name }}
                </span>
              </div>
            </TableCell>

            <!-- Modality -->
            <TableCell class="px-5 py-3.5">
              <Badge variant="outline" class="capitalize text-[11px] font-normal">
                {{ item.modality.toLowerCase() }}
              </Badge>
            </TableCell>

            <!-- Status -->
            <TableCell class="px-5 py-3.5">
              <Badge :variant="getStatusConfig(item.status).badgeVariant" class="text-[11px]">
                {{ getStatusConfig(item.status).label }}
              </Badge>
            </TableCell>

            <!-- Assignee Column -->
            <TableCell class="px-5 py-3.5">
              <!-- Case 1: Locked / In Progress -->
              <template v-if="getAssigneeInfo(item).type === 'locked'">
                <div class="flex items-center gap-2" :title="`In Progress by ${getAssigneeInfo(item).name}`">
                  <div class="size-6 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center text-[10px] font-bold shrink-0">
                    {{ getInitials(getAssigneeInfo(item).name) }}
                  </div>
                  <div class="flex flex-col min-w-0">
                    <span class="text-xs font-medium text-foreground truncate max-w-[120px]">
                      {{ getAssigneeInfo(item).name }}
                    </span>
                    <span class="text-[10px] text-amber-500 font-medium flex items-center gap-1">
                      <Clock class="size-2.5" />
                      <span>In Progress</span>
                    </span>
                  </div>
                </div>
              </template>

              <!-- Case 2: Annotated -->
              <template v-else-if="getAssigneeInfo(item).type === 'annotated'">
                <div class="flex items-center gap-2" :title="`Annotated by ${getAssigneeInfo(item).name}`">
                  <div class="size-6 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center text-[10px] font-bold shrink-0">
                    {{ getInitials(getAssigneeInfo(item).name) }}
                  </div>
                  <div class="flex flex-col min-w-0">
                    <span class="text-xs font-medium text-foreground truncate max-w-[120px]">
                      {{ getAssigneeInfo(item).name }}
                    </span>
                    <span class="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                      <CheckCircle2 class="size-2.5" />
                      <span>Annotated</span>
                    </span>
                  </div>
                </div>
              </template>

              <!-- Case 3: Batch Pool -->
              <template v-else-if="getAssigneeInfo(item).type === 'pool'">
                <div
                  class="flex items-center gap-1.5"
                  :title="`Assigned Pool: ${getAssigneeInfo(item).pool?.map((u: any) => u.full_name || u.email).join(', ')}`"
                >
                  <div class="flex -space-x-1.5 overflow-hidden">
                    <div
                      v-for="user in getAssigneeInfo(item).pool?.slice(0, 3)"
                      :key="user.id"
                      class="inline-block size-5 rounded-full ring-1 ring-background bg-primary/10 text-primary flex items-center justify-center text-[9px] font-semibold"
                    >
                      {{ getInitials(user.full_name || user.email) }}
                    </div>
                  </div>
                  <span class="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
                    <Users class="size-3 text-muted-foreground" />
                    <span>{{ getAssigneeInfo(item).subtext }}</span>
                  </span>
                </div>
              </template>

              <!-- Case 4: Unassigned -->
              <template v-else>
                <span class="text-xs text-muted-foreground/60 italic">Unassigned</span>
              </template>
            </TableCell>

            <!-- Actions -->
            <TableCell class="px-5 py-3.5 text-right">
              <Button
                v-if="(item.status === 'IN_PROGRESS' || item.status === 'REWORK') && item.locked_by_id === currentUserId"
                size="sm"
                class="h-7 px-2.5 text-xs gap-1 font-medium rounded-md cursor-pointer"
                @click="emit('openTask', item)"
              >
                <RotateCcw class="size-3" :stroke-width="1.6" />
                <span>Continue</span>
              </Button>
              <Button
                v-else-if="item.status === 'UNASSIGNED' || item.status === 'REWORK'"
                variant="outline"
                size="sm"
                class="h-7 px-2.5 text-xs gap-1 font-medium rounded-md cursor-pointer"
                @click="emit('openTask', item)"
              >
                <Play class="size-2.5 fill-current" />
                <span>Annotate</span>
              </Button>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>

      <!-- Pagination Bar -->
      <div class="px-5 py-2 border-t border-muted/20">
        <Pagination
          :page="currentPage"
          :limit="pageLimit"
          :total="totalDataItems"
          :total-pages="totalPages"
          :disabled="isLoading"
          @update:page="emit('pageChange', $event)"
          @update:limit="emit('limitChange', $event)"
        />
      </div>
    </div>
  </div>
</template>
