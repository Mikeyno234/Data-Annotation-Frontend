<script setup lang="ts">
import { useRouter } from 'vue-router'
import type { Project } from '@/types'
import { getModalityConfig } from '@/utils/design'
import Button from '@/components/ui/Button.vue'
import Badge from '@/components/ui/Badge.vue'
import {
  Eye,
  ArrowUpRight,
  UploadCloud,
  Play,
  Layers,
  Building2,
  FolderKanban,
} from 'lucide-vue-next'

defineProps<{
  projects: Project[]
  isLoading: boolean
  canUploadDataset: boolean
}>()

const emit = defineEmits<{
  (e: 'preview', project: Project): void
  (e: 'upload', projectId: number, modality: string): void
}>()

const router = useRouter()

function formatDate(dateStr?: string) {
  if (!dateStr) return '—'
  try {
    return new Date(dateStr).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return dateStr
  }
}
</script>

<template>
  <div class="w-full overflow-hidden rounded-2xl border border-border/70 bg-card shadow-xs">
    <div class="overflow-x-auto">
      <table class="w-full text-left text-xs text-muted-foreground">
        <!-- Table Header (TailAdmin style) -->
        <thead class="bg-muted/40 text-[11px] font-semibold text-foreground uppercase tracking-wider border-b border-border/60">
          <tr>
            <th scope="col" class="py-3.5 pl-4 pr-3 sm:pl-6 font-medium">Project</th>
            <th scope="col" class="px-3 py-3.5 font-medium">Modality</th>
            <th scope="col" class="px-3 py-3.5 font-medium">Engine / Type</th>
            <th scope="col" class="px-3 py-3.5 font-medium">Datasets</th>
            <th scope="col" class="px-3 py-3.5 font-medium">Status</th>
            <th scope="col" class="px-3 py-3.5 font-medium">Created</th>
            <th scope="col" class="relative py-3.5 pl-3 pr-4 sm:pr-6 text-right font-medium">Actions</th>
          </tr>
        </thead>

        <!-- Table Body -->
        <tbody class="divide-y divide-border/50">
          <tr
            v-for="project in projects"
            :key="project.id"
            class="transition-colors hover:bg-muted/30 group"
          >
            <!-- Project Code & Name -->
            <td class="py-3.5 pl-4 pr-3 sm:pl-6">
              <div class="flex items-center gap-3">
                <div class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted/70 text-foreground border border-border/80">
                  <FolderKanban class="size-4 text-muted-foreground group-hover:text-primary transition-colors" :stroke-width="1.6" />
                </div>
                <div class="min-w-0">
                  <div class="flex items-center gap-1.5">
                    <button
                      type="button"
                      class="font-semibold text-foreground hover:text-primary transition-colors text-left truncate cursor-pointer"
                      @click="router.push(`/projects/${project.id}`)"
                    >
                      {{ project.name }}
                    </button>
                  </div>
                  <div class="flex items-center gap-2 mt-0.5">
                    <span class="font-mono text-[10px] uppercase text-muted-foreground/80">
                      {{ project.code }}
                    </span>
                    <span v-if="project.organization?.name" class="text-[10px] text-muted-foreground/70 flex items-center gap-0.5">
                      • {{ project.organization.name }}
                    </span>
                  </div>
                </div>
              </div>
            </td>

            <!-- Modality Badge -->
            <td class="px-3 py-3.5 whitespace-nowrap">
              <div class="flex items-center gap-1.5">
                <component
                  :is="getModalityConfig(project.modality).icon"
                  class="size-3.5 text-muted-foreground"
                  :stroke-width="1.6"
                />
                <span class="font-medium text-foreground text-[11px]">
                  {{ getModalityConfig(project.modality).label }}
                </span>
              </div>
            </td>

            <!-- Engine / Tool Type -->
            <td class="px-3 py-3.5 whitespace-nowrap">
              <span class="font-mono text-[11px] text-foreground bg-muted/40 px-2 py-0.5 rounded border border-border/60">
                {{ project.annotation_type || project.tool_type || 'Standard' }}
              </span>
            </td>

            <!-- Datasets & Batches count -->
            <td class="px-3 py-3.5 whitespace-nowrap">
              <span class="tabular-nums font-medium text-foreground">
                {{ project.datasets?.length ?? 1 }}
              </span>
              <span class="text-[11px] text-muted-foreground ml-1">ds</span>
            </td>

            <!-- Status -->
            <td class="px-3 py-3.5 whitespace-nowrap">
              <Badge :variant="project.status === 'ACTIVE' ? 'success' : 'secondary'">
                {{ project.status || 'ACTIVE' }}
              </Badge>
            </td>

            <!-- Created Date -->
            <td class="px-3 py-3.5 whitespace-nowrap font-mono text-[11px]">
              {{ formatDate(project.created_at) }}
            </td>

            <!-- Action Buttons -->
            <td class="py-3.5 pl-3 pr-4 sm:pr-6 whitespace-nowrap text-right">
              <div class="flex items-center justify-end gap-1.5">
                <!-- Quick Preview Drawer Button (SaaS Search-Flows) -->
                <Button
                  variant="ghost"
                  size="sm"
                  class="h-7 px-2 text-[11px] gap-1 text-muted-foreground hover:text-foreground"
                  title="Quick View Details"
                  @click="emit('preview', project)"
                >
                  <Eye class="size-3.5" :stroke-width="1.6" />
                  <span>Preview</span>
                </Button>

                <!-- Upload Dataset Action -->
                <Button
                  v-if="canUploadDataset"
                  variant="ghost"
                  size="sm"
                  class="h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground"
                  title="Upload Dataset"
                  @click="emit('upload', project.id, project.modality || '')"
                >
                  <UploadCloud class="size-3.5" :stroke-width="1.6" />
                </Button>

                <!-- Launch Workspace Shortcut -->
                <Button
                  variant="outline"
                  size="sm"
                  class="h-7 px-2 text-[11px] gap-1 text-foreground"
                  title="Launch Workspace"
                  @click="router.push(`/workspace?project_id=${project.id}`)"
                >
                  <Play class="size-3 text-primary" :stroke-width="1.8" />
                  <span>Label</span>
                </Button>

                <!-- Full Project Details -->
                <Button
                  variant="default"
                  size="sm"
                  class="h-7 px-2.5 text-[11px] gap-1"
                  @click="router.push(`/projects/${project.id}`)"
                >
                  <span>Open</span>
                  <ArrowUpRight class="size-3" :stroke-width="1.6" />
                </Button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
