<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { createDataItemMediaUrl } from '@/api/media'
import Badge from '@/components/ui/Badge.vue'
import Button from '@/components/ui/Button.vue'
import { Eye, Code, Layers, SlidersHorizontal, ExternalLink } from 'lucide-vue-next'
import VisualizerImage from './visualizer/VisualizerImage.vue'
import VisualizerAudio from './visualizer/VisualizerAudio.vue'
import VisualizerText from './visualizer/VisualizerText.vue'

const props = defineProps<{
  payload: any
  dataItemId?: number
  fileName?: string
  modality?: string
  annotationType?: string
}>()

const router = useRouter()
const activeTab = ref<'visual' | 'json'>('visual')
const mediaUrl = ref<string | null>(null)
const mediaLoading = ref(false)
const mediaLoadError = ref(false)

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

async function loadMedia() {
  if (!props.dataItemId) return
  mediaLoading.value = true
  mediaLoadError.value = false
  try {
    mediaUrl.value = await createDataItemMediaUrl(props.dataItemId)
  } catch {
    mediaLoadError.value = true
  } finally {
    mediaLoading.value = false
  }
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

watch(() => props.dataItemId, () => loadMedia())
onMounted(() => loadMedia())
</script>

<template>
  <div class="rounded-2xl border border-border/70 bg-card overflow-hidden transition-all shadow-xs">
    <audio
      ref="audioRef"
      :src="mediaUrl || undefined"
      @timeupdate="onAudioTimeUpdate"
      @loadedmetadata="audioDuration = audioRef?.duration || 0"
      @ended="isAudioPlaying = false; activeSegmentId = null"
    ></audio>

    <!-- Header & Mode Switcher -->
    <div class="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-muted/30 border-b border-border/50">
      <div class="flex items-center gap-2">
        <div class="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Layers class="size-4" />
        </div>
        <span class="text-xs font-bold text-foreground tracking-tight">Completed Annotation</span>
        <Badge v-if="parsedData.type === 'image_boxes'" variant="secondary" class="text-[10px] py-0 px-2 font-mono">
          {{ parsedData.regions?.length || 0 }} Bounding Box{{ (parsedData.regions?.length || 0) > 1 ? 'es' : '' }}
        </Badge>
        <Badge v-else-if="parsedData.type === 'audio_segments'" variant="secondary" class="text-[10px] py-0 px-2 font-mono">
          {{ parsedData.segments?.length || 0 }} Audio Segments
        </Badge>
      </div>

      <div class="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          class="h-7 text-[11px] gap-1.5 px-2.5 rounded-lg border-border/80 hover:bg-muted/70 cursor-pointer text-foreground font-semibold shadow-2xs"
          @click="openInWorkspace"
        >
          <SlidersHorizontal class="size-3 text-primary" />
          <span>Open in Workspace</span>
          <ExternalLink class="size-2.5 opacity-60 ml-0.5" />
        </Button>

        <div class="flex items-center gap-1 bg-muted/60 p-0.5 rounded-xl">
          <button
            type="button"
            class="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer"
            :class="activeTab === 'visual' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'"
            @click="activeTab = 'visual'"
          >
            <Eye class="size-3.5" />
            <span>Visual</span>
          </button>
          <button
            type="button"
            class="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer"
            :class="activeTab === 'json' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'"
            @click="activeTab = 'json'"
          >
            <Code class="size-3.5" />
            <span>Raw JSON</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Main Content Tab View -->
    <div v-if="activeTab === 'visual'" class="p-4 sm:p-5">
      <VisualizerImage
        v-if="parsedData.type === 'image_boxes'"
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
