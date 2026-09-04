<script setup lang="ts">
import type { Role } from '@/types'
import Input from '@/components/ui/Input.vue'
import { Search, SlidersHorizontal } from 'lucide-vue-next'

defineProps<{
  searchQuery: string
  selectedRoleFilter: string
  selectedStatusFilter: string
  roles: Role[]
}>()

const emit = defineEmits<{
  (e: 'update:searchQuery', val: string): void
  (e: 'update:selectedRoleFilter', val: string): void
  (e: 'update:selectedStatusFilter', val: string): void
  (e: 'filterChange'): void
}>()
</script>

<template>
  <div class="flex flex-col sm:flex-row items-center justify-between gap-4 bg-card/90 p-4 rounded-2xl shadow-sm border border-border/40">
    <div class="relative w-full sm:w-80">
      <Search class="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
      <Input
        :model-value="searchQuery"
        placeholder="Search by name or email..."
        class="pl-9 h-10 text-xs rounded-xl"
        @input="emit('update:searchQuery', ($event.target as HTMLInputElement).value)"
      />
    </div>

    <div class="flex items-center gap-3 w-full sm:w-auto">
      <div class="flex items-center gap-1.5 w-full sm:w-auto">
        <SlidersHorizontal class="size-3.5 text-muted-foreground shrink-0" />
        <select
          :value="selectedRoleFilter"
          class="h-10 rounded-xl border border-border/50 bg-muted/50 px-3 text-xs font-semibold text-foreground focus:bg-card focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer w-full sm:w-auto"
          @change="emit('update:selectedRoleFilter', ($event.target as HTMLSelectElement).value); emit('filterChange')"
        >
          <option value="ALL">All Roles</option>
          <option v-for="r in roles" :key="r.id" :value="String(r.id)">
            {{ r.name }}
          </option>
        </select>
      </div>

      <select
        :value="selectedStatusFilter"
        class="h-10 rounded-xl border border-border/50 bg-muted/50 px-3 text-xs font-semibold text-foreground focus:bg-card focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer w-full sm:w-auto"
        @change="emit('update:selectedStatusFilter', ($event.target as HTMLSelectElement).value); emit('filterChange')"
      >
        <option value="ALL">All Statuses</option>
        <option value="ACTIVE">Active</option>
        <option value="INACTIVE">Inactive</option>
      </select>
    </div>
  </div>
</template>
