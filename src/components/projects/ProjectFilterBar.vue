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
          <h1 class="text-2xl font-bold tracking-tight text-foreground font-display">Annotation Projects</h1>
          <span
            v-if="totalCount !== undefined"
            class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-mono font-medium bg-muted text-muted-foreground border border-border/50"
          >
            {{ totalCount }} total
          </span>
        </div>
        <p class="text-xs text-muted-foreground/80 leading-relaxed max-w-xl">
          Multi-modal data annotation pipelines, engine assignments, and real-time labeling queues.
        </p>
      </div>

      <Button
        v-if="canCreateProject"
        size="sm"
        class="h-9 gap-1.5 px-3.5 rounded-lg text-xs font-semibold shadow-sm transition-all hover:shadow-primary/20 active:scale-[0.98]"
        @click="emit('create')"
      >
        <Plus class="size-4 stroke-[2.5]" />
        <span>New Project</span>
      </Button>
    </div>

    <!-- Toolbar: Search & Segmented Filter -->
    <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <!-- Search Input with Modern Pill/Kbd aesthetic -->
      <div class="relative w-full md:max-w-sm">
        <Search class="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground/70 pointer-events-none" />
        <input
          :value="searchQuery"
          type="text"
          placeholder="Filter by name or code..."
          class="w-full h-9 pl-9 pr-8 text-xs rounded-lg bg-card/80 border border-border/60 text-foreground placeholder:text-muted-foreground/60 transition-all focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 shadow-2xs"
          @input="emit('update:searchQuery', ($event.target as HTMLInputElement).value)"
        />
        <div class="absolute right-2.5 top-1/2 -translate-y-1/2 hidden sm:flex items-center pointer-events-none">
          <kbd class="px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground/60 bg-muted/70 rounded border border-border/40 leading-none">
            /
          </kbd>
        </div>
      </div>

      <!-- Segmented Modality Selector -->
      <div class="inline-flex p-1 rounded-lg bg-muted/40 border border-border/50 shadow-2xs self-start md:self-auto overflow-x-auto max-w-full">
        <button
          v-for="item in modalities"
          :key="item.id"
          type="button"
          class="group relative inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap cursor-pointer select-none"
          :class="[
            selectedModality === item.id
              ? 'bg-card text-foreground font-semibold shadow-xs border border-border/60'
              : 'text-muted-foreground hover:text-foreground hover:bg-card/40 border border-transparent'
          ]"
          @click="emit('update:selectedModality', item.id)"
        >
          <component
            :is="item.icon"
            class="size-3.5 transition-colors"
            :class="selectedModality === item.id ? 'text-primary' : 'text-muted-foreground/70 group-hover:text-foreground'"
          />
          <span>{{ item.label }}</span>
        </button>
      </div>
    </div>
  </div>
</template>
