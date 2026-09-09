<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useMediaBlobUrl } from '@/composables/useMediaBlobUrl'
import Badge from '@/components/ui/Badge.vue'
import Button from '@/components/ui/Button.vue'
import { Eye, Code, Layers, SlidersHorizontal, ExternalLink } from 'lucide-vue-next'
import VisualizerImage from './visualizer/VisualizerImage.vue'
import VisualizerAudio from './visualizer/VisualizerAudio.vue'
import VisualizerText from './visualizer/VisualizerText.vue'
import VisualizerVideo from './visualizer/VisualizerVideo.vue'

const props = defineProps<{
  payload: any
  dataItemId?: number
  fileName?: string
  modality?: string
  annotationType?: string
}>()

const router = useRouter()
const activeTab = ref<'visual' | 'json'>('visual')

const {
  mediaUrl,
  isLoading: mediaLoading,
  error: mediaError,
} = useMediaBlobUrl(() => props.dataItemId)

const mediaLoadError = computed(() => !!mediaError.value)

// Audio playback state
const audioRef = ref<HTMLAudioElement | null>(null)
const isAudioPlaying = ref(false)
const audioCurrentTime = ref(0)
const audioDuration = ref(0)
const activeSegmentId = ref<string | null>(null)
let activeSegmentEnd = 0

// Parse structured regions
const parsedData = computed(() => {
  const p = props.payload
  if (!p) return { type: 'empty', regions: [], text: '', labels: [] }

  if (p && typeof p === 'object' && Array.isArray(p.regions)) {
    return {
      type: 'image_boxes',
      regions: p.regions.map((r: any, idx: number) => ({
        id: r.id || `reg-${idx}`,
        label: r.label || r.tag || 'Object',
        x: Number(r.x ?? 0),
        y: Number(r.y ?? 0),
        width: Number(r.width ?? r.w ?? 20),
        height: Number(r.height ?? r.h ?? 20),
        color: r.color || getColorForLabel(r.label || `${idx}`),
      })),
      labels: Array.from(new Set(p.regions.map((r: any) => r.label || 'Object'))) as string[],
    }
  }

  if (Array.isArray(p) && p.length > 0 && (p[0].x !== undefined || p[0].startX !== undefined)) {
    return {
      type: 'image_boxes',
      regions: p.map((r: any, idx: number) => ({
        id: r.id || `reg-${idx}`,
        label: r.label || r.tag || 'Object',
        x: Number(r.x ?? r.startX ?? 0),
        y: Number(r.y ?? r.startY ?? 0),
        width: Number(r.width ?? r.w ?? 20),
        height: Number(r.height ?? r.h ?? 20),
        color: r.color || getColorForLabel(r.label || `${idx}`),
      })),
      labels: Array.from(new Set(p.map((r: any) => r.label || 'Object'))) as string[],
    }
  }

  const segments = p.segments || (Array.isArray(p) && p[0]?.start !== undefined ? p : null)
  if (segments && Array.isArray(segments)) {
    return {
      type: 'audio_segments',
      segments: segments.map((s: any, idx: number) => ({
        id: s.id || `seg-${idx}`,
        speaker: s.speaker || s.label || `Speaker ${idx + 1}`,
        start: Number(s.start || s.start_time || 0),
        end: Number(s.end || s.end_time || 1),
        text: s.text || s.transcription || '',
        color: s.color || getColorForLabel(s.speaker || `${idx}`),
      })),
      labels: Array.from(new Set(segments.map((s: any) => s.speaker || 'Speaker'))) as string[],
    }
  }

  if (p.label || p.category || p.classification || p.choice) {
    return {
      type: 'classification',
      label: p.label || p.category || p.classification || p.choice,
      confidence: p.confidence || p.score,
      notes: p.notes || p.comment,
    }
  }

  return { type: 'generic', data: p }
})

function getColorForLabel(label: string): string {
  const colors = ['#fa694c', '#0ea5e9', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4', '#84cc16']
  let hash = 0
  for (let i = 0; i < label.length; i++) hash = label.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

function toggleMasterAudioPlay() {
  if (!audioRef.value) return
  if (isAudioPlaying.value) {
    audioRef.value.pause()
    isAudioPlaying.value = false
    activeSegmentId.value = null
  } else {
    activeSegmentEnd = 0
    audioRef.value.play()
    isAudioPlaying.value = true
  }
}

function playSegment(seg: any) {
  if (!audioRef.value) return
  audioRef.value.currentTime = seg.start
  activeSegmentEnd = seg.end
  activeSegmentId.value = seg.id
  audioRef.value.play()
  isAudioPlaying.value = true
}

function onAudioTimeUpdate() {
  if (!audioRef.value) return
  audioCurrentTime.value = audioRef.value.currentTime
  if (activeSegmentEnd > 0 && audioRef.value.currentTime >= activeSegmentEnd) {
    audioRef.value.pause()
    isAudioPlaying.value = false
    activeSegmentId.value = null
    activeSegmentEnd = 0
  }
}

function onAudioSeek(e: Event) {
  const target = e.target as HTMLInputElement
  if (audioRef.value) {
    audioRef.value.currentTime = Number(target.value)
    audioCurrentTime.value = Number(target.value)
  }
}

function openInWorkspace() {
  if (props.dataItemId) {
    router.push(`/workspace?task_id=${props.dataItemId}`)
  } else {
    router.push('/workspace')
  }
}
</script>

<template>
  <div class="rounded-lg border border-border/60 bg-muted/10 overflow-hidden transition-all">
    <audio
      ref="audioRef"
      :src="mediaUrl || undefined"
      @timeupdate="onAudioTimeUpdate"
      @loadedmetadata="audioDuration = audioRef?.duration || 0"
      @ended="isAudioPlaying = false; activeSegmentId = null"
    ></audio>

    <!-- Header & Mode Switcher -->
    <div class="flex flex-wrap items-center justify-between gap-3 px-3.5 py-2 bg-muted/30 border-b border-border/40 text-xs">
      <div class="flex items-center gap-2">
        <span class="text-xs font-semibold text-foreground/90 tracking-tight">Annotation Output</span>
        <Badge v-if="parsedData.type === 'image_boxes'" variant="secondary" class="text-[10px] py-0 px-2 font-mono">
          {{ parsedData.regions?.length || 0 }} Box{{ (parsedData.regions?.length || 0) > 1 ? 'es' : '' }}
        </Badge>
        <Badge v-else-if="parsedData.type === 'audio_segments'" variant="secondary" class="text-[10px] py-0 px-2 font-mono">
          {{ parsedData.segments?.length || 0 }} Segments
        </Badge>
      </div>

      <div class="flex items-center gap-1.5">
        <button
          type="button"
          class="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          title="Open interactive canvas workspace"
          @click="openInWorkspace"
        >
          <span>Workspace</span>
          <ExternalLink class="size-3 opacity-60" />
        </button>

        <div class="h-3 w-px bg-border/60"></div>

        <div class="flex items-center gap-0.5 bg-muted/60 p-0.5 rounded-md">
          <button
            type="button"
            class="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium cursor-pointer transition-all"
            :class="activeTab === 'visual' ? 'bg-card text-foreground shadow-2xs font-semibold' : 'text-muted-foreground hover:text-foreground'"
            @click="activeTab = 'visual'"
          >
            <Eye class="size-3" />
            <span>Visual</span>
          </button>
          <button
            type="button"
            class="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium cursor-pointer transition-all"
            :class="activeTab === 'json' ? 'bg-card text-foreground shadow-2xs font-semibold' : 'text-muted-foreground hover:text-foreground'"
            @click="activeTab = 'json'"
          >
            <Code class="size-3" />
            <span>JSON</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Main Content Tab View -->
    <div v-if="activeTab === 'visual'" class="p-3 sm:p-4">
      <VisualizerVideo
        v-if="parsedData.type === 'classification' && (modality === 'VIDEO' || (annotationType || '').toUpperCase().includes('VIDEO'))"
        :label="parsedData.label"
        :confidence="parsedData.confidence"
        :notes="parsedData.notes"
        :media-url="mediaUrl"
        :media-load-error="mediaLoadError"
      />
      <VisualizerImage
        v-else-if="parsedData.type === 'image_boxes'"
        :regions="parsedData.regions || []"
        :labels="parsedData.labels || []"
        :media-url="mediaUrl"
        :media-load-error="mediaLoadError"
      />
      <VisualizerAudio
        v-else-if="parsedData.type === 'audio_segments'"
        :segments="parsedData.segments || []"
        :labels="parsedData.labels || []"
        :is-audio-playing="isAudioPlaying"
        :audio-current-time="audioCurrentTime"
        :audio-duration="audioDuration"
        :active-segment-id="activeSegmentId"
        @toggle-play="toggleMasterAudioPlay"
        @play-segment="playSegment"
        @seek="onAudioSeek"
      />
      <VisualizerText v-else :parsed-data="parsedData" />
    </div>

    <!-- JSON Preview Tab -->
    <div v-else class="p-4 bg-muted/10">
      <pre class="font-mono text-xs text-foreground/90 p-3 bg-muted/40 rounded-xl overflow-x-auto max-h-[300px]">{{ JSON.stringify(payload, null, 2) }}</pre>
    </div>
  </div>
</template>
