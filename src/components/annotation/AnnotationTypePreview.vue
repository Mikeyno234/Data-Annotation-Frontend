<script setup lang="ts">
import { computed, ref, watch, toRef } from 'vue'
import { Eye, UploadCloud, RotateCcw } from 'lucide-vue-next'
import type { MetadataOption } from '@/api/metadata'
import type { AnnotationType } from '@/types'
import AudioTypePreview, { type AudioSegmentItem } from './preview/AudioTypePreview.vue'
import ImageTypePreview, {
  type BoundingBoxItem,
  type PolygonMaskItem,
  type KeypointItem,
  type ImageTagItem,
} from './preview/ImageTypePreview.vue'
import TextTypePreview, { type NerSpanItem } from './preview/TextTypePreview.vue'
import VideoTypePreview, { type VideoActionItem } from './preview/VideoTypePreview.vue'
import SampleAssetDropzone from './SampleAssetDropzone.vue'
import { useAnnotationPreviewData } from './useAnnotationPreviewData'

export type {
  BoundingBoxItem,
  PolygonMaskItem,
  KeypointItem,
  NerSpanItem,
  AudioSegmentItem,
  VideoActionItem,
  ImageTagItem,
}

const props = defineProps<{
  task?: MetadataOption | AnnotationType | null
  modality?: string
  fallbackTitle?: string
}>()

const activeHoverId = ref<string | null>(null)
const customFileUrl = ref<string | null>(null)
const customFileName = ref<string | null>(null)
const customTextContent = ref<string | null>(null)

// Reset custom upload when task blueprint changes
watch(
  () => props.task,
  () => {
    customFileUrl.value = null
    customFileName.value = null
    customTextContent.value = null
  }
)

function onCustomFileSelected(file: File, objectUrl: string) {
  customFileUrl.value = objectUrl
  customFileName.value = file.name
}

function onCustomTextSubmitted(text: string) {
  customTextContent.value = text
  customFileName.value = 'Custom Text'
}

function resetCustomAsset() {
  customFileUrl.value = null
  customFileName.value = null
  customTextContent.value = null
}

const headerFileInputRef = ref<HTMLInputElement | null>(null)

function triggerHeaderUpload() {
  headerFileInputRef.value?.click()
}

function onHeaderFileChange(e: Event) {
  const target = e.target as HTMLInputElement
  if (target.files && target.files[0]) {
    const file = target.files[0]
    const objectUrl = URL.createObjectURL(file)
    onCustomFileSelected(file, objectUrl)
    target.value = ''
  }
}

const {
  itemTitle,
  itemModality,
  parsedPreviewData,
  previewKind,
  dynamicBoxes,
  dynamicMasks,
  dynamicKeypoints,
  dynamicNerData,
  dynamicTextClsData,
  dynamicAudioSegments,
  dynamicVideoActions,
  dynamicImageTags,
} = useAnnotationPreviewData(
  toRef(props, 'task'),
  toRef(props, 'modality'),
  customTextContent,
  toRef(props, 'fallbackTitle')
)

const previewImageUrl = computed(() => {
  if (customFileUrl.value && itemModality.value === 'IMAGE') return customFileUrl.value
  if (props.task?.preview_image_url) return props.task.preview_image_url
  if (parsedPreviewData.value?.image_url) return parsedPreviewData.value.image_url
  return ''
})

// Check if a real asset exists (uploaded or defined in blueprint)
const hasAssetForModality = computed(() => {
  const mod = itemModality.value
  if (mod === 'IMAGE') {
    return Boolean(customFileUrl.value || props.task?.preview_image_url || parsedPreviewData.value?.image_url)
  }
  if (mod === 'AUDIO') {
    return Boolean(customFileUrl.value || parsedPreviewData.value?.audio_url || props.task?.preview_image_url)
  }
  if (mod === 'VIDEO') {
    return Boolean(customFileUrl.value || parsedPreviewData.value?.video_url || props.task?.preview_image_url)
  }
  if (mod === 'TEXT') {
    return Boolean(customTextContent.value || parsedPreviewData.value?.sample_text)
  }
  return false
})

const displayInstructions = computed(() => {
  return props.task?.instructions || props.task?.description || 'Interactive ground-truth annotation canvas preview.'
})
</script>

<template>
  <div class="relative flex h-full w-full flex-col overflow-hidden rounded-3xl border border-border/50 bg-card/80 shadow-2xl backdrop-blur-xl">
    <!-- Header Bar -->
    <div class="flex items-center justify-between border-b border-border/40 bg-muted/40 px-4 py-2.5 backdrop-blur-md">
      <div class="flex min-w-0 items-center gap-2">
        <div class="flex size-6 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
          <Eye class="size-3" />
        </div>
        <div class="flex items-center gap-2 min-w-0">
          <span class="truncate text-xs font-semibold tracking-tight text-foreground">
            {{ itemTitle }}
          </span>
          <span
            v-if="task?.tool_type"
            class="inline-flex items-center rounded px-1.5 py-0.2 font-mono text-[9px] font-semibold bg-muted text-muted-foreground border border-border/40"
          >
            {{ task.tool_type }}
          </span>
        </div>
      </div>

      <!-- Status Indicator & Reset Control -->
      <div class="flex items-center gap-2 shrink-0">
        <!-- Hidden file input for header action -->
        <input
          ref="headerFileInputRef"
          type="file"
          class="hidden"
          accept="image/*,video/*,audio/*,.txt"
          @change="onHeaderFileChange"
        />

        <div v-if="customFileName" class="flex items-center gap-1.5 rounded-md border border-border bg-background/80 px-2 py-0.5 text-[10px] font-medium text-foreground">
          <UploadCloud class="size-3 text-primary" />
          <span class="max-w-[80px] truncate">{{ customFileName }}</span>
          <button type="button" class="ml-0.5 hover:text-primary cursor-pointer" title="Reset to default blueprint" @click="resetCustomAsset">
            <RotateCcw class="size-2.5" />
          </button>
        </div>

        <button
          v-else
          type="button"
          class="flex items-center gap-1 rounded-md border border-border/80 bg-background/80 hover:bg-accent px-2 py-0.5 text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          title="Upload image/video/audio to test in live preview"
          @click="triggerHeaderUpload"
        >
          <UploadCloud class="size-3 text-primary" />
          <span>Upload Test File</span>
        </button>

        <span class="flex items-center gap-1.5 rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
          <span class="size-1.5 rounded-full bg-emerald-500"></span>
          Live Preview
        </span>
      </div>
    </div>

    <!-- Modality Viewport -->
    <div class="relative flex-1 min-h-[320px] w-full overflow-hidden bg-zinc-950/90 select-none">
      <!-- 1. EMPTY DROPZONE STATE WHEN NO ASSET ATTACHED -->
      <SampleAssetDropzone
        v-if="!hasAssetForModality"
        :modality="itemModality"
        :item-title="itemTitle"
        @file-selected="onCustomFileSelected"
        @text-submitted="onCustomTextSubmitted"
      />

      <!-- 2. INTERACTIVE PREVIEWS WHEN ASSET EXISTS -->
      <AudioTypePreview
        v-else-if="previewKind === 'AUDIO_WAVEFORM'"
        :segments="dynamicAudioSegments"
        :audio-url="customFileUrl || parsedPreviewData?.audio_url"
        :active-hover-id="activeHoverId"
        @hover="activeHoverId = $event"
      />
      <TextTypePreview
        v-else-if="previewKind === 'NER' || previewKind === 'TEXT_CLS'"
        :preview-kind="previewKind"
        :ner-data="dynamicNerData"
        :text-cls-data="dynamicTextClsData"
        :custom-text="customTextContent || undefined"
      />
      <VideoTypePreview
        v-else-if="previewKind === 'VIDEO_TIMELINE'"
        :preview-image-url="previewImageUrl"
        :video-url="customFileUrl || parsedPreviewData?.video_url"
        :actions="dynamicVideoActions"
      />
      <ImageTypePreview
        v-else
        :preview-kind="previewKind"
        :preview-image-url="previewImageUrl"
        :item-title="itemTitle"
        :boxes="dynamicBoxes"
        :masks="dynamicMasks"
        :keypoints="dynamicKeypoints"
        :tags="dynamicImageTags"
        :active-hover-id="activeHoverId"
        @hover="activeHoverId = $event"
      />
    </div>

    <!-- Bottom Footer Specs Bar -->
    <div class="border-t border-border/40 bg-muted/20 px-5 py-2.5 text-xs text-muted-foreground">
      <div class="flex items-center justify-between">
        <span class="truncate max-w-[75%] text-[11px]">{{ displayInstructions }}</span>
        <span class="rounded bg-background/80 px-2 py-0.5 font-mono text-[10px] font-medium border border-border/40">
          {{ itemModality }}
        </span>
      </div>
    </div>
  </div>
</template>
