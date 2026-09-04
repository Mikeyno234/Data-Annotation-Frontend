<script setup lang="ts">
import { useRouter } from 'vue-router'
import type { Project } from '@/types'
import Card from '@/components/ui/Card.vue'
import CardContent from '@/components/ui/CardContent.vue'
import Badge from '@/components/ui/Badge.vue'
import Button from '@/components/ui/Button.vue'
import {
  Headphones,
  FileText,
  Image as ImageIcon,
  Video as VideoIcon,
  Layers,
  Upload,
  ArrowRight,
  Pencil,
} from 'lucide-vue-next'

defineProps<{
  project: Project
  canUploadDataset: boolean
  canEditProject: boolean
}>()

const emit = defineEmits<{
  (e: 'upload', id: number, modality: string): void
  (e: 'edit', project: Project): void
}>()

const router = useRouter()
</script>

<template>
  <Card class="group relative flex flex-col justify-between overflow-hidden bg-card/95 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-md">
    <CardContent class="p-0">
      <div
        class="h-1 bg-primary/70 transition-all duration-300 group-hover:h-1.5"
        :class="{
          'bg-sky-500/80': project.modality === 'IMAGE',
          'bg-amber-500/80': project.modality === 'VIDEO',
          'bg-emerald-500/80': project.modality === 'TEXT',
          'bg-indigo-500/80': project.modality === 'AUDIO',
        }"
      ></div>
      <div class="space-y-4 p-5 sm:p-6">
        <div class="flex items-start justify-between gap-4">
          <div class="flex min-w-0 items-center gap-3">
            <div class="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-muted/60 text-foreground group-hover:bg-primary/10 transition-colors border border-border/40">
              <Headphones v-if="project.modality === 'AUDIO'" class="size-5 text-indigo-400" />
              <ImageIcon v-else-if="project.modality === 'IMAGE'" class="size-5 text-sky-400" />
              <FileText v-else-if="project.modality === 'TEXT'" class="size-5 text-emerald-400" />
              <VideoIcon v-else-if="project.modality === 'VIDEO'" class="size-5 text-amber-400" />
              <Layers v-else class="size-5 text-primary" />
            </div>
            <div class="min-w-0">
              <h3 class="truncate text-[15px] font-bold text-foreground group-hover:text-primary transition-colors tracking-tight">
                {{ project.name }}
              </h3>
              <div class="mt-0.5 text-xs font-mono text-muted-foreground">{{ project.code }}</div>
            </div>
          </div>
          <Badge
            :variant="
              project.modality === 'AUDIO'
                ? 'default'
                : project.modality === 'IMAGE'
                ? 'info'
                : project.modality === 'TEXT'
                ? 'success'
                : 'warning'
            "
            class="shrink-0 text-[11px] font-mono font-bold"
          >
            {{ project.modality }}
          </Badge>
        </div>

        <p class="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
          {{ project.description || 'No project description added yet.' }}
        </p>

        <div class="grid grid-cols-[1fr_auto] items-end gap-3 pt-2 border-t border-border/30">
          <div class="min-w-0">
            <div class="mb-0.5 text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Annotation Engine</div>
            <div class="truncate text-xs font-bold text-foreground" :title="project.annotation_type">
              {{ project.annotation_type }}
            </div>
          </div>
          <Badge
            :variant="project.status === 'ACTIVE' ? 'success' : 'outline'"
            :dot="project.status === 'ACTIVE'"
            class="text-[10px] font-bold uppercase tracking-wider"
          >
            {{ project.status }}
          </Badge>
        </div>
      </div>
    </CardContent>

    <div class="flex items-center gap-2 bg-muted/20 border-t border-border/40 px-5 py-3">
      <Button
        v-if="canUploadDataset"
        variant="outline"
        size="sm"
        class="h-9 flex-1 gap-1.5 text-xs font-semibold rounded-xl"
        @click="emit('upload', project.id, project.modality)"
      >
        <Upload class="size-3.5" />
        <span>Upload</span>
      </Button>

      <Button
        variant="default"
        size="sm"
        class="h-9 flex-1 gap-1.5 text-xs font-semibold rounded-xl"
        @click="router.push(`/projects/${project.id}`)"
      >
        <span>Open Project</span>
        <ArrowRight class="size-3.5" />
      </Button>

      <Button
        v-if="canEditProject"
        variant="ghost"
        size="icon"
        class="size-9 rounded-xl shrink-0 text-muted-foreground hover:text-primary"
        aria-label="Edit project configuration"
        title="Edit project configuration"
        @click="emit('edit', project)"
      >
        <Pencil class="size-3.5" />
      </Button>
    </div>
  </Card>
</template>
