<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import Modal from '@/components/ui/Modal.vue'
import Button from '@/components/ui/Button.vue'
import Input from '@/components/ui/Input.vue'
import Badge from '@/components/ui/Badge.vue'
import type { Batch, User } from '@/types'
import {
  UploadCloud,
  FileArchive,
  Files,
  File,
  X,
  CheckCircle2,
  Split,
  Users,
  FolderPlus,
  Layers,
  Search,
} from 'lucide-vue-next'

export interface UploadDatasetSubmitPayload {
  uploadName: string
  batchSize: number
  batchName: string
  batchId?: number
  assigneeIds: number[]
}

const props = defineProps<{
  showUploadModal: boolean
  isUploading: boolean
  uploadName: string
  selectedFiles: File[]
  existingBatches?: Batch[]
  availableAnnotators?: User[]
}>()

const emit = defineEmits<{
  (e: 'update:showUploadModal', val: boolean): void
  (e: 'update:uploadName', val: string): void
  (e: 'filesSelected', files: File[]): void
  (e: 'clearFiles'): void
  (e: 'submit', payload: UploadDatasetSubmitPayload): void
}>()

const fileInputRef = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)

// Mode: 'new' = create new batch(es), 'existing' = append to existing batch
const targetMode = ref<'new' | 'existing'>('new')
const selectedExistingBatchId = ref<number | undefined>(undefined)

// Batch Configuration
const customBatchName = ref('')
const enableAutoSplit = ref(false)
const batchSize = ref<number>(25)
const selectedAssigneeIds = ref<number[]>([])
const annotatorSearch = ref('')

watch(
  () => props.uploadName,
  (val) => {
    if (!customBatchName.value && val) {
      customBatchName.value = val
    }
  },
  { immediate: true }
)

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
  if (isZip.value) return 0 // Extracted server-side
  return Math.ceil(props.selectedFiles.length / batchSize.value)
})

const filteredAnnotators = computed(() => {
  const list = props.availableAnnotators || []
  if (!annotatorSearch.value.trim()) return list
  const q = annotatorSearch.value.toLowerCase().trim()
  return list.filter(
    (u) =>
      u.full_name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.role?.name?.toLowerCase().includes(q)
  )
})

function toggleAssignee(userId: number) {
  const idx = selectedAssigneeIds.value.indexOf(userId)
  if (idx >= 0) {
    selectedAssigneeIds.value.splice(idx, 1)
  } else {
    selectedAssigneeIds.value.push(userId)
  }
}

function triggerFileInput() {
  fileInputRef.value?.click()
}

function handleFileInput(e: Event) {
  const target = e.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    emit('filesSelected', Array.from(target.files))
  }
}

function handleDrop(e: DragEvent) {
  isDragging.value = false
  if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
    emit('filesSelected', Array.from(e.dataTransfer.files))
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
  emit('submit', {
    uploadName: props.uploadName,
    batchSize: enableAutoSplit.value ? Number(batchSize.value) : 0,
    batchName: customBatchName.value || props.uploadName,
    batchId: targetMode.value === 'existing' ? selectedExistingBatchId.value : undefined,
    assigneeIds: selectedAssigneeIds.value,
  })
}
</script>

<template>
  <Modal
    :open="showUploadModal"
    title="Upload Dataset & Media Batches"
    description="Upload raw media files or a .ZIP archive, configure auto-splitting, and allocate annotators."
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

      <!-- Dropzone Area -->
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
        <!-- Icon Based on state -->
        <div
          class="size-12 rounded-2xl flex items-center justify-center transition-transform shadow-xs"
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
          <FileArchive v-if="isZip" class="size-6 animate-pulse" />
          <Files v-else-if="selectedFiles.length > 1" class="size-6" />
          <File v-else-if="selectedFiles.length === 1" class="size-6" />
          <UploadCloud v-else class="size-6" />
        </div>

        <!-- Text / Status -->
        <div v-if="selectedFiles.length === 0" class="space-y-1">
          <p class="text-xs font-semibold text-foreground">
            Drop your <span class="text-primary font-bold">.ZIP archive</span> or <span class="text-primary font-bold">multiple media files</span> here
          </p>
          <p class="text-[11px] text-muted-foreground">
            Click to browse (Images, Audio, Video, Text, or .ZIP archive)
          </p>
        </div>

        <!-- Selected State -->
        <div v-else class="w-full space-y-2">
          <div class="flex items-center justify-center gap-2">
            <Badge v-if="isZip" variant="warning" class="px-2.5 py-1 text-xs gap-1">
              <FileArchive class="size-3.5" />
              ZIP Archive (Server Extraction)
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
              v-for="(f, idx) in selectedFiles.slice(0, 4)"
              :key="idx"
              class="flex items-center justify-between text-muted-foreground truncate"
            >
              <span class="truncate pr-2 text-[11px]">{{ f.name }}</span>
              <span class="text-[10px] text-muted-foreground/70 shrink-0 font-mono">
                {{ (f.size / 1024).toFixed(0) }} KB
              </span>
            </div>
            <div v-if="selectedFiles.length > 4" class="text-[10px] text-center font-medium text-primary pt-0.5">
              + {{ selectedFiles.length - 4 }} more files...
            </div>
          </div>
        </div>
      </div>

      <!-- Dataset & Batch Target Strategy -->
      <div class="space-y-3 pt-1">
        <!-- Target Toggle (New Batch vs Append to Existing) -->
        <div v-if="existingBatches && existingBatches.length > 0" class="flex rounded-xl bg-muted/60 p-1 border border-border/50">
          <button
            type="button"
            class="flex-1 py-1 px-2 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5"
            :class="targetMode === 'new' ? 'bg-background shadow-xs text-foreground font-semibold' : 'text-muted-foreground hover:text-foreground'"
            @click="targetMode = 'new'"
          >
            <FolderPlus class="size-3.5" />
            <span>Create New Batch(es)</span>
          </button>
          <button
            type="button"
            class="flex-1 py-1 px-2 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5"
            :class="targetMode === 'existing' ? 'bg-background shadow-xs text-foreground font-semibold' : 'text-muted-foreground hover:text-foreground'"
            @click="targetMode = 'existing'"
          >
            <Layers class="size-3.5" />
            <span>Append to Existing Batch</span>
          </button>
        </div>

        <!-- Mode A: Append to Existing Batch -->
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
          <span class="text-[11px] text-muted-foreground">
            Newly uploaded items will be merged directly into this batch.
          </span>
        </div>

        <!-- Mode B: Create New Batch / Auto-Split -->
        <div v-else class="space-y-3">
          <!-- Batch Name & Upload Name -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div class="space-y-1">
              <label class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Upload Dataset Name
              </label>
              <Input
                :model-value="uploadName"
                placeholder="e.g. Dataset_Audio_01"
                required
                @input="emit('update:uploadName', ($event.target as HTMLInputElement).value)"
              />
            </div>
            <div class="space-y-1">
              <label class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Batch Name Prefix
              </label>
              <Input
                v-model="customBatchName"
                placeholder="e.g. Batch - Audio Review"
              />
            </div>
          </div>

          <!-- Auto-Split Batch Controls -->
          <div class="p-3 rounded-xl border border-border/60 bg-muted/20 space-y-2.5">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <Split class="size-4 text-primary" />
                <div>
                  <span class="text-xs font-semibold text-foreground block">Auto-Split into Multiple Batches</span>
                  <span class="text-[11px] text-muted-foreground">Automatically partitions files into manageable chunks for parallel annotation</span>
                </div>
              </div>
              <input
                v-model="enableAutoSplit"
                type="checkbox"
                class="size-4 rounded accent-primary cursor-pointer"
              />
            </div>

            <!-- Batch Size Slider / Input -->
            <div v-if="enableAutoSplit" class="pt-2 border-t border-border/40 grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
              <div class="space-y-1">
                <label class="text-[11px] font-semibold text-muted-foreground">
                  Items per Batch
                </label>
                <input
                  v-model.number="batchSize"
                  type="number"
                  min="1"
                  max="1000"
                  class="w-full rounded-xl border border-border/60 bg-background px-3 py-1.5 text-xs font-medium text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                  placeholder="e.g. 25"
                />
              </div>

              <!-- Calculation Preview Badge -->
              <div class="p-2 rounded-lg bg-primary/10 border border-primary/20 text-primary text-[11px] flex items-center gap-1.5">
                <Split class="size-3.5 shrink-0" />
                <span v-if="isZip">
                  ZIP will be unpacked and auto-partitioned into ~{{ batchSize }} items/batch.
                </span>
                <span v-else-if="selectedFiles.length > 0">
                  Will create <strong>{{ estimatedBatchesCount }} batch(es)</strong> (max {{ batchSize }} items each).
                </span>
                <span v-else>
                  Enter items per batch to automatically chunk uploads.
                </span>
              </div>
            </div>
          </div>

          <!-- Direct Annotator Assignment Pool -->
          <div v-if="availableAnnotators && availableAnnotators.length > 0" class="space-y-1.5">
            <div class="flex items-center justify-between">
              <label class="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Users class="size-3.5" />
                Direct Annotator Allocation (Optional)
              </label>
              <span class="text-[11px] text-primary font-medium">
                {{ selectedAssigneeIds.length }} selected
              </span>
            </div>

            <div class="relative">
              <Search class="size-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
              <input
                v-model="annotatorSearch"
                type="text"
                placeholder="Search annotators by name or email..."
                class="w-full rounded-xl border border-border/60 bg-background pl-8 pr-3 py-1.5 text-xs font-medium text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
              />
            </div>

            <div class="max-h-28 overflow-y-auto rounded-xl border border-border/50 bg-background/60 p-1.5 space-y-1">
              <div
                v-for="u in filteredAnnotators"
                :key="u.id"
                class="flex items-center justify-between p-1.5 rounded-lg text-xs cursor-pointer transition-colors"
                :class="selectedAssigneeIds.includes(u.id) ? 'bg-primary/10 text-primary font-semibold' : 'hover:bg-muted/60 text-foreground'"
                @click="toggleAssignee(u.id)"
              >
                <div class="flex items-center gap-2 truncate">
                  <input
                    type="checkbox"
                    :checked="selectedAssigneeIds.includes(u.id)"
                    class="size-3.5 rounded accent-primary cursor-pointer"
                    @click.stop="toggleAssignee(u.id)"
                  />
                  <span class="truncate">{{ u.full_name || u.email }}</span>
                </div>
                <Badge variant="outline" class="text-[10px] px-1.5 py-0 capitalize shrink-0">
                  {{ u.role?.name || 'Annotator' }}
                </Badge>
              </div>
              <div v-if="filteredAnnotators.length === 0" class="text-center py-2 text-xs text-muted-foreground">
                No matching workforce members
              </div>
            </div>
            <p class="text-[10px] text-muted-foreground">
              Selected annotators will be assigned immediately to each batch created.
            </p>
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
            {{ isUploading ? 'Processing & Creating Batches...' : isZip ? 'Upload & Extract ZIP' : `Upload ${selectedFiles.length || ''} File(s)` }}
          </span>
        </Button>
      </div>
    </form>
  </Modal>
</template>
