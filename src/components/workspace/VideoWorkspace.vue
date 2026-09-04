<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import type { DataItem, LabelOption, VideoInterval } from '@/types'
import { createDataItemMediaUrl } from '@/api/media'
import { useAnnotationSession } from '@/composables/useAnnotationSession'
import { toast } from '@/utils/toast'
import WorkspaceShell from '@/components/workspace/WorkspaceShell.vue'
import Card from '@/components/ui/Card.vue'
import CardContent from '@/components/ui/CardContent.vue'
import VideoPlayerCanvas from './video/VideoPlayerCanvas.vue'
import VideoTimelineScrubber from './video/VideoTimelineScrubber.vue'
import VideoSegmentList from './video/VideoSegmentList.vue'

const props = defineProps<{
  item: DataItem
  labels?: LabelOption[]
  annotationType?: string
}>()

const emit = defineEmits<{
  submitted: []
}>()

const playerRef = ref<InstanceType<typeof VideoPlayerCanvas> | null>(null)
const mediaUrl = ref('')
const mediaError = ref('')
const now = ref(0)
const duration = ref(0)
const frameRate = computed(() => Math.max(1, Number(props.item.metadata?.fps || props.item.metadata?.frame_rate || 30)))
const frameDuration = computed(() => 1 / frameRate.value)
const selected = ref('')

const fallbackLabels = [{ name: 'Default label', color: '#38bdf8' }]
const labels = computed(() => (props.labels?.length ? props.labels : fallbackLabels))
const currentLabel = ref(labels.value[0]?.name || 'Default label')
const activeLabelColor = computed(() => labels.value.find((label) => label.name === currentLabel.value)?.color || '#f59e0b')

const activeTrack = ref(0)
const draftRange = ref<{ start: number; end: number } | null>(null)

// Initialize Session
const session = useAnnotationSession<VideoInterval[]>({
  item: props.item,
  annotationType: props.annotationType || 'Video temporal intervals',
  initialPayload: [],
  validatePayload: (intervals) => {
    if (!intervals || intervals.length === 0) {
      return 'Add at least one video interval before submitting'
    }
    return null
  },
  onSubmitted: () => {
    emit('submitted')
  },
  onSelectLabelIndex: (index) => {
    if (labels.value[index]) currentLabel.value = labels.value[index].name
  },
  onDeleteSelected: () => {
    if (selected.value) {
      removeInterval(selected.value)
    }
  },
  customHotkeys: {
    Space: (e) => {
      e.preventDefault()
      playerRef.value?.toggleVideo()
    },
    KeyN: (e) => {
      e.preventDefault()
      addInterval()
    },
    KeyS: (e) => {
      e.preventDefault()
      splitSelected()
    },
    ArrowLeft: (e) => {
      e.preventDefault()
      playerRef.value?.stepFrame(e.shiftKey ? -frameRate.value : -1)
    },
    ArrowRight: (e) => {
      e.preventDefault()
      playerRef.value?.stepFrame(e.shiftKey ? frameRate.value : 1)
    },
    Comma: (e) => {
      e.preventDefault()
      playerRef.value?.stepFrame(-1)
    },
    Period: (e) => {
      e.preventDefault()
      playerRef.value?.stepFrame(1)
    },
  },
})

const intervals = computed(() => (session.payload.value || []).map((interval) => ({ ...interval, track: interval.track ?? 0 })))
const trackCount = computed(() => Math.max(1, activeTrack.value + 1, ...intervals.value.map((interval) => (interval.track ?? 0) + 1)))
const tracks = computed(() => Array.from({ length: trackCount.value }, (_, index) => index))

function snapToFrame(value: number) {
  return Math.round(value / frameDuration.value) * frameDuration.value
}

function addInterval() {
  const start = draftRange.value?.start ?? snapToFrame(now.value)
  const end = draftRange.value?.end ?? snapToFrame(Math.min(duration.value || start + 3, start + 3))
  if (end <= start) {
    toast.warning('Cannot add interval', 'Select a range or place the playhead on a valid frame')
    return
  }
  const interval: VideoInterval = {
    id: `interval-${Date.now()}`,
    start,
    end,
    label: currentLabel.value,
    track: activeTrack.value,
  }
  const updated = [...(session.payload.value || []), interval]
  session.payload.value = updated
  selected.value = interval.id
  draftRange.value = null
  session.pushState(updated)
}

function splitSelected() {
  const currentIntervals = session.payload.value || []
  const interval = currentIntervals.find((item) => item.id === selected.value)
  if (!interval || now.value <= interval.start + 0.05 || now.value >= interval.end - 0.05) {
    toast.warning('Cannot split interval', 'Place the playhead inside a selected interval first')
    return
  }
  const cutTime = snapToFrame(now.value)
  const first = { ...interval, end: cutTime }
  const second = { ...interval, id: `interval-${Date.now()}`, start: cutTime }
  const updated = currentIntervals.flatMap((item) => (item.id === interval.id ? [first, second] : [item]))
  session.payload.value = updated
  selected.value = second.id
  session.pushState(updated)
}

function addTrack() {
  activeTrack.value = trackCount.value
  toast.info('Track added', `Track ${activeTrack.value + 1} is ready for another simultaneous label`)
}

function removeInterval(id: string) {
  const updated = (session.payload.value || []).filter((interval) => interval.id !== id)
  session.payload.value = updated
  if (selected.value === id) selected.value = ''
  session.pushState(updated)
}

async function loadMedia() {
  try {
    mediaUrl.value = await createDataItemMediaUrl(props.item.id)
  } catch (err: any) {
    mediaError.value = err?.message || 'Video file is not available'
  }
}

const hotkeyHints = [
  { key: 'Space', label: 'play/pause' },
  { key: 'N', label: 'add interval' },
  { key: 'S', label: 'cut at frame' },
  { key: '← →', label: 'step frame' },
]

onMounted(() => {
  loadMedia()
})

onUnmounted(() => {
  if (mediaUrl.value) URL.revokeObjectURL(mediaUrl.value)
})
</script>

<template>
  <WorkspaceShell
    :item="item"
    :session="session"
    :labels="labels"
    v-model:current-label="currentLabel"
    modality-title="Video Temporal Intervals"
    modality-type="Video"
    class-label-title="Action label:"
    :hotkey-hints="hotkeyHints"
  >
    <Card class="overflow-hidden bg-card/90 shadow-sm">
      <CardContent class="p-5">
        <VideoPlayerCanvas
          ref="playerRef"
          :media-url="mediaUrl"
          :media-error="mediaError"
          v-model:duration="duration"
          v-model:current-time="now"
          :frame-rate="frameRate"
        />

        <VideoTimelineScrubber
          :duration="duration"
          :current-time="now"
          :frame-rate="frameRate"
          :frame-duration="frameDuration"
          :tracks="tracks"
          :active-track="activeTrack"
          :selected-id="selected"
          :intervals="intervals"
          v-model:draft-range="draftRange"
          :current-label="currentLabel"
          :active-label-color="activeLabelColor"
          @select-track="activeTrack = $event"
          @select-interval="selected = $event"
          @seek="playerRef?.seek($event)"
        />

        <VideoSegmentList
          :intervals="intervals"
          :selected-id="selected"
          :current-time="now"
          :frame-rate="frameRate"
          @add-interval="addInterval"
          @split-selected="splitSelected"
          @add-track="addTrack"
          @select-interval="selected = $event"
          @remove-interval="removeInterval"
          @seek="playerRef?.seek($event)"
        />
      </CardContent>
    </Card>
  </WorkspaceShell>
</template>
