<script setup lang="ts">
import { ref, watch } from 'vue'
import type { MetadataOption } from '@/api/metadata'
import type { LabelOption } from '@/types'
import Modal from '@/components/ui/Modal.vue'
import Button from '@/components/ui/Button.vue'
import Input from '@/components/ui/Input.vue'
import Badge from '@/components/ui/Badge.vue'
import AnnotationTypePreview from '@/components/annotation/AnnotationTypePreview.vue'
import CatalogBlueprintPicker from '@/components/projects/CatalogBlueprintPicker.vue'
import {
  Layers,
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  Sparkles,
  ShieldCheck,
  Tag,
} from 'lucide-vue-next'

const props = defineProps<{
  showCreateModal: boolean
  editingProjectId: number | null
  newProject: {
    name: string
    code: string
    description: string
    modality: string
    annotation_type: string
    label_config: string
  }
  projectLabels: LabelOption[]
  modalityOptions: { value: string; label: string }[]
  annotationTypeOptions: MetadataOption[]
  isMetadataLoading: boolean
  selectedTaskObject: MetadataOption | null
}>()

const emit = defineEmits<{
  (e: 'update:showCreateModal', val: boolean): void
  (e: 'modalityChange', val: string): void
  (e: 'selectTask', opt: MetadataOption): void
  (e: 'submit'): void
}>()

const currentStep = ref<'CATALOG' | 'DETAILS'>('CATALOG')
const modalityFilter = ref<string>('ALL')

// Reset step when opening modal
watch(
  () => props.showCreateModal,
  (open) => {
    if (open) {
      if (props.editingProjectId) {
        currentStep.value = 'DETAILS'
      } else {
        currentStep.value = 'CATALOG'
      }
      modalityFilter.value = 'ALL'
    }
  }
)

function handleBlueprintSelect(opt: MetadataOption) {
  emit('selectTask', opt)
  currentStep.value = 'DETAILS'
}
</script>

<template>
  <Modal
    :open="showCreateModal"
    :title="editingProjectId ? 'Edit Annotation Project' : 'Create New Annotation Project'"
    :description="
      editingProjectId
        ? 'Update project operational parameters and specifications.'
        : currentStep === 'CATALOG'
          ? 'Step 1: Select an annotation blueprint from the verified Task Catalog.'
          : 'Step 2: Confirm project parameters and review inherited taxonomy.'
    "
    max-width="max-w-6xl"
    @close="emit('update:showCreateModal', false)"
  >
    <!-- STEP 1: TASK CATALOG BLUEPRINT SELECTOR -->
    <div v-if="currentStep === 'CATALOG' && !editingProjectId" class="space-y-4 font-sans">
      <div class="flex items-center justify-between border-b border-border/40 pb-3">
        <div class="flex items-center gap-2">
          <Layers class="size-4 text-primary" />
          <span class="text-xs font-bold text-foreground uppercase tracking-wider">
            Choose Blueprint from Task Catalog
          </span>
        </div>
        <router-link
          to="/admin/annotation-types"
          class="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
        >
          <span>Catalog Management</span>
          <ExternalLink class="size-3" />
        </router-link>
      </div>

      <CatalogBlueprintPicker
        :options="annotationTypeOptions"
        :is-loading="isMetadataLoading"
        :selected-code="newProject.annotation_type"
        :modality-filter="modalityFilter"
        :modality-list="modalityOptions"
        @select="handleBlueprintSelect"
        @update:modality-filter="modalityFilter = $event"
      />

      <div class="flex items-center justify-between pt-3 border-t border-border/40">
        <Button variant="ghost" type="button" class="rounded-xl text-xs cursor-pointer" @click="emit('update:showCreateModal', false)">
          Cancel
        </Button>
        <Button
          v-if="newProject.annotation_type"
          type="button"
          class="rounded-xl text-xs font-semibold cursor-pointer"
          @click="currentStep = 'DETAILS'"
        >
          Continue with Selected Blueprint →
        </Button>
      </div>
    </div>

    <!-- STEP 2: STREAMLINED PROJECT DETAILS & READ-ONLY BLUEPRINT SPECS -->
    <form v-else class="space-y-5 font-sans" @submit.prevent="emit('submit')">
      <!-- Active Blueprint Summary Bar (Linear / Vercel style) -->
      <div class="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-card border border-border/70 shadow-2xs">
        <div class="flex items-center gap-3 min-w-0">
          <div class="min-w-0 space-y-0.5">
            <div class="flex items-center gap-2">
              <span class="text-[10px] font-mono font-bold tracking-wider text-muted-foreground uppercase">Template</span>
              <span class="inline-flex items-center rounded-md border border-border/80 bg-muted/50 px-1.5 py-0 text-[10px] font-mono font-medium text-foreground uppercase">
                {{ newProject.modality || (selectedTaskObject as any)?.modality }}
              </span>
              <span v-if="selectedTaskObject?.tool_type" class="inline-flex items-center rounded-md border border-border/60 bg-muted/30 px-1.5 py-0 text-[10px] font-mono text-muted-foreground uppercase">
                {{ selectedTaskObject.tool_type }}
              </span>
            </div>
            <h4 class="text-xs font-bold text-foreground truncate">
              {{ selectedTaskObject?.label || newProject.annotation_type || 'Custom Template' }}
            </h4>
          </div>
        </div>

        <button
          v-if="!editingProjectId"
          type="button"
          class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-border/70 bg-background hover:bg-muted text-[11px] font-medium text-foreground transition-all cursor-pointer shadow-2xs"
          @click="currentStep = 'CATALOG'"
        >
          <ArrowLeft class="size-3 text-muted-foreground" />
          <span>Switch Template</span>
        </button>
      </div>

      <div class="grid grid-cols-1 gap-6 md:grid-cols-12 items-start">
        <!-- Left: Clean Project Metadata Configuration -->
        <div class="space-y-4 overflow-y-auto max-h-[68vh] pr-1 md:col-span-7">
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-foreground flex items-center gap-1">
                <span>Project Name</span>
                <span class="text-destructive">*</span>
              </label>
              <Input
                v-model="newProject.name"
                placeholder="e.g. Autonomous Highway Detection"
                required
                class="rounded-xl bg-card"
              />
            </div>
            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-foreground flex items-center gap-1">
                <span>Project Code</span>
                <span class="text-destructive">*</span>
              </label>
              <Input
                v-model="newProject.code"
                placeholder="e.g. HIGHWAY-BBOX-01"
                required
                class="rounded-xl bg-card uppercase font-mono text-xs"
              />
            </div>
          </div>

          <div class="space-y-1.5">
            <label class="text-xs font-semibold text-foreground">Description</label>
            <textarea
              v-model="newProject.description"
              rows="2"
              placeholder="Annotator instructions or dataset scope..."
              class="w-full rounded-xl border border-border/60 bg-card p-3 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40 shadow-inner resize-none transition-all"
            ></textarea>
          </div>

          <!-- Inherited Classes / Taxonomy (Minimal Vercel Spec Box) -->
          <div class="rounded-xl border border-border/60 bg-card/60 p-3.5 space-y-2.5">
            <div class="flex items-center justify-between">
              <span class="text-[11px] font-mono uppercase tracking-wider font-semibold text-muted-foreground">
                Configured Classes ({{ projectLabels.length }})
              </span>
              <router-link
                to="/admin/annotation-types"
                class="text-[11px] font-mono text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors"
              >
                <span>Edit in Catalog</span>
                <ExternalLink class="size-2.5" />
              </router-link>
            </div>

            <!-- Crisp Class Pills / Tags -->
            <div v-if="projectLabels.length > 0" class="flex flex-wrap gap-1.5">
              <div
                v-for="label in projectLabels"
                :key="label.name"
                class="inline-flex items-center gap-1.5 rounded-lg border border-border/70 bg-background/80 px-2.5 py-1 text-[11px] font-mono text-foreground select-none"
              >
                <span class="size-2 rounded-full shrink-0" :style="{ backgroundColor: label.color }"></span>
                <span>{{ label.name }}</span>
              </div>
            </div>
            <div v-else class="text-[11px] text-muted-foreground py-1">
              Dynamic / freeform input (no preset classes).
            </div>
          </div>

          <!-- Bottom Actions -->
          <div class="flex items-center justify-between gap-2 pt-3 border-t border-border/40">
            <Button
              v-if="!editingProjectId"
              variant="outline"
              type="button"
              class="rounded-xl text-xs gap-1.5 cursor-pointer"
              @click="currentStep = 'CATALOG'"
            >
              <ArrowLeft class="size-3.5" />
              <span>Catalog List</span>
            </Button>
            <div v-else></div>

            <div class="flex items-center gap-2">
              <Button
                variant="ghost"
                type="button"
                class="rounded-xl text-xs cursor-pointer"
                @click="emit('update:showCreateModal', false)"
              >
                Cancel
              </Button>
              <Button type="submit" class="rounded-xl text-xs font-semibold cursor-pointer shadow-xs">
                <span>{{ editingProjectId ? 'Save Changes' : 'Create Project' }}</span>
              </Button>
            </div>
          </div>
        </div>

        <!-- Right: Interactive Live Visualizer Preview -->
        <div class="md:col-span-5 md:sticky md:top-2 h-[460px]">
          <AnnotationTypePreview
            :task="selectedTaskObject"
            :modality="newProject.modality"
            :fallback-title="newProject.name || 'Workspace Preview'"
          />
        </div>
      </div>
    </form>
  </Modal>
</template>
