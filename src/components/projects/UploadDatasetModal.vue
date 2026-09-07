<script setup lang="ts">
import { ref, computed } from 'vue'
import Modal from '@/components/ui/Modal.vue'
import Button from '@/components/ui/Button.vue'
import Input from '@/components/ui/Input.vue'
import Badge from '@/components/ui/Badge.vue'
import {
  UploadCloud,
  FileArchive,
  Files,
  File,
  X,
  CheckCircle2,
} from 'lucide-vue-next'

const props = defineProps<{
  showUploadModal: boolean
  isUploading: boolean
  uploadName: string
  selectedFiles: File[]
}>()

const emit = defineEmits<{
  (e: 'update:showUploadModal', val: boolean): void
  (e: 'update:uploadName', val: string): void
  (e: 'filesSelected', files: File[]): void
  (e: 'clearFiles'): void
  (e: 'submit'): void
}>()

const fileInputRef = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)

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
</script>

<template>
  <Modal
    :open="showUploadModal"
    title="Upload Dataset & Media Batch"
    description="Supports single media, bulk multi-file selection, or .ZIP archive (auto-extracted)."
    @close="emit('update:showUploadModal', false)"
  >
    <form class="space-y-4" @submit.prevent="emit('submit')">
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
        class="relative border-2 border-dashed rounded-2xl p-6 transition-all duration-200 text-center cursor-pointer flex flex-col items-center justify-center gap-3"
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
          class="size-14 rounded-2xl flex items-center justify-center transition-transform shadow-xs"
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
          <FileArchive v-if="isZip" class="size-7 animate-pulse" />
          <Files v-else-if="selectedFiles.length > 1" class="size-7" />
          <File v-else-if="selectedFiles.length === 1" class="size-7" />
          <UploadCloud v-else class="size-7" />
        </div>

        <!-- Text / Status -->
        <div v-if="selectedFiles.length === 0" class="space-y-1">
          <p class="text-sm font-semibold text-foreground">
            Drop your <span class="text-primary font-bold">.ZIP archive</span> or <span class="text-primary font-bold">multiple files</span> here
          </p>
          <p class="text-xs text-muted-foreground">
            Click to browse (Images, Audio, Video, Text, or .ZIP)
          </p>
        </div>

        <!-- Selected State -->
        <div v-else class="w-full space-y-2">
          <div class="flex items-center justify-center gap-2">
            <Badge v-if="isZip" variant="warning" class="px-2.5 py-1 text-xs gap-1">
              <FileArchive class="size-3.5" />
              ZIP Archive (Auto-Unpack)
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

          <div class="max-h-24 overflow-y-auto px-2 py-1 space-y-1 text-left bg-background/80 rounded-xl border border-border/50 text-xs">
            <div
              v-for="(f, idx) in selectedFiles.slice(0, 5)"
              :key="idx"
              class="flex items-center justify-between text-muted-foreground truncate"
            >
              <span class="truncate pr-2">• {{ f.name }}</span>
              <span class="text-[10px] text-muted-foreground/70 shrink-0 font-mono">
                {{ (f.size / 1024).toFixed(0) }} KB
              </span>
            </div>
            <div v-if="selectedFiles.length > 5" class="text-[11px] text-center font-medium text-primary pt-0.5">
              + {{ selectedFiles.length - 5 }} more files...
            </div>
          </div>

          <p class="text-[11px] text-muted-foreground hover:underline">
            Click to choose different files
          </p>
        </div>
      </div>

      <!-- Dataset Batch Name -->
      <div class="space-y-1.5">
        <div class="flex items-center justify-between">
          <label class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Dataset / Batch Name
          </label>
          <button
            v-if="selectedFiles.length > 0"
            type="button"
            class="text-[11px] text-destructive hover:underline flex items-center gap-1 cursor-pointer"
            @click.stop="emit('clearFiles')"
          >
            <X class="size-3" />
            Reset files
          </button>
        </div>
        <Input
          :model-value="uploadName"
          placeholder="e.g. Batch_Dataset_March_2026"
          required
          @input="emit('update:uploadName', ($event.target as HTMLInputElement).value)"
        />
        <span class="text-[11px] text-muted-foreground">
          This name identifies this upload batch in datasets & task queues.
        </span>
      </div>

      <!-- Actions -->
      <div class="flex items-center justify-end gap-2.5 pt-3">
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
          :disabled="isUploading || selectedFiles.length === 0"
          class="rounded-xl font-semibold gap-2 cursor-pointer shadow-sm"
        >
          <UploadCloud class="size-4" />
          <span>
            {{ isUploading ? 'Uploading & Processing...' : isZip ? 'Upload & Extract ZIP' : `Upload ${selectedFiles.length || ''} File(s)` }}
          </span>
        </Button>
      </div>
    </form>
  </Modal>
</template>

