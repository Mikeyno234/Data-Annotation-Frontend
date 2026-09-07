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
</script>

<template>
  <div class="flex flex-col gap-4 mt-2">
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <h2 class="text-lg font-bold text-foreground tracking-tight">Data Items & Tasks</h2>
        <!-- Status filter -->
        <div class="flex items-center gap-1.5 ml-2">
          <SlidersHorizontal class="size-3.5 text-muted-foreground" />
          <select
            :value="selectedStatusFilter"
            class="h-8 rounded-xl border-0 bg-muted/60 px-3 text-xs font-semibold text-foreground focus-visible:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 shadow-inner cursor-pointer"
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
        <div v-if="myInProgressTask" class="flex items-center gap-2 rounded-xl bg-amber-500/15 px-3.5 py-2 text-xs font-semibold text-amber-400">
          <RotateCcw class="size-3.5" />
          <span>You have an in-progress task</span>
        </div>
        <Button size="sm" class="gap-1.5 shadow-md rounded-xl font-semibold h-9 px-4 cursor-pointer" @click="emit('checkoutNext')">
          <Play class="size-3.5 fill-current" />
          <span>Checkout Next Task</span>
        </Button>
      </div>
    </div>

    <Card class="bg-card/90 overflow-hidden shadow-sm">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead class="bg-muted/50 text-xs uppercase font-semibold tracking-wider text-muted-foreground">
            <tr>
              <th class="px-5 py-4">Task ID</th>
              <th class="px-5 py-4">File Name</th>
              <th class="px-5 py-4">Modality</th>
              <th class="px-5 py-4">Status</th>
              <th class="px-5 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="text-xs">
            <tr v-for="item in dataItems" :key="item.id" class="transition-colors hover:bg-muted/40 odd:bg-muted/10">
              <td class="px-5 py-4 font-bold text-primary">#{{ item.id }}</td>
              <td class="px-5 py-4 text-foreground font-semibold">{{ item.file_name }}</td>
              <td class="px-5 py-4">
                <Badge variant="outline">{{ item.modality }}</Badge>
              </td>

              <td class="px-5 py-4">
                <Badge
                  :variant="
                    item.status === 'COMPLETED'
                      ? 'success'
                      : item.status === 'ANNOTATED'
                      ? 'info'
                      : item.status === 'IN_PROGRESS'
                      ? 'warning'
                      : 'outline'
                  "
                >
                  {{ item.status }}
                </Badge>
              </td>
              <td class="px-5 py-4 text-right">
                <Button
                  v-if="item.status === 'IN_PROGRESS' && item.locked_by_id === currentUserId"
                  variant="default"
                  size="sm"
                  class="h-8 px-3.5 text-xs gap-1 font-semibold rounded-xl cursor-pointer"
                  @click="emit('openTask', item)"
                >
                  <RotateCcw class="size-3" />
                  <span>Continue</span>
                </Button>
                <Button
                  v-else
                  variant="secondary"
                  size="sm"
                  class="h-8 px-3.5 text-xs gap-1 font-semibold hover:bg-primary hover:text-white transition-colors cursor-pointer rounded-xl"
                  @click="emit('openTask', item)"
                >
                  <Play class="size-3 fill-current" />
                  <span>Open in Workspace</span>
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
          :page-size-options="[10, 15, 30, 60]"
          :disabled="isLoading"
          @update:page="emit('pageChange', $event)"
          @update:limit="emit('limitChange', $event)"
        />
      </div>
    </Card>
  </div>
</template>
