<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  UploadCloud,
  FileText,
  Headphones,
  Image as ImageIcon,
  Video as VideoIcon,
  Sparkles,
} from 'lucide-vue-next'
import Button from '@/components/ui/Button.vue'

const props = defineProps<{
  modality: string
  itemTitle?: string
}>()

const emit = defineEmits<{
  (e: 'fileSelected', file: File, objectUrl: string): void
  (e: 'textSubmitted', text: string): void
}>()

const isDragging = ref(false)
const showTextPrompt = ref(false)
const manualText = ref('')
const fileInputRef = ref<HTMLInputElement | null>(null)

const acceptedTypes = computed(() => {
  const m = (props.modality || '').toUpperCase()
  if (m === 'AUDIO') return 'audio/mp3,audio/wav,audio/ogg,audio/m4a,.mp3,.wav,.m4a'
  if (m === 'VIDEO') return 'video/mp4,video/webm,video/quicktime,.mp4,.webm'
  if (m === 'TEXT') return 'text/plain,.txt,.json,.csv'
  return 'image/png,image/jpeg,image/webp,image/svg+xml,.png,.jpg,.jpeg,.webp'
})

const modalityIcon = computed(() => {
  const m = (props.modality || '').toUpperCase()
  if (m === 'AUDIO') return Headphones
  if (m === 'VIDEO') return VideoIcon
  if (m === 'TEXT') return FileText
  return ImageIcon
})

const modalityHelpText = computed(() => {
  const m = (props.modality || '').toUpperCase()
  if (m === 'AUDIO') return 'Upload audio clip (.mp3, .wav, .m4a) to preview diarization & waveforms'
  if (m === 'VIDEO') return 'Upload video clip (.mp4, .webm) to preview timeline tracking'
  if (m === 'TEXT') return 'Upload a text file (.txt) or paste raw text to preview token highlighting'
  return 'Upload an image (.jpg, .png, .webp) to preview bounding boxes & masks'
})

function onFileChange(e: Event) {
  const target = e.target as HTMLInputElement
  if (target.files && target.files[0]) {
    handleFile(target.files[0])
  }
}

function onDrop(e: DragEvent) {
  isDragging.value = false
  if (e.dataTransfer?.files && e.dataTransfer.files[0]) {
    handleFile(e.dataTransfer.files[0])
  }
}

function handleFile(file: File) {
  const url = URL.createObjectURL(file)
  emit('fileSelected', file, url)
}

function triggerFileInput() {
  fileInputRef.value?.click()
}

function submitManualText() {
  if (!manualText.value.trim()) return
  emit('textSubmitted', manualText.value.trim())
}
</script>

<template>
  <div
    class="relative flex h-full w-full flex-col items-center justify-center p-6 text-center transition-all duration-200"
    :class="isDragging ? 'bg-primary/10 ring-2 ring-dashed ring-primary' : 'bg-zinc-950/60'"
    @dragover.prevent="isDragging = true"
    @dragleave.prevent="isDragging = false"
    @drop.prevent="onDrop"
  >
    <input
      ref="fileInputRef"
      type="file"
      class="hidden"
      :accept="acceptedTypes"
      @change="onFileChange"
    />

    <!-- Text input alternative for TEXT modality -->
    <div v-if="modality === 'TEXT' && showTextPrompt" class="w-full max-w-md space-y-3">
      <div class="text-left">
        <label class="text-xs font-bold text-zinc-300">Enter Sample Text to Annotate</label>
        <textarea
          v-model="manualText"
          rows="4"
          placeholder="Paste or type sample text here to test token highlighting..."
          class="mt-1.5 w-full rounded-2xl border border-white/10 bg-zinc-900 p-3 text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-primary/40 resize-none"
        ></textarea>
      </div>
      <div class="flex items-center justify-end gap-2">
        <Button variant="ghost" size="sm" class="text-xs text-zinc-400" @click="showTextPrompt = false">
          Cancel
        </Button>
        <Button size="sm" class="text-xs font-semibold" @click="submitManualText">
          Apply Sample Text
        </Button>
      </div>
    </div>

    <!-- Default Dropzone Visual -->
    <div v-else class="max-w-sm flex flex-col items-center space-y-3">
      <div class="flex size-14 items-center justify-center rounded-2xl border border-white/10 bg-zinc-900/80 text-zinc-400 shadow-inner">
        <component :is="modalityIcon" class="size-6 text-primary/80" />
      </div>

      <div class="space-y-1">
        <h4 class="text-xs font-bold uppercase tracking-wider text-zinc-200">
          No Sample Asset Attached
        </h4>
        <p class="text-[11.5px] leading-relaxed text-zinc-400">
          {{ modalityHelpText }}
        </p>
      </div>

      <div class="pt-2 flex flex-col sm:flex-row items-center gap-2">
        <Button
          type="button"
          size="sm"
          class="h-8.5 px-3 text-xs font-semibold gap-1.5 rounded-xl btn-tactile cursor-pointer"
          @click="triggerFileInput"
        >
          <UploadCloud class="size-3.5" />
          <span>Upload Sample File</span>
        </Button>

        <Button
          v-if="modality === 'TEXT'"
          type="button"
          variant="secondary"
          size="sm"
          class="h-8.5 px-3 text-xs font-semibold rounded-xl btn-tactile cursor-pointer"
          @click="showTextPrompt = true"
        >
          <span>Paste Text</span>
        </Button>
      </div>

      <span class="text-[10px] font-mono text-zinc-500 pt-1">
        Drag and drop your file here
      </span>
    </div>
  </div>
</template>
