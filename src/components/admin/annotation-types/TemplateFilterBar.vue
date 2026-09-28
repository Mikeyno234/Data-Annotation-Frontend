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
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <div class="flex items-center gap-2">
          <h1 class="text-lg sm:text-xl font-bold tracking-tight text-foreground">Task Catalog & Schemas</h1>
          <span class="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
            {{ totalItems }} Templates
          </span>
        </div>
        <p class="mt-0.5 text-xs text-muted-foreground">
          Define multi-modal labeling tools, coordinate geometries, and XML/JSON format specifications.
        </p>
      </div>

      <div class="flex items-center gap-3 w-full sm:w-auto">
        <Button
          v-if="canCreate"
          size="sm"
          class="gap-2 rounded-xl font-semibold shadow-xs w-full sm:w-auto justify-center h-9 px-4"
          @click="emit('openCreateModal')"
        >
          <Plus class="size-4" :stroke-width="2" />
          <span>New Template</span>
        </Button>
      </div>
    </div>

    <!-- Modality Filters & Search Bar (Berry Segmented Pills & Search) -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-3 border-y border-border/60 py-3.5">
      <!-- Modality Pills (Berry Segmented Pill Container) -->
      <div class="inline-flex items-center gap-1 p-1 bg-muted/60 rounded-xl border border-border/70 shadow-2xs overflow-x-auto max-w-full">
        <button
          v-for="m in modalityList"
          :key="m.value"
          type="button"
          class="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer select-none whitespace-nowrap shrink-0"
          :class="[
            selectedModality === m.value
              ? 'bg-card text-foreground shadow-xs border border-border/70'
              : 'text-muted-foreground hover:text-foreground hover:bg-card/40 border border-transparent',
          ]"
          @click="emit('update:selectedModality', m.value)"
        >
          <component :is="m.icon" v-if="m.icon" class="size-3.5" :stroke-width="1.8" />
          <span>{{ m.label }}</span>
        </button>
      </div>

      <!-- Search Input -->
      <div class="relative w-full md:w-72">
        <Search class="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground pointer-events-none" :stroke-width="1.8" />
        <Input
          :model-value="searchQuery"
          placeholder="Search template name or code..."
          class="pl-9 h-9.5 text-xs rounded-xl border border-border/80 bg-card shadow-2xs focus:ring-2 focus:ring-primary/20 focus:border-primary w-full"
          @update:model-value="emit('update:searchQuery', String($event))"
        />
      </div>
    </div>
  </div>
</template>
