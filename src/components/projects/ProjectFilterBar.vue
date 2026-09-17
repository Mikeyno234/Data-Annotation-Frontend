<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue'
import Button from '@/components/ui/Button.vue'
import {
  Plus,
  Search,
  X,
  LayoutGrid,
  Table as TableIcon,
  type LucideIcon,
} from 'lucide-vue-next'

export interface ModalityItem {
  id: string
  label: string
  icon: LucideIcon
}

const props = defineProps<{
  searchQuery: string
  selectedModality: string
  modalities: ModalityItem[]
  canCreateProject: boolean
  totalCount?: number
  viewMode: 'grid' | 'table'
}>()

const emit = defineEmits<{
  (e: 'update:searchQuery', val: string): void
  (e: 'update:selectedModality', val: string): void
  (e: 'update:viewMode', val: 'grid' | 'table'): void
  (e: 'clearSearch'): void
  (e: 'create'): void
}>()

const searchInputRef = ref<HTMLInputElement | null>(null)

function handleKeyDown(e: KeyboardEvent) {
  if (e.key === '/' && (e.target as HTMLElement)?.tagName !== 'INPUT' && (e.target as HTMLElement)?.tagName !== 'TEXTAREA') {
    e.preventDefault()
    searchInputRef.value?.focus()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeyDown)
})
</script>

<template>
  <div class="space-y-4">
    <!-- Top Header -->
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div class="space-y-1">
        <div class="flex items-center gap-2.5">
          <h1 class="text-xl font-bold tracking-tight text-foreground font-sans">
            Annotation Projects
          </h1>
          <span
            v-if="totalCount !== undefined"
            class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-muted/80 text-muted-foreground border border-border"
          >
            {{ totalCount }} TOTAL
          </span>
        </div>
        <p class="text-xs text-muted-foreground leading-relaxed">
          Manage multi-modal annotation pipelines, workforce batch assignments, and datasets.
        </p>
      </div>

      <Button
        v-if="canCreateProject"
        size="sm"
        class="h-8 gap-1.5 px-3 rounded-lg text-xs font-medium self-start sm:self-auto"
        @click="emit('create')"
      >
        <Plus class="size-3.5" :stroke-width="1.8" />
        <span>New Project</span>
      </Button>
    </div>

    <!-- Search & Discovery Toolbar (SaaS Search-Flows + Coss UI Segmented Control) -->
    <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <!-- Search Input with Clear Button -->
      <div class="relative w-full lg:max-w-md">
        <Search class="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground pointer-events-none" :stroke-width="1.8" />
        <input
          ref="searchInputRef"
          :value="searchQuery"
          type="text"
          placeholder="Filter projects by name or code... (press '/' to focus)"
          class="w-full h-8.5 pl-8 pr-14 text-xs rounded-lg bg-card border border-border/80 text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-ring shadow-xs"
          @input="emit('update:searchQuery', ($event.target as HTMLInputElement).value)"
        />

        <!-- Clear Button or Keyboard Shortcut -->
        <div class="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
          <button
            v-if="searchQuery"
            type="button"
            class="flex size-4 items-center justify-center rounded text-muted-foreground hover:text-foreground cursor-pointer"
            title="Clear search"
            @click="emit('clearSearch')"
          >
            <X class="size-3.5" :stroke-width="2" />
          </button>
          <kbd
            v-else
            class="hidden sm:inline-flex px-1.5 py-0.5 text-[9px] font-mono text-muted-foreground bg-muted/80 rounded border border-border/80"
          >
            /
          </kbd>
        </div>
      </div>

      <!-- Controls Row: Dynamic Modality Selector + View Toggle -->
      <div class="flex flex-wrap items-center gap-2.5 self-start lg:self-auto">
        <!-- Dynamic Modality Pills (Retrieved from Backend API) -->
        <div class="inline-flex p-0.5 rounded-lg bg-muted/60 border border-border/70 shadow-xs overflow-x-auto max-w-full">
          <button
            v-for="item in modalities"
            :key="item.id"
            type="button"
            class="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-all whitespace-nowrap cursor-pointer select-none"
            :class="[
              selectedModality === item.id
                ? 'bg-card text-foreground font-semibold shadow-xs border border-border/70'
                : 'text-muted-foreground hover:text-foreground hover:bg-card/40 border border-transparent'
            ]"
            @click="emit('update:selectedModality', item.id)"
          >
            <component
              :is="item.icon"
              class="size-3.5"
              :stroke-width="1.6"
            />
            <span>{{ item.label }}</span>
          </button>
        </div>

        <!-- View Mode Switcher: Bento Grid vs Dense Table (Coss UI style) -->
        <div class="inline-flex p-0.5 rounded-lg bg-muted/60 border border-border/70 shadow-xs">
          <button
            type="button"
            class="inline-flex items-center justify-center size-7 rounded-md transition-all cursor-pointer select-none"
            :class="viewMode === 'grid' ? 'bg-card text-foreground shadow-xs border border-border/70' : 'text-muted-foreground hover:text-foreground'"
            title="Bento Grid View"
            @click="emit('update:viewMode', 'grid')"
            aria-label="Bento Grid View"
          >
            <LayoutGrid class="size-3.5" :stroke-width="1.8" />
          </button>
          <button
            type="button"
            class="inline-flex items-center justify-center size-7 rounded-md transition-all cursor-pointer select-none"
            :class="viewMode === 'table' ? 'bg-card text-foreground shadow-xs border border-border/70' : 'text-muted-foreground hover:text-foreground'"
            title="Dense Table View"
            @click="emit('update:viewMode', 'table')"
            aria-label="Dense Table View"
          >
            <TableIcon class="size-3.5" :stroke-width="1.8" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
