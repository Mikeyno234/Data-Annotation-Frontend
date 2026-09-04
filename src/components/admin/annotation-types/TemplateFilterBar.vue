<script setup lang="ts">
import Button from '@/components/ui/Button.vue'
import Input from '@/components/ui/Input.vue'
import { Search, Plus } from 'lucide-vue-next'

defineProps<{
  searchQuery: string
  selectedModality: string
  totalItems: number
  canCreate: boolean
  modalityList: { value: string; label: string; icon: any; color: string }[]
}>()

const emit = defineEmits<{
  (e: 'update:searchQuery', val: string): void
  (e: 'update:selectedModality', val: string): void
  (e: 'openCreateModal'): void
}>()
</script>

<template>
  <div class="flex flex-col gap-5">
    <!-- Title & Action Bar -->
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <div class="flex items-center gap-2">
          <h1 class="text-xl font-bold tracking-tight text-foreground">Task Catalog & Schemas</h1>
          <span class="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
            {{ totalItems }} Templates
          </span>
        </div>
        <p class="mt-0.5 text-xs text-muted-foreground">
          Define multi-modal labeling tools, coordinate geometries, and XML/JSON format specifications.
        </p>
      </div>

      <div class="flex items-center gap-3">
        <Button
          v-if="canCreate"
          size="sm"
          class="gap-1.5 rounded-xl font-semibold shadow-xs"
          @click="emit('openCreateModal')"
        >
          <Plus class="size-4" />
          <span>New Template</span>
        </Button>
      </div>
    </div>

    <!-- Modality Filters & Search Bar -->
    <div class="flex flex-wrap items-center justify-between gap-3 border-y border-border/40 py-3">
      <!-- Modality Pills -->
      <div class="flex flex-wrap items-center gap-1.5">
        <button
          v-for="m in modalityList"
          :key="m.value"
          type="button"
          class="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer select-none"
          :class="[
            selectedModality === m.value
              ? 'bg-primary text-primary-foreground shadow-xs'
              : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground',
          ]"
          @click="emit('update:selectedModality', m.value)"
        >
          <component :is="m.icon" v-if="m.icon" class="size-3.5" />
          <span>{{ m.label }}</span>
        </button>
      </div>

      <!-- Search Input -->
      <div class="relative w-full sm:w-64">
        <Search class="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          :model-value="searchQuery"
          placeholder="Search template name or code..."
          class="pl-9 h-9 text-xs rounded-xl"
          @input="emit('update:searchQuery', ($event.target as HTMLInputElement).value)"
        />
      </div>
    </div>
  </div>
</template>
