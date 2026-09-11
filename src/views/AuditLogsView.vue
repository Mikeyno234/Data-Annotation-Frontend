<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { adminApi } from '@/api/admin'
import type { AuditLog } from '@/types'
import { toast } from '@/utils/toast'
import Badge from '@/components/ui/Badge.vue'
import Card from '@/components/ui/Card.vue'
import Input from '@/components/ui/Input.vue'
import Pagination from '@/components/ui/Pagination.vue'
import { ShieldAlert, Terminal, Clock, Search, RefreshCw, SlidersHorizontal } from 'lucide-vue-next'

const auditLogs = ref<AuditLog[]>([])
const isLoading = ref(true)
const searchQuery = ref('')
const selectedStatusFilter = ref('ALL')

const currentPage = ref(1)
const pageLimit = ref(20)
const totalLogs = ref(0)
const totalPages = ref(1)

let searchDebounceTimer: any = null

async function fetchLogs() {
  isLoading.value = true
  try {
    const res: any = await adminApi.getAuditLogs({
      page: currentPage.value,
      limit: pageLimit.value,
      search: searchQuery.value.trim() || undefined,
      status: selectedStatusFilter.value !== 'ALL' ? selectedStatusFilter.value : undefined,
    })
    const payload = res?.data?.data || res?.data || res
    auditLogs.value = Array.isArray(payload) ? payload : []
    const pagination = res?.pagination || res?.data?.pagination
    if (pagination) {
      totalLogs.value = pagination.total ?? auditLogs.value.length
      totalPages.value = pagination.total_pages ?? 1
    } else {
      totalLogs.value = auditLogs.value.length
      totalPages.value = 1
    }
  } catch (err: any) {
    toast.error('Failed to load audit logs', err?.message)
  } finally {
    isLoading.value = false
  }
}

function handleSearchInput() {
  if (searchDebounceTimer) clearTimeout(searchDebounceTimer)
  searchDebounceTimer = setTimeout(() => {
    currentPage.value = 1
    fetchLogs()
  }, 300)
}

function handleFilterChange() {
  currentPage.value = 1
  fetchLogs()
}

function handlePageChange(page: number) {
  currentPage.value = page
  fetchLogs()
}

function handleLimitChange(limit: number) {
  pageLimit.value = limit
  currentPage.value = 1
  fetchLogs()
}

function formatAction(action: string): string {
  if (!action) return '—'
  return action
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

onMounted(() => {
  fetchLogs()
})
</script>

<template>
  <div class="flex flex-col gap-5 max-w-7xl mx-auto">
    <!-- Top Header -->
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <div class="flex items-center gap-2">
          <h1 class="text-xl font-semibold tracking-tight text-foreground">Security Audit Trail</h1>
          <span class="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-muted text-muted-foreground border border-border/60">
            {{ totalLogs }} records
          </span>
        </div>
        <p class="text-xs text-muted-foreground mt-0.5">
          Comprehensive log of user actions, task lock events, and permission-checked API executions
        </p>
      </div>
    </div>

    <!-- Search & Filter Bar -->
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div class="relative w-full max-w-sm">
        <Search class="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" :stroke-width="1.6" />
        <Input
          v-model="searchQuery"
          placeholder="Search by action, user, or resource..."
          class="pl-8 text-xs h-8"
          @input="handleSearchInput"
        />
      </div>

      <div class="flex items-center gap-2">
        <SlidersHorizontal class="size-3.5 text-muted-foreground" :stroke-width="1.6" />
        <span class="text-xs text-muted-foreground">Status:</span>
        <select
          v-model="selectedStatusFilter"
          class="h-8 rounded-md border border-border bg-card px-2.5 text-xs text-foreground focus-visible:outline-none focus-visible:border-foreground/40 focus-visible:ring-1 focus-visible:ring-foreground/15 cursor-pointer"
          @change="handleFilterChange"
        >
          <option value="ALL">All statuses</option>
          <option value="SUCCESS">Success</option>
          <option value="FAILED">Failed</option>
        </select>
      </div>
    </div>

    <!-- Audit Logs Table Card -->
    <Card class="overflow-hidden shadow-2xs">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead class="bg-muted/40 text-xs font-medium text-muted-foreground border-b border-border">
            <tr>
              <th class="px-4 py-3 font-medium">Timestamp</th>
              <th class="px-4 py-3 font-medium">User</th>
              <th class="px-4 py-3 font-medium">Action</th>
              <th class="px-4 py-3 font-medium">Resource</th>
              <th class="px-4 py-3 font-medium">IP address</th>
              <th class="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody class="text-xs divide-y divide-border/30">
            <tr v-if="isLoading">
              <td colspan="6" class="p-8 text-center text-muted-foreground font-sans">
                <RefreshCw class="size-5 animate-spin mx-auto mb-2 text-primary" />
                Loading audit logs...
              </td>
            </tr>

            <tr v-else-if="auditLogs.length === 0">
              <td colspan="6" class="p-8 text-center text-muted-foreground font-sans">
                No audit logs found matching your filters
              </td>
            </tr>

            <tr v-for="log in auditLogs" :key="log.id" class="transition-colors hover:bg-muted/30">
              <td class="px-4 py-3 text-muted-foreground tabular-nums whitespace-nowrap">{{ new Date(log.created_at).toLocaleString() }}</td>
              <td class="px-4 py-3 text-foreground font-medium">{{ log.user_email || 'System' }}</td>
              <td class="px-4 py-3 text-foreground">
                <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-muted text-foreground border border-border/60">
                  {{ formatAction(log.action) }}
                </span>
              </td>
              <td class="px-4 py-3 text-muted-foreground">
                <span class="capitalize">{{ log.resource_type?.toLowerCase() || 'Resource' }}</span>
                <span class="text-muted-foreground/70 tabular-nums"> #{{ log.resource_id }}</span>
              </td>
              <td class="px-4 py-3 text-muted-foreground tabular-nums font-mono text-[11px]">{{ log.ip_address || '127.0.0.1' }}</td>
              <td class="px-4 py-3">
                <Badge :variant="log.status === 'SUCCESS' ? 'success' : 'destructive'" class="text-[11px] capitalize">
                  {{ log.status?.toLowerCase() || 'unknown' }}
                </Badge>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination Bar -->
      <div class="px-4 py-2 border-t border-border/40">
        <Pagination
          :page="currentPage"
          :limit="pageLimit"
          :total="totalLogs"
          :total-pages="totalPages"
          :disabled="isLoading"
          @update:page="handlePageChange"
          @update:limit="handleLimitChange"
        />
      </div>
    </Card>
  </div>
</template>

