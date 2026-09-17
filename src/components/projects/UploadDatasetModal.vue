<script setup lang="ts">
import { ref, computed } from 'vue'
import Modal from '@/components/ui/Modal.vue'
import Button from '@/components/ui/Button.vue'
import Input from '@/components/ui/Input.vue'
import Badge from '@/components/ui/Badge.vue'
import type { Batch } from '@/types'
import {
  UploadCloud,
  FileArchive,
  Files,
  File,
  CheckCircle2,
  Split,
  FolderPlus,
  Layers,
  ChevronDown,
  ChevronUp,
} from 'lucide-vue-next'

export interface UploadDatasetSubmitPayload {
  uploadName: string
  batchSize: number
  batchName: string
  batchId?: number
}

const props = defineProps<{
  showUploadModal: boolean
  isUploading: boolean
  uploadName: string
  selectedFiles: File[]
  existingBatches?: Batch[]
}>()

const emit = defineEmits<{
  (e: 'update:showUploadModal', val: boolean): void
  (e: 'update:uploadName', val: string): void
  (e: 'selectFiles', files: File[]): void
  (e: 'clearFiles'): void
  (e: 'submit', payload: UploadDatasetSubmitPayload): void
}>()

const fileInputRef = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)

// Mode: 'new' = create new batch, 'existing' = append to existing batch
const targetMode = ref<'new' | 'existing'>('new')
const selectedExistingBatchId = ref<number | undefined>(undefined)

// Advanced auto-split partitioning
const showAdvancedSplit = ref(false)
const enableAutoSplit = ref(false)
const batchSize = ref<number>(50)

const isZip = computed(() => {
  return props.selectedFiles.length === 1 && props.selectedFiles[0].name.toLowerCase().endsWith('.zip')
})

const totalSizeFormatted = computed(() => {
  if (!props.selectedFiles.length) return '0 B'
  const bytes = props.selectedFiles.reduce((acc, f) => acc + f.size, 0)
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
})

const estimatedBatchesCount = computed(() => {
  if (!enableAutoSplit.value || !batchSize.value || batchSize.value <= 0) return 1
  if (props.selectedFiles.length === 0) return 1
  if (isZip.value) return 0
  return Math.ceil(props.selectedFiles.length / batchSize.value)
})

function triggerFileInput() {
  fileInputRef.value?.click()
}

function processIncomingFiles(files: File[]) {
  emit('selectFiles', files)
  if (!props.uploadName && files.length > 0) {
    const rawName = files[0].name.replace(/\.[^/.]+$/, '')
    emit('update:uploadName', rawName)
  }
}

function handleFileInput(e: Event) {
  const target = e.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    processIncomingFiles(Array.from(target.files))
  }
}

function handleDrop(e: DragEvent) {
  isDragging.value = false
  if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
    processIncomingFiles(Array.from(e.dataTransfer.files))
  }
}

function handleDragOver(e: DragEvent) {
  e.preventDefault()
  isDragging.value = true
}

function handleDragLeave() {
  isDragging.value = false
}

function handleSubmit() {
  const finalName = props.uploadName.trim() || 'Dataset Batch'
  emit('submit', {
    uploadName: finalName,
    batchSize: enableAutoSplit.value ? Number(batchSize.value) : 0,
    batchName: finalName,
    batchId: targetMode.value === 'existing' ? selectedExistingBatchId.value : undefined,
  })
}
</script>

<template>
  <Modal
    :open="showUploadModal"
    title="Upload Dataset & Media"
    description="Upload raw media files or a .ZIP archive to create an annotation batch."
    @close="emit('update:showUploadModal', false)"
  >
    <form class="space-y-4" @submit.prevent="handleSubmit">
      <!-- Hidden Native File Input -->
      <input
        ref="fileInputRef"
        type="file"
        multiple
        accept=".zip,image/*,audio/*,video/*,.jsonl,.json,.csv,.txt,.tsv"
        class="hidden"
        @change="handleFileInput"
      />

      <!-- 1. Dropzone Area -->
      <div
        class="relative border border-dashed border-border/80 rounded-2xl p-5 transition-all duration-200 text-center cursor-pointer flex flex-col items-center justify-center gap-3"
        :class="[
          isDragging
            ? 'border-primary bg-primary/10 scale-[0.99]'
            : selectedFiles.length > 0
            ? 'border-primary/40 bg-primary/5 hover:border-primary/70'
            : 'border-border/70 hover:border-primary/50 hover:bg-muted/40 bg-card/60'
        ]"
        @click="triggerFileInput"
        @dragover.prevent="handleDragOver"
        @dragleave.prevent="handleDragLeave"
        @drop.prevent="handleDrop"
      >
        <div
          class="size-11 rounded-2xl flex items-center justify-center transition-transform shadow-xs"
          :class="[
            isZip
              ? 'bg-amber-500/10 text-amber-500 ring-1 ring-amber-500/20'
              : selectedFiles.length > 1
              ? 'bg-primary/10 text-primary ring-1 ring-primary/20'
              : selectedFiles.length === 1
              ? 'bg-emerald-500/10 text-emerald-500 ring-1 ring-emerald-500/20'
              : 'bg-muted text-muted-foreground'
          ]"
        >
          <FileArchive v-if="isZip" class="size-5 animate-pulse" />
          <Files v-else-if="selectedFiles.length > 1" class="size-5" />
          <File v-else-if="selectedFiles.length === 1" class="size-5" />
          <UploadCloud v-else class="size-5" />
        </div>

        <div v-if="selectedFiles.length === 0" class="space-y-1">
          <p class="text-xs font-semibold text-foreground">
            Drop your <span class="text-primary font-bold">.ZIP archive</span> or <span class="text-primary font-bold">media files</span> here
          </p>
          <p class="text-[11px] text-muted-foreground">
            Images, Audio, Video, Text, or .ZIP archive (click to browse)
          </p>
        </div>

        <div v-else class="w-full space-y-2">
          <div class="flex items-center justify-center gap-2">
            <Badge v-if="isZip" variant="warning" class="px-2.5 py-1 text-xs gap-1">
              <FileArchive class="size-3.5" />
              ZIP Archive (Server Auto-Extract)
            </Badge>
            <Badge v-else-if="selectedFiles.length > 1" variant="info" class="px-2.5 py-1 text-xs gap-1">
              <Files class="size-3.5" />
              {{ selectedFiles.length }} Files Selected
            </Badge>
            <Badge v-else variant="success" class="px-2.5 py-1 text-xs gap-1">
              <CheckCircle2 class="size-3.5" />
              1 File Selected
            </Badge>

            <span class="text-xs font-mono text-muted-foreground font-medium">
              ({{ totalSizeFormatted }})
            </span>
          </div>

          <div class="max-h-20 overflow-y-auto px-2 py-1 space-y-0.5 text-left bg-background/80 rounded-xl border border-border/50 text-xs">
            <div
              v-for="(f, idx) in selectedFiles.slice(0, 3)"
              :key="idx"
              class="flex items-center justify-between text-muted-foreground truncate"
            >
              <span class="truncate pr-2 text-[11px]">{{ f.name }}</span>
              <span class="text-[10px] text-muted-foreground/70 shrink-0 font-mono">
                {{ (f.size / 1024).toFixed(0) }} KB
              </span>
            </div>
            <div v-if="selectedFiles.length > 3" class="text-[10px] text-center font-medium text-primary pt-0.5">
              + {{ selectedFiles.length - 3 }} more files...
            </div>
          </div>
        </div>
      </div>

      <!-- 2. Target Strategy Selector (Only if existing batches available) -->
      <div v-if="existingBatches && existingBatches.length > 0" class="flex rounded-xl bg-muted/60 p-1 border border-border/50">
        <button
          type="button"
          class="flex-1 py-1 px-2 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          :class="targetMode === 'new' ? 'bg-background shadow-xs text-foreground font-semibold' : 'text-muted-foreground hover:text-foreground'"
          @click="targetMode = 'new'"
        >
          <FolderPlus class="size-3.5" />
          <span>Create New Batch</span>
        </button>
        <button
          type="button"
          class="flex-1 py-1 px-2 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          :class="targetMode === 'existing' ? 'bg-background shadow-xs text-foreground font-semibold' : 'text-muted-foreground hover:text-foreground'"
          @click="targetMode = 'existing'"
        >
          <Layers class="size-3.5" />
          <span>Append to Existing</span>
        </button>
      </div>

      <!-- 3. Target Batch Dropdown (when targetMode === 'existing') -->
      <div v-if="targetMode === 'existing'" class="space-y-1.5">
        <label class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Target Batch
        </label>
        <select
          v-model="selectedExistingBatchId"
          class="w-full rounded-xl border border-border/60 bg-background px-3 py-2 text-xs font-medium text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
          required
        >
          <option :value="undefined" disabled>Select an existing batch...</option>
          <option v-for="b in existingBatches" :key="b.id" :value="b.id">
            {{ b.name }} ({{ b.total_items }} items • {{ b.status }})
          </option>
        </select>
      </div>

      <!-- 4. Single Dataset / Batch Name (when targetMode === 'new') -->
      <div v-else class="space-y-1">
        <label class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Dataset / Batch Name
        </label>
        <Input
          :model-value="uploadName"
          placeholder="e.g. Jakarta_Traffic_Batch_01"
          required
          @input="emit('update:uploadName', ($event.target as HTMLInputElement).value)"
        />
      </div>

      <!-- 5. Advanced Partitioning Options (Collapsible) -->
      <div v-if="targetMode === 'new'" class="border border-border/50 rounded-xl overflow-hidden">
        <button
          type="button"
          class="w-full px-3 py-2 bg-muted/20 flex items-center justify-between text-xs text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
          @click="showAdvancedSplit = !showAdvancedSplit"
        >
          <span class="flex items-center gap-1.5 font-medium">
            <Split class="size-3.5 text-primary" />
            <span>Advanced Partitioning (Auto-Split)</span>
          </span>
          <component :is="showAdvancedSplit ? ChevronUp : ChevronDown" class="size-3.5" />
        </button>

        <div v-if="showAdvancedSplit" class="p-3 bg-card space-y-3 border-t border-border/40">
          <div class="flex items-center justify-between">
            <div>
              <span class="text-xs font-semibold text-foreground block">Auto-Split into Multiple Batches</span>
              <span class="text-[11px] text-muted-foreground">Partition large uploads into smaller batches</span>
            </div>
            <input
              v-model="enableAutoSplit"
              type="checkbox"
              class="size-4 rounded accent-primary cursor-pointer"
            />
          </div>

          <div v-if="enableAutoSplit" class="pt-2 border-t border-border/40 grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
            <div class="space-y-1">
              <label class="text-[11px] font-semibold text-muted-foreground">
                Items per Batch
              </label>
              <input
                v-model.number="batchSize"
                type="number"
                min="1"
                max="5000"
                class="w-full rounded-xl border border-border/60 bg-background px-3 py-1.5 text-xs font-medium text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                placeholder="e.g. 50"
              />
            </div>

            <div class="p-2 rounded-lg bg-primary/10 border border-primary/20 text-primary text-[11px] flex items-center gap-1.5">
              <span v-if="isZip">
                ZIP will be partitioned into ~{{ batchSize }} items/batch.
              </span>
              <span v-else-if="selectedFiles.length > 0">
                Will create <strong>{{ estimatedBatchesCount }} batch(es)</strong>.
              </span>
              <span v-else>
                Enter items per batch.
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex items-center justify-end gap-2.5 pt-3 border-t border-border/40">
        <Button
          variant="ghost"
          type="button"
          class="rounded-xl cursor-pointer"
          :disabled="isUploading"
          @click="emit('update:showUploadModal', false)"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          :disabled="isUploading || selectedFiles.length === 0 || (targetMode === 'existing' && !selectedExistingBatchId)"
          class="rounded-xl font-semibold gap-2 cursor-pointer shadow-sm"
        >
          <UploadCloud class="size-4" />
          <span>
            {{ isUploading ? 'Processing & Ingesting...' : isZip ? 'Upload & Extract ZIP' : `Upload ${selectedFiles.length || ''} File(s)` }}
          </span>
        </Button>
      </div>
    </form>
  </Modal>
</template>
