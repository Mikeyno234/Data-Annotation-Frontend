<script setup lang="ts">
import { computed } from 'vue'
import type { ModalityType } from '@/types'
import Modal from '@/components/ui/Modal.vue'
import Button from '@/components/ui/Button.vue'
import Input from '@/components/ui/Input.vue'
import AnnotationTypePreview from '@/components/annotation/AnnotationTypePreview.vue'
import TemplateSchemaEditor from './TemplateSchemaEditor.vue'
import { Wand2 } from 'lucide-vue-next'

const props = defineProps<{
  showModal: boolean
  editingId: number | null
  isSaving: boolean
  isCodeManual: boolean
  form: {
    code: string
    name: string
    modality: ModalityType
    level: 'CATEGORY' | 'SUB_TYPE'
    parent_id: number | null
    tool_type: string
    description: string
    instructions: string
    badgesText: string
    preview_image_url: string
    previewDataJson: string
    label_config: string
    status: 'ACTIVE' | 'INACTIVE'
  }
  isXmlMode: boolean
  visualLabels: Array<{ name: string; color: string }>
  newLabelName: string
  newLabelColor: string
  modalityList: Array<{ value: string; label: string; icon: any; color: string }>
  toolsByModality: Record<ModalityType, Array<any>>
  activeLabelPresets: Array<{ label: string; items: Array<{ name: string; color: string }> }>
}>()

const emit = defineEmits<{
  (e: 'update:showModal', val: boolean): void
  (e: 'update:isXmlMode', val: boolean): void
  (e: 'nameInput'): void
  (e: 'modalityChange'): void
  (e: 'selectTool', tool: any): void
  (e: 'insertGuidelines'): void
  (e: 'addLabel', label: { name: string; color: string }): void
  (e: 'removeLabel', index: number): void
  (e: 'applyPreset', items: Array<{ name: string; color: string }>): void
  (e: 'save'): void
}>()

const livePreviewItem = computed(() => {
  let parsedPreview = null
  try {
    if (props.form.previewDataJson) parsedPreview = JSON.parse(props.form.previewDataJson)
  } catch {
    // ignore
  }

  return {
    id: props.editingId || 0,
    code: props.form.code || 'PREVIEW_CODE',
    name: props.form.name || 'Untitled Template',
    modality: props.form.modality,
    tool_type: props.form.tool_type,
    instructions: props.form.instructions,
    description: props.form.description,
    preview_image_url: props.form.preview_image_url,
    preview_data: parsedPreview,
    badges: props.form.badgesText ? props.form.badgesText.split(',').map((s) => s.trim()) : [],
    status: props.form.status,
  }
})
</script>

<template>
  <Modal
    :open="showModal"
    :title="editingId ? 'Edit Task Schema' : 'Create Task Schema'"
    max-width="max-w-6xl"
    @close="emit('update:showModal', false)"
  >
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      <!-- Left Column: Schema Builder Form -->
      <form class="lg:col-span-7 space-y-6" @submit.prevent="emit('save')">
        <!-- 1. Basic Info -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div class="sm:col-span-2 space-y-1.5">
            <label class="text-xs font-semibold text-foreground flex items-center justify-between">
              <span>Schema Name *</span>
              <span class="font-mono text-[10px] text-muted-foreground">ID: {{ form.code }}</span>
            </label>
            <Input
              v-model="form.name"
              placeholder="e.g. 2D Bounding Box or Speaker Diarization"
              required
              class="rounded-xl h-10"
              @input="emit('nameInput')"
            />
          </div>

          <div class="space-y-1.5">
            <label class="text-xs font-semibold text-foreground">Status</label>
            <select
              v-model="form.status"
              class="w-full rounded-xl border border-border/40 bg-muted/50 px-3 py-2 text-xs font-semibold text-foreground focus:bg-card focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer h-10"
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </div>
        </div>

        <!-- 2. Media Modality Selector -->
        <div class="space-y-2">
          <label class="text-xs font-semibold text-foreground">Media Modality *</label>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              v-for="m in modalityList.slice(1)"
              :key="m.value"
              type="button"
              class="flex items-center justify-center gap-2 rounded-xl border p-2.5 text-xs font-semibold transition-all cursor-pointer"
              :class="form.modality === m.value ? 'bg-primary/10 border-primary text-primary shadow-xs' : 'bg-card border-border/40 text-muted-foreground hover:text-foreground'"
              @click="form.modality = m.value as ModalityType; emit('modalityChange')"
            >
              <component :is="m.icon" class="size-4" />
              <span>{{ m.label.split(' ')[0] }}</span>
            </button>
          </div>
        </div>

        <!-- 3. Tool Picker -->
        <div class="space-y-2.5">
          <div class="flex items-center justify-between">
            <label class="text-xs font-semibold text-foreground">Annotation Tool *</label>
            <span class="text-[11px] text-muted-foreground">Select workspace canvas engine</span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div
              v-for="tool in (toolsByModality[form.modality] || [])"
              :key="tool.code"
              class="relative flex flex-col justify-between p-3 rounded-2xl border text-left transition-all cursor-pointer"
              :class="form.tool_type === tool.code ? 'bg-primary/10 border-primary text-foreground shadow-xs' : 'bg-card border-border/40 hover:border-border text-muted-foreground hover:text-foreground'"
              @click="emit('selectTool', tool)"
            >
              <div class="flex items-center gap-2">
                <component :is="tool.icon" class="size-4 shrink-0" :class="form.tool_type === tool.code ? 'text-primary' : 'text-muted-foreground'" />
                <span class="text-xs font-bold text-foreground">{{ tool.label }}</span>
              </div>
              <p class="mt-1 text-[11px] leading-relaxed text-muted-foreground line-clamp-2">
                {{ tool.desc }}
              </p>
              <div v-if="form.tool_type === tool.code" class="absolute top-2.5 right-2.5">
                <span class="size-2 rounded-full bg-primary inline-block"></span>
              </div>
            </div>
          </div>
        </div>

        <!-- 4. Guidelines -->
        <div class="space-y-1.5">
          <div class="flex items-center justify-between">
            <label class="text-xs font-semibold text-foreground">Annotator Guidelines & Instructions</label>
            <button
              type="button"
              class="flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline cursor-pointer"
              @click="emit('insertGuidelines')"
            >
              <Wand2 class="size-3" />
              <span>Insert Recommended Guidelines</span>
            </button>
          </div>
          <textarea
            v-model="form.instructions"
            rows="3"
            placeholder="What should the annotator do? e.g. Draw tight bounding boxes around vehicles..."
            class="w-full rounded-2xl border border-border/40 bg-muted/40 p-3.5 text-xs leading-relaxed text-foreground placeholder:text-muted-foreground/60 focus:bg-card focus:outline-none focus:ring-2 focus:ring-primary/40 shadow-inner"
          ></textarea>
        </div>

        <!-- 5. Default Label Classes & XML Config -->
        <TemplateSchemaEditor
          :is-xml-mode="isXmlMode"
          :label-config="form.label_config"
          :visual-labels="visualLabels"
          :active-label-presets="activeLabelPresets"
          :preview-image-url="form.preview_image_url"
          :preview-data-json="form.previewDataJson"
          @update:is-xml-mode="emit('update:isXmlMode', $event)"
          @update:label-config="form.label_config = $event"
          @update:preview-image-url="form.preview_image_url = $event"
          @update:preview-data-json="form.previewDataJson = $event"
          @add-label="emit('addLabel', $event)"
          @remove-label="emit('removeLabel', $event)"
          @apply-preset="emit('applyPreset', $event)"
        />

        <!-- Save Actions -->
        <div class="flex items-center justify-end gap-3 pt-4 border-t border-border/40">
          <Button
            type="button"
            variant="ghost"
            class="rounded-xl px-5 text-xs font-semibold"
            @click="emit('update:showModal', false)"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            :disabled="isSaving"
            class="rounded-xl px-6 text-xs font-semibold shadow-xs"
          >
            {{ isSaving ? 'Saving...' : editingId ? 'Update Schema' : 'Save Schema' }}
          </Button>
        </div>
      </form>

      <!-- Right Column: Live Annotator Preview -->
      <div class="lg:col-span-5 lg:sticky lg:top-4 space-y-3">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold text-foreground uppercase tracking-wider font-mono">
            Annotator Workspace Preview
          </span>
          <span class="text-[11px] text-muted-foreground">Real-time Simulation</span>
        </div>
        <div class="h-[480px] w-full">
          <AnnotationTypePreview :task="livePreviewItem" :modality="form.modality" />
        </div>
      </div>
    </div>
  </Modal>
</template>
