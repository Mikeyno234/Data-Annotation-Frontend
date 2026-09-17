<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import type { Project } from '@/types'
import { getModalityConfig } from '@/utils/design'
import Button from '@/components/ui/Button.vue'
import Badge from '@/components/ui/Badge.vue'
import Card from '@/components/ui/Card.vue'
import CardContent from '@/components/ui/CardContent.vue'
import {
  X,
  ExternalLink,
  Layers,
  UploadCloud,
  Play,
  Calendar,
  Building2,
  Cpu,
  Database,
  CheckCircle2,
} from 'lucide-vue-next'

const props = defineProps<{
  project: Project | null
  open: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'upload', projectId: number, modality: string): void
}>()

const router = useRouter()

const modalityConfig = computed(() => {
  return getModalityConfig(props.project?.modality)
})

function handleGoToDetail() {
  if (props.project) {
    emit('close')
    router.push(`/projects/${props.project.id}`)
  }
}

function handleLaunchWorkspace() {
  if (props.project) {
    emit('close')
    router.push(`/workspace?project_id=${props.project.id}`)
  }
}

function handleUpload() {
  if (props.project) {
    emit('upload', props.project.id, props.project.modality || '')
    emit('close')
  }
}

function formatDate(dateStr?: string) {
  if (!dateStr) return 'N/A'
  try {
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return dateStr
  }
}
</script>

<template>
  <!-- Backdrop -->
  <Transition
    enter-active-class="transition-opacity duration-200 ease-out"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition-opacity duration-150 ease-in"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div
      v-if="open"
      class="fixed inset-0 z-50 bg-background/80 backdrop-blur-xs cursor-pointer"
      @click="emit('close')"
      aria-hidden="true"
    />
  </Transition>

  <!-- Side Panel Drawer (SaaS Search-Flows Quick View) -->
  <Transition
    enter-active-class="transition-transform duration-250 ease-out"
    enter-from-class="translate-x-full"
    enter-to-class="translate-x-0"
    leave-active-class="transition-transform duration-200 ease-in"
    leave-from-class="translate-x-0"
    leave-to-class="translate-x-full"
  >
    <aside
      v-if="open && project"
      class="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-border/80 bg-card text-card-foreground shadow-xl sm:max-w-lg"
      role="dialog"
      aria-modal="true"
      :aria-label="`Preview for ${project.name}`"
      @keydown.esc="emit('close')"
    >
      <!-- Drawer Header -->
      <div class="flex items-start justify-between border-b border-border/70 p-5">
        <div class="space-y-1.5 pr-4">
          <div class="flex items-center gap-2">
            <Badge :variant="project.status === 'ACTIVE' ? 'success' : 'secondary'">
              {{ project.status || 'ACTIVE' }}
            </Badge>
            <span class="font-mono text-[11px] text-muted-foreground uppercase">
              {{ project.code }}
            </span>
          </div>
          <h2 class="text-lg font-semibold tracking-tight text-foreground line-clamp-1">
            {{ project.name }}
          </h2>
          <p v-if="project.organization?.name" class="flex items-center gap-1 text-xs text-muted-foreground">
            <Building2 class="size-3.5" :stroke-width="1.6" />
            <span>{{ project.organization.name }}</span>
          </p>
        </div>

        <button
          type="button"
          class="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground cursor-pointer"
          @click="emit('close')"
          aria-label="Close preview drawer"
        >
          <X class="size-4" :stroke-width="2" />
        </button>
      </div>

      <!-- Drawer Content -->
      <div class="flex-1 overflow-y-auto p-5 space-y-6">
        <!-- Modality & Engine Banner (Coss UI Card Frame) -->
        <Card class="border-border/60 bg-muted/20">
          <CardContent class="p-4 space-y-3">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <div class="flex size-8 items-center justify-center rounded-lg bg-card border border-border">
                  <component :is="modalityConfig.icon" class="size-4 text-primary" :stroke-width="1.8" />
                </div>
                <div>
                  <div class="text-xs font-semibold text-foreground">
                    {{ modalityConfig.label }}
                  </div>
                  <div class="text-[11px] text-muted-foreground">
                    Engine: {{ project.annotation_type || project.tool_type || 'Standard Engine' }}
                  </div>
                </div>
              </div>

              <span class="text-xs font-mono text-muted-foreground">
                ID #{{ project.id }}
              </span>
            </div>

            <p v-if="project.description" class="text-xs text-muted-foreground leading-relaxed pt-1 border-t border-border/40">
              {{ project.description }}
            </p>
          </CardContent>
        </Card>

        <!-- KPI Metrics Grid (TailAdmin 3-column micro grid) -->
        <div class="grid grid-cols-3 gap-2.5">
          <div class="rounded-xl border border-border/70 bg-card p-3 text-center">
            <div class="text-[11px] font-medium text-muted-foreground">Batches</div>
            <div class="text-lg font-semibold text-foreground mt-0.5 tabular-nums">
              {{ project.datasets?.reduce((acc, d) => acc + (d.batches?.length || 0), 0) || 0 }}
            </div>
          </div>

          <div class="rounded-xl border border-border/70 bg-card p-3 text-center">
            <div class="text-[11px] font-medium text-muted-foreground">Datasets</div>
            <div class="text-lg font-semibold text-foreground mt-0.5 tabular-nums">
              {{ project.datasets?.length ?? 1 }}
            </div>
          </div>

          <div class="rounded-xl border border-border/70 bg-card p-3 text-center">
            <div class="text-[11px] font-medium text-muted-foreground">Created</div>
            <div class="text-[11px] font-semibold text-foreground mt-1 tabular-nums">
              {{ formatDate(project.created_at) }}
            </div>
          </div>
        </div>

        <!-- Configuration Metadata Preview -->
        <div class="space-y-2">
          <div class="text-xs font-semibold text-foreground tracking-tight">Configuration Details</div>
          <div class="rounded-xl border border-border/70 bg-card divide-y divide-border/50 text-xs">
            <div class="flex items-center justify-between p-3">
              <span class="text-muted-foreground">Tool Specification</span>
              <span class="font-mono text-[11px] font-medium text-foreground">
                {{ project.tool_type || 'DEFAULT' }}
              </span>
            </div>
            <div class="flex items-center justify-between p-3">
              <span class="text-muted-foreground">Schema Type</span>
              <span class="font-medium text-foreground">
                {{ project.annotation_type || 'General' }}
              </span>
            </div>
            <div class="flex items-center justify-between p-3">
              <span class="text-muted-foreground">Organization Scope</span>
              <span class="font-medium text-foreground">
                {{ project.organization?.name || 'Global' }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Drawer Footer Action Bar -->
      <div class="border-t border-border/70 p-4 bg-muted/10 flex items-center justify-between gap-3">
        <Button
          variant="outline"
          size="sm"
          class="gap-1.5 text-xs flex-1"
          @click="handleUpload"
        >
          <UploadCloud class="size-3.5" :stroke-width="1.6" />
          <span>Upload Data</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          class="gap-1.5 text-xs flex-1"
          @click="handleLaunchWorkspace"
        >
          <Play class="size-3.5 text-primary" :stroke-width="1.6" />
          <span>Launch Workspace</span>
        </Button>

        <Button
          variant="default"
          size="sm"
          class="gap-1.5 text-xs flex-1"
          @click="handleGoToDetail"
        >
          <span>Open Full</span>
          <ExternalLink class="size-3.5" :stroke-width="1.6" />
        </Button>
      </div>
    </aside>
  </Transition>
</template>
