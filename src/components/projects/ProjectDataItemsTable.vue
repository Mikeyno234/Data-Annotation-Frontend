<script setup lang="ts">
import type { DataItem, TaskStatus } from '@/types'
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
} from 'lucide-vue-next'

defineProps<{
  dataItems: DataItem[]
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
  filterChange: []
  checkoutNext: []
  openTask: [item: DataItem]
  pageChange: [page: number]
  limitChange: [limit: number]
}>()
</script>

<template>
  <div class="flex flex-col gap-4 mt-2">
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <h2 class="text-base font-semibold text-foreground tracking-tight">Data Items & Tasks</h2>
        <!-- Status filter -->
        <div class="flex items-center gap-1.5 ml-2">
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

    <Card class="overflow-hidden shadow-2xs border border-border">
      <Table>
        <TableHeader>
          <TableRow class="bg-muted/40 hover:bg-muted/40">
            <TableHead class="px-5 py-3 text-[11px] font-medium text-muted-foreground">Task ID</TableHead>
            <TableHead class="px-5 py-3 text-[11px] font-medium text-muted-foreground">File Name</TableHead>
            <TableHead class="px-5 py-3 text-[11px] font-medium text-muted-foreground">Modality</TableHead>
            <TableHead class="px-5 py-3 text-[11px] font-medium text-muted-foreground">Status</TableHead>
            <TableHead class="px-5 py-3 text-right text-[11px] font-medium text-muted-foreground">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableEmpty v-if="!isLoading && dataItems.length === 0" :colspan="5">
            No data items found for this filter.
          </TableEmpty>

          <TableRow v-for="item in dataItems" :key="item.id">
            <TableCell class="px-5 py-3.5 tabular-nums font-medium text-muted-foreground">#{{ item.id }}</TableCell>
            <TableCell class="px-5 py-3.5 text-foreground font-medium">{{ item.file_name }}</TableCell>
            <TableCell class="px-5 py-3.5">
              <Badge variant="outline" class="capitalize">{{ item.modality.toLowerCase() }}</Badge>
            </TableCell>

            <TableCell class="px-5 py-3.5">
              <Badge :variant="getStatusConfig(item.status).badgeVariant">
                {{ getStatusConfig(item.status).label }}
              </Badge>
            </TableCell>

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
