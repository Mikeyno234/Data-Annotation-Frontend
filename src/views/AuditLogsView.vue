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
    if (res.data) {
      auditLogs.value = res.data.data || res.data
      if (res.data.pagination) {
        totalLogs.value = res.data.pagination.total
        totalPages.value = res.data.pagination.total_pages
      } else {
        totalLogs.value = auditLogs.value.length
        totalPages.value = 1
      }
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

onMounted(() => {
  fetchLogs()
})
</script>

<template>
  <div class="flex flex-col gap-6 max-w-7xl mx-auto">
    <!-- Top Header -->
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <div class="flex items-center gap-2">
          <Terminal class="size-6 text-primary" />
          <h1 class="text-2xl font-bold tracking-tight text-foreground">Security Audit Trail</h1>
        </div>
        <p class="text-xs text-muted-foreground mt-1">
          Comprehensive log of user actions, task lock events, and permission-checked API executions
        </p>
      </div>
    </div>

    <!-- Search & Filter Bar -->
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div class="relative w-full max-w-sm">
        <Search class="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          v-model="searchQuery"
          placeholder="Search by action, user, or resource..."
          class="pl-10 text-xs"
          @input="handleSearchInput"
        />
      </div>

      <div class="flex items-center gap-2">
        <SlidersHorizontal class="size-3.5 text-muted-foreground" />
        <span class="text-xs text-muted-foreground font-semibold">Status:</span>
        <select
          v-model="selectedStatusFilter"
          class="h-10 rounded-xl border-0 bg-muted/60 px-3.5 text-xs text-foreground focus-visible:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 shadow-inner cursor-pointer font-medium"
          @change="handleFilterChange"
        >
          <option value="ALL">All Statuses</option>
          <option value="SUCCESS">Success</option>
          <option value="FAILED">Failed</option>
        </select>
      </div>
    </div>

    <!-- Audit Logs Table Card -->
    <Card class="bg-card/90 overflow-hidden shadow-sm">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead class="bg-muted/50 text-xs uppercase font-semibold tracking-wider text-muted-foreground">
            <tr>
              <th class="px-5 py-4">Timestamp</th>
              <th class="px-5 py-4">User</th>
              <th class="px-5 py-4">Action</th>
              <th class="px-5 py-4">Resource</th>
              <th class="px-5 py-4">IP Address</th>
              <th class="px-5 py-4">Status</th>
            </tr>
          </thead>
          <tbody class="text-xs">
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

            <tr v-for="log in auditLogs" :key="log.id" class="transition-colors hover:bg-muted/40 odd:bg-muted/10">
              <td class="px-5 py-4 text-muted-foreground">{{ new Date(log.created_at).toLocaleString() }}</td>
              <td class="px-5 py-4 font-sans text-foreground font-semibold">{{ log.user_email || 'system' }}</td>
              <td class="px-5 py-4 text-primary font-bold">{{ log.action }}</td>
              <td class="px-5 py-4 text-muted-foreground">{{ log.resource_type }} #{{ log.resource_id }}</td>
              <td class="px-5 py-4 text-muted-foreground">{{ log.ip_address || '127.0.0.1' }}</td>
              <td class="px-5 py-4">
                <Badge :variant="log.status === 'SUCCESS' ? 'success' : 'destructive'" class="text-[10px]">
                  {{ log.status }}
                </Badge>
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

