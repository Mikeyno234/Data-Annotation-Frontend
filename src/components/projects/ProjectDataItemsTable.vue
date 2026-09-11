<script setup lang="ts">
import type { DataItem } from '@/types'
import Button from '@/components/ui/Button.vue'
import Badge from '@/components/ui/Badge.vue'
import Card from '@/components/ui/Card.vue'
import Pagination from '@/components/ui/Pagination.vue'
import {
  SlidersHorizontal,
  RotateCcw,
  Play,
} from 'lucide-vue-next'

defineProps<{
  dataItems: DataItem[]
  selectedStatusFilter: string
  myInProgressTask: DataItem | undefined
  currentUserId?: number
  currentPage: number
  pageLimit: number
  totalDataItems: number
  totalPages: number
  isLoading: boolean
}>()

const emit = defineEmits<{
  (e: 'update:selectedStatusFilter', val: string): void
  (e: 'filterChange'): void
  (e: 'checkoutNext'): void
  (e: 'openTask', item: DataItem): void
  (e: 'pageChange', page: number): void
  (e: 'limitChange', limit: number): void
}>()

function formatStatus(status: string): string {
  const map: Record<string, string> = {
    UNASSIGNED: 'Unassigned',
    IN_PROGRESS: 'In Progress',
    ANNOTATED: 'Annotated',
    ACCEPTED: 'Accepted',
    COMPLETED: 'Completed',
    REJECTED: 'Rejected',
  }
  return map[status] || status
}
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
            @change="emit('update:selectedStatusFilter', ($event.target as HTMLSelectElement).value); emit('filterChange')"
          >
            <option value="ALL">All Statuses</option>
            <option value="UNASSIGNED">Unassigned</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="ANNOTATED">Annotated</option>
            <option value="COMPLETED">Completed</option>
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
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead class="bg-muted/40 text-[11px] font-medium text-muted-foreground border-b border-border">
            <tr>
              <th class="px-5 py-3">Task ID</th>
              <th class="px-5 py-3">File Name</th>
              <th class="px-5 py-3">Modality</th>
              <th class="px-5 py-3">Status</th>
              <th class="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border/60">
            <tr v-for="item in dataItems" :key="item.id" class="transition-colors hover:bg-muted/30">
              <td class="px-5 py-3.5 font-mono font-medium text-muted-foreground">#{{ item.id }}</td>
              <td class="px-5 py-3.5 text-foreground font-medium">{{ item.file_name }}</td>
              <td class="px-5 py-3.5">
                <Badge variant="outline" class="capitalize">{{ item.modality.toLowerCase() }}</Badge>
              </td>

              <td class="px-5 py-3.5">
                <Badge
                  :variant="
                    item.status === 'COMPLETED' || item.status === 'ACCEPTED'
                      ? 'success'
                      : item.status === 'ANNOTATED'
                      ? 'info'
                      : item.status === 'IN_PROGRESS'
                      ? 'warning'
                      : 'secondary'
                  "
                >
                  {{ formatStatus(item.status) }}
                </Badge>
              </td>
              <td class="px-5 py-3.5 text-right">
                <Button
                  v-if="item.status === 'IN_PROGRESS' && item.locked_by_id === currentUserId"
                  size="sm"
                  class="h-7 px-2.5 text-xs gap-1 font-medium rounded-md cursor-pointer"
                  @click="emit('openTask', item)"
                >
                  <RotateCcw class="size-3" :stroke-width="1.6" />
                  <span>Continue</span>
                </Button>
                <Button
                  v-else
                  variant="outline"
                  size="sm"
                  class="h-7 px-2.5 text-xs gap-1 font-medium rounded-md cursor-pointer"
                  @click="emit('openTask', item)"
                >
                  <Play class="size-2.5 fill-current" />
                  <span>Annotate</span>
                </Button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

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
