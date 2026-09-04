<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import type { DataItem, AudioSegment, LabelOption } from '@/types'
import { createDataItemMediaUrl } from '@/api/media'
import { useAnnotationSession } from '@/composables/useAnnotationSession'
import { toast } from '@/utils/toast'
import WorkspaceShell from '@/components/workspace/WorkspaceShell.vue'
import Card from '@/components/ui/Card.vue'
import CardContent from '@/components/ui/CardContent.vue'
import AudioWaveformPlayer from './audio/AudioWaveformPlayer.vue'
import AudioControlsBar from './audio/AudioControlsBar.vue'
import AudioDiarizationSegments from './audio/AudioDiarizationSegments.vue'

const props = defineProps<{
  item: DataItem
  labels?: LabelOption[]
  annotationType?: string
}>()

const emit = defineEmits<{
  submitted: []
}>()

const playerRef = ref<InstanceType<typeof AudioWaveformPlayer> | null>(null)
const isPlaying = ref(false)
const currentTime = ref(0)
const duration = ref(0)
const selectedSegmentId = ref<string | null>(null)
const mediaError = ref(false)
const mediaErrorMessage = ref('Media file is not available')
const mediaUrl = ref('')

const defaultSpeakers = [
  { name: 'Default label', color: '#38bdf8', bg: 'bg-sky-500/20 text-sky-300 border-sky-500/40' },
]
const availableSpeakers = computed(() => (props.labels?.length ? props.labels : defaultSpeakers))
const currentSpeaker = ref(props.labels?.[0]?.name || 'Default label')

// Initialize deep session
const session = useAnnotationSession<AudioSegment[]>({
  item: props.item,
  annotationType: props.annotationType || 'Audio Diarization & Transcription',
  initialPayload: [],
  validatePayload: (segs) => {
    if (!segs || segs.length === 0) {
      return 'Annotation must contain at least 1 audio segment'
    }
    return null
  },
  onSubmitted: () => {
    emit('submitted')
  },
  onSelectLabelIndex: (index) => {
    const spk = availableSpeakers.value[index]
    if (spk) {
      currentSpeaker.value = spk.name
      setSpeaker(spk.name)
    }
  },
  onDeleteSelected: () => {
    if (selectedSegmentId.value) {
      deleteSegment(selectedSegmentId.value)
    }
  },
  customHotkeys: {
    Space: (e) => {
      e.preventDefault()
      togglePlay()
    },
    KeyK: () => splitSegment(),
    KeyN: () => addSegment(),
  },
})

async function loadMedia() {
  try {
    mediaUrl.value = await createDataItemMediaUrl(props.item.id)
  } catch (err: any) {
    mediaError.value = true
    mediaErrorMessage.value = err?.message || mediaErrorMessage.value
  }
}

function togglePlay() {
  playerRef.value?.togglePlay()
}

function skip(seconds: number) {
  playerRef.value?.seek(currentTime.value + seconds)
}

function addSegment() {
  const start = Math.max(0, currentTime.value)
  const end = Math.min(duration.value, start + 3)
  const newSeg: AudioSegment = {
    id: `seg-${Date.now()}`,
    start: Number(start.toFixed(2)),
    end: Number(end.toFixed(2)),
    speaker: currentSpeaker.value || availableSpeakers.value[0]?.name || 'Default label',
    label: currentSpeaker.value || availableSpeakers.value[0]?.name || 'Default label',
    transcript: '',
    confidence: 1.0,
  }
  const updated = [...(session.payload.value || []), newSeg]
  session.payload.value = updated
  selectedSegmentId.value = newSeg.id
  session.pushState(updated)
  playerRef.value?.drawWaveform()
  toast.info('Segment added', `Created region at ${start.toFixed(2)}s`)
}

function splitSegment() {
  const segs = session.payload.value || []
  const current = segs.find((s) => currentTime.value > s.start && currentTime.value < s.end)
  if (!current) {
    toast.warning('Split failed', 'Playhead must be inside an existing segment')
    return
  }

  const origEnd = current.end
  current.end = Number(currentTime.value.toFixed(2))

  const newSeg: AudioSegment = {
    id: `seg-${Date.now()}`,
    start: Number(currentTime.value.toFixed(2)),
    end: origEnd,
    speaker: current.speaker,
    label: current.label,
    transcript: '',
    confidence: 1.0,
  }

  const updated = [...segs, newSeg].sort((a, b) => a.start - b.start)
  session.payload.value = updated
  selectedSegmentId.value = newSeg.id
  session.pushState(updated)
  playerRef.value?.drawWaveform()
  toast.success('Segment split', `Split at ${currentTime.value.toFixed(2)}s`)
}

function setSpeaker(speakerName: string) {
  if (!selectedSegmentId.value) return
  const segs = session.payload.value || []
  const seg = segs.find((s) => s.id === selectedSegmentId.value)
  if (seg) {
    seg.speaker = speakerName
    seg.label = speakerName
    session.pushState(segs)
    playerRef.value?.drawWaveform()
  }
}

function selectSegment(seg: AudioSegment) {
  selectedSegmentId.value = seg.id
  playerRef.value?.seek(seg.start)
  playerRef.value?.drawWaveform()
}

function deleteSegment(id: string) {
  const segs = session.payload.value || []
  const seg = segs.find((s) => s.id === id)
  const updated = segs.filter((s) => s.id !== id)
  session.payload.value = updated
  if (selectedSegmentId.value === id) {
    selectedSegmentId.value = null
  }
  session.pushState(updated)
  playerRef.value?.drawWaveform()
  toast.info('Segment deleted', seg ? `Removed ${seg.speaker || 'segment'}` : undefined)
}

function playRegion(seg: AudioSegment) {
  playerRef.value?.seek(seg.start)
  togglePlay()
}

const hotkeyHints = [
  { key: 'Space', label: 'play/pause' },
  { key: 'N', label: 'new segment' },
  { key: 'K', label: 'split segment' },
  { key: 'Delete', label: 'remove segment' },
]

onMounted(() => {
  loadMedia()
})
</script>

<template>
  <WorkspaceShell
    :item="item"
    :session="session"
    :labels="labels"
    v-model:current-label="currentSpeaker"
    modality-title="Audio Diarization & Transcription"
    modality-type="Audio"
    class-label-title="Speaker label:"
    :hotkey-hints="hotkeyHints"
  >
    <!-- Waveform & Player Card -->
    <Card class="overflow-hidden bg-card/90 shadow-sm">
      <CardContent class="p-6">
        <AudioWaveformPlayer
          ref="playerRef"
          :media-url="mediaUrl"
          :media-error="mediaError"
          :media-error-message="mediaErrorMessage"
          v-model:duration="duration"
          v-model:current-time="currentTime"
          v-model:is-playing="isPlaying"
          v-model:selected-segment-id="selectedSegmentId"
          :segments="session.payload.value || []"
          :available-speakers="availableSpeakers"
          @media-error="mediaError = $event"
          @segment-modified="session.pushState()"
        />

        <AudioControlsBar
          :is-playing="isPlaying"
          :current-time="currentTime"
          :duration="duration"
          @toggle-play="togglePlay"
          @skip="skip"
          @add-segment="addSegment"
          @split-segment="splitSegment"
          @rate-change="playerRef?.setPlaybackRate($event)"
        />
      </CardContent>
    </Card>

    <!-- Diarization Speaker Segments List -->
    <AudioDiarizationSegments
      :segments="session.payload.value || []"
      :available-speakers="availableSpeakers"
      :selected-segment-id="selectedSegmentId"
      :has-prelabel="session.hasPrelabel.value"
      @select-segment="selectSegment"
      @delete-segment="deleteSegment"
      @play-region="playRegion"
      @state-changed="session.pushState(); playerRef?.drawWaveform()"
    />
  </WorkspaceShell>
</template>
