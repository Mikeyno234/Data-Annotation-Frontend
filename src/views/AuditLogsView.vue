<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { adminApi } from '@/api/admin'
import type { AuditLog } from '@/types'
import { toast } from '@/utils/toast'
import Badge from '@/components/ui/Badge.vue'
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
  if (!action) return 'N/A'
  return action
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return 'N/A'
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return dateStr
  return date.toLocaleString()
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

    <!-- Search & Filter Bar (Berry Pill & Rounded-xl Controls) -->
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div class="relative w-full max-w-sm">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" :stroke-width="1.8" />
        <Input
          v-model="searchQuery"
          placeholder="Search by action, user, or resource..."
          class="pl-9 text-xs h-9.5 rounded-xl border-border/80 focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-2xs"
          @input="handleSearchInput"
        />
      </div>

      <div class="flex items-center gap-2">
        <SlidersHorizontal class="size-3.5 text-muted-foreground" :stroke-width="1.8" />
        <span class="text-xs text-muted-foreground font-medium">Status:</span>
        <select
          v-model="selectedStatusFilter"
          class="h-9.5 rounded-xl border border-border/80 bg-card px-3 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary shadow-2xs cursor-pointer"
          @change="handleFilterChange"
        >
          <option value="ALL">All statuses</option>
          <option value="SUCCESS">Success</option>
          <option value="FAILED">Failed</option>
        </select>
      </div>
    </div>

    <!-- Audit Logs Table (Berry MainCard style) -->
    <div class="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-xs">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead class="bg-muted/50 text-[11px] font-semibold text-muted-foreground border-b border-border/70">
            <tr>
              <th class="px-5 py-3">Timestamp</th>
              <th class="px-5 py-3">User</th>
              <th class="px-5 py-3">Action</th>
              <th class="px-5 py-3">Resource</th>
              <th class="px-5 py-3">IP Address</th>
              <th class="px-5 py-3">Status</th>
            </tr>
          </thead>
          <tbody class="text-xs divide-y divide-border/40">
            <tr v-if="isLoading">
              <td colspan="6" class="p-12 text-center text-muted-foreground font-sans">
                <RefreshCw class="size-6 animate-spin mx-auto mb-2 text-primary" />
                <span class="text-xs font-medium">Loading audit logs...</span>
              </td>
            </tr>

            <tr v-else-if="auditLogs.length === 0">
              <td colspan="6" class="p-12 text-center text-muted-foreground font-sans">
                <span class="text-xs font-medium">No audit logs found matching your filters</span>
              </td>
            </tr>

            <tr v-for="log in auditLogs" :key="log.id" class="transition-colors hover:bg-muted/20">
              <td class="px-5 py-3.5 text-muted-foreground tabular-nums whitespace-nowrap">{{ formatDate(log.created_at) }}</td>
              <td class="px-5 py-3.5 text-foreground font-semibold">{{ log.user_email || 'System' }}</td>
              <td class="px-5 py-3.5 text-foreground">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-muted/80 text-foreground border border-border/60">
                  {{ formatAction(log.action) }}
                </span>
              </td>
              <td class="px-5 py-3.5 text-muted-foreground">
                <span class="capitalize font-medium text-foreground/80">{{ log.resource_type?.toLowerCase() || 'Resource' }}</span>
                <span class="text-muted-foreground/70 tabular-nums font-mono text-[11px]"> #{{ log.resource_id }}</span>
              </td>
              <td class="px-5 py-3.5 text-muted-foreground tabular-nums font-mono text-[11px]">{{ log.ip_address || '127.0.0.1' }}</td>
              <td class="px-5 py-3.5">
                <Badge :variant="log.status === 'SUCCESS' ? 'success' : 'destructive'" class="text-[10px] rounded-full px-2.5 uppercase font-semibold">
                  {{ log.status?.toLowerCase() || 'unknown' }}
                </Badge>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination Bar -->
      <div class="px-5 py-3 border-t border-border/70">
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
    </div>
  </div>
</template>

