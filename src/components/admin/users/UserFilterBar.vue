<script setup lang="ts">
import { computed } from 'vue'
import type { Role } from '@/types'
import Input from '@/components/ui/Input.vue'
import Select, { type SelectOption } from '@/components/ui/Select.vue'
import { Search, SlidersHorizontal } from 'lucide-vue-next'

const props = defineProps<{
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

const roleOptions = computed<SelectOption<string>[]>(() => [
  { value: 'ALL', label: 'All Roles' },
  ...props.roles.map((r) => ({
    value: String(r.id),
    label: r.name,
    description: r.description,
  })),
])

const statusOptions: SelectOption<string>[] = [
  { value: 'ALL', label: 'All Statuses' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
]

function handleRoleChange(val: string) {
  emit('update:selectedRoleFilter', val)
  emit('filterChange')
}

function handleStatusChange(val: string) {
  emit('update:selectedStatusFilter', val)
  emit('filterChange')
}
</script>

<template>
  <div class="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card p-4 rounded-2xl shadow-xs border border-border/80">
    <div class="relative w-full sm:w-80">
      <Search class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" :stroke-width="1.8" />
      <Input
        :model-value="searchQuery"
        placeholder="Search by name or email..."
        class-name="pl-9 h-9.5 text-xs rounded-xl border-border/80 focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-2xs"
        @input="emit('update:searchQuery', ($event.target as HTMLInputElement).value)"
      />
    </div>

    <div class="flex items-center gap-2.5 w-full sm:w-auto">
      <div class="flex items-center gap-2 w-full sm:w-auto">
        <SlidersHorizontal class="size-3.5 text-muted-foreground shrink-0" :stroke-width="1.8" />
        <Select
          :model-value="selectedRoleFilter"
          :options="roleOptions"
          size="sm"
          class-name="w-full sm:w-44 h-9.5 rounded-xl border-border/80 text-xs shadow-2xs"
          @change="handleRoleChange"
        />
      </div>

      <Select
        :model-value="selectedStatusFilter"
        :options="statusOptions"
        size="sm"
        class-name="w-full sm:w-36 h-9.5 rounded-xl border-border/80 text-xs shadow-2xs"
        @change="handleStatusChange"
      />
    </div>
  </div>
</template>
