<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { MetadataOption } from '@/api/metadata'
import type { LabelOption } from '@/types'
import Modal from '@/components/ui/Modal.vue'
import Button from '@/components/ui/Button.vue'
import Input from '@/components/ui/Input.vue'
import AnnotationTypePreview from '@/components/annotation/AnnotationTypePreview.vue'
import CatalogBlueprintPicker from '@/components/projects/CatalogBlueprintPicker.vue'
import {
  Layers,
  Plus,
  Trash2,
  Code2,
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
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
  (e: 'aiPromptSubmit', prompt: string): void
  (e: 'addLabel', name: string, color: string): void
  (e: 'removeLabel', index: number): void
  (e: 'submit'): void
}>()

const currentStep = ref<'CATALOG' | 'DETAILS'>('CATALOG')
const modalityFilter = ref<string>('ALL')
const newLabelName = ref('')
const newLabelColor = ref('#38bdf8')
const showAdvancedLabelConfig = ref(false)

// Reset step when opening modal
watch(
  () => props.showCreateModal,
  (open) => {
    if (open) {
      if (props.editingProjectId || props.newProject.annotation_type) {
        currentStep.value = 'DETAILS'
      } else {
        currentStep.value = 'CATALOG'
      }
      modalityFilter.value = props.newProject.modality || 'ALL'
    }
  }
)

function handleBlueprintSelect(opt: MetadataOption) {
  emit('selectTask', opt)
  currentStep.value = 'DETAILS'
}

function onAddLabel() {
  const name = newLabelName.value.trim()
  if (!name) return
  emit('addLabel', name, newLabelColor.value)
  newLabelName.value = ''
}
</script>

<template>
  <Modal
    :open="showCreateModal"
    :title="editingProjectId ? 'Edit Annotation Project' : 'Create New Annotation Project'"
    :description="
      editingProjectId
        ? 'Update project details and labeling schema.'
        : currentStep === 'CATALOG'
          ? 'Step 1: Select an annotation blueprint from the Task Catalog.'
          : 'Step 2: Configure project parameters and class taxonomy.'
    "
    max-width="max-w-6xl"
    @close="emit('update:showCreateModal', false)"
  >
    <!-- STEP 1: TASK CATALOG BLUEPRINT SELECTOR -->
    <div v-if="currentStep === 'CATALOG' && !editingProjectId" class="space-y-4">
      <div class="flex items-center justify-between border-b border-border/40 pb-3">
        <div class="flex items-center gap-2">
          <Layers class="size-4 text-primary" />
          <span class="text-xs font-bold text-foreground uppercase tracking-wider font-sans">
            Choose Blueprint from Task Catalog
          </span>
        </div>
        <router-link
          to="/admin/annotation-types"
          class="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
        >
          <span>Manage Catalog</span>
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
        @ai-prompt-submit="emit('aiPromptSubmit', $event)"
      />

      <div class="flex items-center justify-between pt-3 border-t border-border/40">
        <Button variant="ghost" type="button" class="rounded-xl text-xs" @click="emit('update:showCreateModal', false)">
          Cancel
        </Button>
        <Button
          v-if="newProject.annotation_type"
          type="button"
          class="rounded-xl text-xs font-semibold"
          @click="currentStep = 'DETAILS'"
        >
          Continue with Selected Blueprint →
        </Button>
      </div>
    </div>

    <!-- STEP 2: PROJECT DETAILS, CLASSES & LIVE PREVIEW -->
    <form v-else class="space-y-5" @submit.prevent="emit('submit')">
      <!-- Selected Blueprint Summary Bar -->
      <div class="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-card border border-border/60 shadow-2xs">
        <div class="flex items-center gap-2.5 min-w-0">
          <div class="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <CheckCircle2 class="size-4" />
          </div>
          <div class="min-w-0">
            <span class="text-[10px] font-mono text-muted-foreground uppercase">Catalog Blueprint:</span>
            <span class="text-xs font-bold text-foreground block truncate">
              {{ selectedTaskObject?.label || newProject.annotation_type || 'Custom Schema' }}
            </span>
          </div>
        </div>

        <button
          v-if="!editingProjectId"
          type="button"
          class="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline cursor-pointer"
          @click="currentStep = 'CATALOG'"
        >
          <ArrowLeft class="size-3.5" />
          <span>Change Blueprint</span>
        </button>
      </div>

      <div class="grid grid-cols-1 gap-6 md:grid-cols-12 items-start">
        <!-- Left: Form inputs & Class Taxonomy -->
        <div class="space-y-4 overflow-y-auto max-h-[68vh] pr-1 md:col-span-7">
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div class="space-y-1.5">
              <label class="text-xs font-bold text-foreground">Project Name *</label>
              <Input v-model="newProject.name" placeholder="e.g. Autonomous Highway Detection" required />
            </div>
            <div class="space-y-1.5">
              <label class="text-xs font-bold text-foreground">Project Code *</label>
              <Input v-model="newProject.code" placeholder="e.g. HIGHWAY-BBOX-01" required />
            </div>
          </div>

          <div class="space-y-1.5">
            <label class="text-xs font-bold text-foreground">Description</label>
            <textarea
              v-model="newProject.description"
              rows="2"
              placeholder="Operational objectives, annotator guidelines, or dataset notes..."
              class="w-full rounded-xl border border-border/50 bg-card p-2.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/40 shadow-inner resize-none"
            ></textarea>
          </div>

          <!-- Class Taxonomy Manager -->
          <div class="space-y-3 rounded-2xl bg-muted/30 p-3.5 border border-border/50">
            <div class="flex items-center justify-between">
              <label class="text-xs font-bold text-foreground">Class Categories (Taxonomy)</label>
              <span class="text-[10px] text-muted-foreground font-mono">Inherited from catalog</span>
            </div>

            <div class="flex flex-wrap gap-1.5">
              <div
                v-for="(label, idx) in projectLabels"
                :key="label.name"
                class="flex items-center gap-1.5 rounded-xl border border-border/50 bg-card px-2.5 py-1 text-xs font-medium shadow-2xs"
              >
                <span class="size-2.5 rounded-full" :style="{ backgroundColor: label.color }"></span>
                <span>{{ label.name }}</span>
                <button
                  type="button"
                  class="text-muted-foreground hover:text-destructive cursor-pointer ml-0.5"
                  title="Remove label"
                  @click="emit('removeLabel', idx)"
                >
                  <Trash2 class="size-3" />
                </button>
              </div>
            </div>

            <div class="flex items-center gap-2 pt-1">
              <Input
                v-model="newLabelName"
                placeholder="Add class name (e.g. Pedestrian)..."
                class="h-9 text-xs flex-1 rounded-xl bg-card"
                @keyup.enter.prevent="onAddLabel"
              />
              <input v-model="newLabelColor" type="color" class="size-9 rounded-xl border-0 p-0.5 bg-card cursor-pointer shadow-2xs" />
              <Button type="button" variant="secondary" size="sm" class="h-9 rounded-xl text-xs btn-tactile" @click="onAddLabel">
                <Plus class="size-3.5 mr-1" /> Add
              </Button>
            </div>
          </div>

          <!-- Raw XML Blueprint Toggle -->
          <div class="border-t border-border/40 pt-2">
            <button
              type="button"
              class="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
              @click="showAdvancedLabelConfig = !showAdvancedLabelConfig"
            >
              <Code2 class="size-3.5" />
              <span>{{ showAdvancedLabelConfig ? 'Hide Raw Schema XML' : 'Inspect Raw Schema XML' }}</span>
            </button>
            <div v-if="showAdvancedLabelConfig" class="mt-2">
              <textarea
                v-model="newProject.label_config"
                rows="4"
                class="w-full font-mono text-xs p-3 rounded-xl bg-zinc-950 text-zinc-200 border border-border/50 resize-y"
              ></textarea>
            </div>
          </div>

          <!-- Bottom Actions -->
          <div class="flex items-center justify-between gap-2 pt-3 border-t border-border/40">
            <Button
              v-if="!editingProjectId"
              variant="outline"
              type="button"
              class="rounded-xl text-xs"
              @click="currentStep = 'CATALOG'"
            >
              ← Back to Catalog
            </Button>
            <div v-else></div>

            <div class="flex items-center gap-2">
              <Button variant="ghost" type="button" class="rounded-xl text-xs" @click="emit('update:showCreateModal', false)">
                Cancel
              </Button>
              <Button type="submit" class="rounded-xl text-xs font-semibold btn-tactile">
                {{ editingProjectId ? 'Save Changes' : 'Create Project' }}
              </Button>
            </div>
          </div>
        </div>

        <!-- Right: Interactive Live Visualizer Preview -->
        <div class="md:col-span-5 md:sticky md:top-2 h-[480px]">
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
