<script setup lang="ts">
import Button from '@/components/ui/Button.vue'
import {
  Plus,
  Search,
  Headphones,
  FileText,
  Image as ImageIcon,
  Video as VideoIcon,
  Layers,
} from 'lucide-vue-next'

defineProps<{
  searchQuery: string
  selectedModality: string
  canCreateProject: boolean
  totalCount?: number
}>()

const emit = defineEmits<{
  (e: 'update:searchQuery', val: string): void
  (e: 'update:selectedModality', val: string): void
  (e: 'create'): void
}>()

const modalities = [
  { id: 'ALL', label: 'All', icon: Layers },
  { id: 'IMAGE', label: 'Image', icon: ImageIcon },
  { id: 'VIDEO', label: 'Video', icon: VideoIcon },
  { id: 'TEXT', label: 'Text', icon: FileText },
  { id: 'AUDIO', label: 'Audio', icon: Headphones },
]
</script>

<template>
  <div class="space-y-5">
    <!-- Header Section -->
    <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div class="space-y-1">
        <div class="flex items-center gap-2.5">
          <h1 class="text-xl font-semibold tracking-tight text-foreground">Annotation Projects</h1>
          <span
            v-if="totalCount !== undefined"
            class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-muted text-muted-foreground border border-border"
          >
            {{ totalCount }} TOTAL
          </span>
        </div>
        <p class="text-xs text-muted-foreground leading-relaxed max-w-xl">
          Multi-modal data annotation pipelines, engine assignments, and real-time labeling queues.
        </p>
      </div>

      <Button
        v-if="canCreateProject"
        size="sm"
        class="h-8 gap-1.5 px-3 rounded-md text-xs font-medium shadow-2xs active:scale-[0.98]"
        @click="emit('create')"
      >
        <Plus class="size-3.5" :stroke-width="1.6" />
        <span>New Project</span>
      </Button>
    </div>

    <!-- Toolbar: Search & Segmented Filter -->
    <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <!-- Search Input -->
      <div class="relative w-full md:max-w-sm">
        <Search class="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground pointer-events-none" :stroke-width="1.6" />
        <input
          :value="searchQuery"
          type="text"
          placeholder="Filter by name or code..."
          class="w-full h-8 pl-8 pr-7 text-xs rounded-md bg-card border border-border text-foreground placeholder:text-muted-foreground/50 transition-all focus:outline-none focus:border-foreground/40 focus:ring-1 focus:ring-foreground/15 shadow-2xs"
          @input="emit('update:searchQuery', ($event.target as HTMLInputElement).value)"
        />
        <div class="absolute right-2 top-1/2 -translate-y-1/2 hidden sm:flex items-center pointer-events-none">
          <kbd class="px-1 py-0.2 text-[9px] font-mono text-muted-foreground bg-muted rounded border border-border">
            /
          </kbd>
        </div>
      </div>

      <!-- Segmented Modality Selector -->
      <div class="inline-flex p-0.5 rounded-md bg-muted/60 border border-border shadow-2xs self-start md:self-auto overflow-x-auto max-w-full">
        <button
          v-for="item in modalities"
          :key="item.id"
          type="button"
          class="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded transition-all whitespace-nowrap cursor-pointer select-none"
          :class="[
            selectedModality === item.id
              ? 'bg-card text-foreground font-semibold shadow-2xs border border-border'
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
    </div>
  </div>
</template>
