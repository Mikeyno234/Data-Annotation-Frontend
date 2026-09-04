<script setup lang="ts">
import Button from '@/components/ui/Button.vue'
import Input from '@/components/ui/Input.vue'
import {
  FolderPlus,
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
}>()

const emit = defineEmits<{
  (e: 'update:searchQuery', val: string): void
  (e: 'update:selectedModality', val: string): void
  (e: 'create'): void
}>()
</script>

<template>
  <div class="space-y-6">
    <!-- Header with Actions -->
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-xl font-bold tracking-tight text-foreground">Annotation Projects</h1>
        <p class="mt-0.5 text-xs text-muted-foreground">Manage multi-modal datasets, team roles, and active annotation pipelines.</p>
      </div>
      <Button
        v-if="canCreateProject"
        size="sm"
        class="gap-1.5 rounded-xl font-semibold shadow-xs"
        @click="emit('create')"
      >
        <FolderPlus class="size-4" />
        <span>New Project</span>
      </Button>
    </div>

    <!-- Filters & Search Bar -->
    <div class="flex flex-col gap-3 rounded-2xl bg-card p-3 shadow-xs border border-border/60 sm:flex-row sm:items-center sm:justify-between">
      <div class="relative flex-1">
        <Search class="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          :model-value="searchQuery"
          placeholder="Search by project name or code..."
          class="pl-9 h-10 text-xs rounded-xl"
          @input="emit('update:searchQuery', ($event.target as HTMLInputElement).value)"
        />
      </div>

      <!-- Modality Filter Buttons -->
      <div class="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          class="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all cursor-pointer select-none"
          :class="selectedModality === 'ALL' ? 'bg-primary text-primary-foreground shadow-xs' : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'"
          @click="emit('update:selectedModality', 'ALL')"
        >
          <Layers class="size-3.5" />
          <span>All</span>
        </button>
        <button
          type="button"
          class="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all cursor-pointer select-none"
          :class="selectedModality === 'AUDIO' ? 'bg-primary text-primary-foreground shadow-xs' : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'"
          @click="emit('update:selectedModality', 'AUDIO')"
        >
          <Headphones class="size-3.5" />
          <span>Audio</span>
        </button>
        <button
          type="button"
          class="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all cursor-pointer select-none"
          :class="selectedModality === 'IMAGE' ? 'bg-primary text-primary-foreground shadow-xs' : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'"
          @click="emit('update:selectedModality', 'IMAGE')"
        >
          <ImageIcon class="size-3.5" />
          <span>Image</span>
        </button>
        <button
          type="button"
          class="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all cursor-pointer select-none"
          :class="selectedModality === 'TEXT' ? 'bg-primary text-primary-foreground shadow-xs' : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'"
          @click="emit('update:selectedModality', 'TEXT')"
        >
          <FileText class="size-3.5" />
          <span>Text</span>
        </button>
        <button
          type="button"
          class="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all cursor-pointer select-none"
          :class="selectedModality === 'VIDEO' ? 'bg-primary text-primary-foreground shadow-xs' : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'"
          @click="emit('update:selectedModality', 'VIDEO')"
        >
          <VideoIcon class="size-3.5" />
          <span>Video</span>
        </button>
      </div>
    </div>
  </div>
</template>
