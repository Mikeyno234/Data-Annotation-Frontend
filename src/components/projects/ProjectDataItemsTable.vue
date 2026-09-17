<script setup lang="ts">
import type { DataItem, TaskStatus, Batch } from '@/types'
import { getStatusConfig } from '@/utils/design'
import Button from '@/components/ui/Button.vue'
import Badge from '@/components/ui/Badge.vue'
import Card from '@/components/ui/Card.vue'
import Pagination from '@/components/ui/Pagination.vue'
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
</script>

<template>
  <div class="flex flex-col gap-4 mt-2">
    <!-- Toolbar: Title & Dynamic Filters -->
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div class="flex flex-wrap items-center gap-3">
        <div class="flex items-center gap-2">
          <h2 class="text-base font-semibold text-foreground tracking-tight">Data Items & Tasks</h2>
          <span class="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
            {{ totalDataItems.toLocaleString() }}
          </span>
        </div>

        <div class="flex items-center gap-2 ml-2">
          <!-- Batch Filter -->
          <div v-if="batches && batches.length > 0" class="flex items-center gap-1.5">
            <Layers class="size-3 text-muted-foreground" :stroke-width="1.6" />
            <select
              :value="selectedBatchFilter"
              class="h-8 rounded-md border border-border bg-card px-2.5 text-xs text-foreground focus-visible:outline-none focus-visible:border-foreground/40 focus-visible:ring-1 focus-visible:ring-foreground/15 cursor-pointer transition-all"
              @change="emit('update:selectedBatchFilter', ($event.target as HTMLSelectElement).value ? Number(($event.target as HTMLSelectElement).value) : ''); emit('batchFilterChange')"
            >
              <option value="">All Batches</option>
              <option v-for="b in batches" :key="b.id" :value="b.id">
                Batch #{{ b.sequence || b.id }} - {{ b.name }}
              </option>
            </select>
          </div>

          <!-- Status Filter -->
          <div class="flex items-center gap-1.5">
            <SlidersHorizontal class="size-3 text-muted-foreground" :stroke-width="1.6" />
            <select
              :value="selectedStatusFilter"
              class="h-8 rounded-md border border-border bg-card px-2.5 text-xs text-foreground focus-visible:outline-none focus-visible:border-foreground/40 focus-visible:ring-1 focus-visible:ring-foreground/15 cursor-pointer transition-all"
              @change="emit('update:selectedStatusFilter', ($event.target as HTMLSelectElement).value as TaskStatus | ''); emit('filterChange')"
            >
              <option value="">All Statuses</option>
              <option value="UNASSIGNED">Unassigned</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="ANNOTATED">Awaiting Review</option>
              <option value="QA_PENDING">Awaiting QA</option>
              <option value="REWORK">Rework</option>
              <option value="COMPLETED">Completed</option>
              <option value="ESCALATED">Escalated</option>
            </select>
          </div>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <!-- Resume in-progress task banner -->
        <div v-if="myInProgressTask" class="flex items-center gap-2 rounded-md bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-600 dark:text-amber-400 border border-amber-500/20">
          <RotateCcw class="size-3.5" :stroke-width="1.6" />
          <span>You have an in-progress task</span>
        </div>
        <Button size="sm" class="gap-1.5 shadow-2xs rounded-md h-8 px-3.5 cursor-pointer" @click="emit('checkoutNext')">
          <Play class="size-3 fill-current" />
          <span>Checkout Next Task</span>
        </Button>
      </div>
    </div>

    <!-- Data Items Table -->
    <Card class="overflow-hidden shadow-2xs border border-border">
      <Table>
        <TableHeader>
          <TableRow class="bg-muted/40 hover:bg-muted/40">
            <TableHead class="px-5 py-3 text-[11px] font-medium text-muted-foreground w-20">Task ID</TableHead>
            <TableHead class="px-5 py-3 text-[11px] font-medium text-muted-foreground">File Name</TableHead>
            <TableHead class="px-5 py-3 text-[11px] font-medium text-muted-foreground">Batch</TableHead>
            <TableHead class="px-5 py-3 text-[11px] font-medium text-muted-foreground w-24">Modality</TableHead>
            <TableHead class="px-5 py-3 text-[11px] font-medium text-muted-foreground">Status</TableHead>
            <TableHead class="px-5 py-3 text-[11px] font-medium text-muted-foreground">Assignee</TableHead>
            <TableHead class="px-5 py-3 text-right text-[11px] font-medium text-muted-foreground w-28">Actions</TableHead>
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
    </Card>
  </div>
</template>
