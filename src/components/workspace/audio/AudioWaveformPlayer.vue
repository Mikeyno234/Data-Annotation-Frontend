<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import type { AudioSegment } from '@/types'

const props = defineProps<{
  mediaUrl: string
  mediaError: boolean
  mediaErrorMessage: string
  duration: number
  currentTime: number
  isPlaying: boolean
  segments: AudioSegment[]
  selectedSegmentId: string | null
  availableSpeakers: { name: string; color?: string }[]
}>()

const emit = defineEmits<{
  (e: 'update:currentTime', time: number): void
  (e: 'update:duration', duration: number): void
  (e: 'update:isPlaying', isPlaying: boolean): void
  (e: 'update:selectedSegmentId', id: string | null): void
  (e: 'mediaError', err: boolean): void
  (e: 'segmentModified'): void
}>()

const audioCanvas = ref<HTMLCanvasElement | null>(null)
const audioEl = ref<HTMLAudioElement | null>(null)

let animationFrameId: number | null = null
let draggingSegment: AudioSegment | null = null
let dragStartX = 0
let dragOriginalStart = 0
let dragOriginalEnd = 0

function onAudioPlay() {
  emit('update:isPlaying', true)
  syncLoop()
}

function onAudioPause() {
  emit('update:isPlaying', false)
  if (animationFrameId) cancelAnimationFrame(animationFrameId)
}

function onAudioLoaded() {
  const el = audioEl.value
  if (el && el.duration && Number.isFinite(el.duration)) {
    emit('update:duration', el.duration)
    drawWaveform()
  }
}

function onAudioError() {
  emit('mediaError', true)
}

function syncLoop() {
  const el = audioEl.value
  if (!el) return
  emit('update:currentTime', el.currentTime)
  drawWaveform()
  if (!el.paused && !el.ended) {
    animationFrameId = requestAnimationFrame(syncLoop)
  }
}

function seek(time: number) {
  const el = audioEl.value
  const max = props.duration || 0
  const t = Math.max(0, Math.min(time, max))
  if (el) el.currentTime = t
  emit('update:currentTime', t)
  drawWaveform()
}

function togglePlay() {
  const el = audioEl.value
  if (!el) return
  if (el.paused) {
    el.play()
  } else {
    el.pause()
  }
}

function drawWaveform() {
  const canvas = audioCanvas.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const width = canvas.width
  const height = canvas.height
  ctx.clearRect(0, 0, width, height)

  ctx.fillStyle = '#090d16'
  ctx.fillRect(0, 0, width, height)

  const segs = props.segments || []

  // Draw Regions
  segs.forEach((seg) => {
    const xStart = (seg.start / (props.duration || 1)) * width
    const xEnd = (seg.end / (props.duration || 1)) * width
    const segWidth = Math.max(xEnd - xStart, 2)

    const isSelected = seg.id === props.selectedSegmentId
    const speakerObj = props.availableSpeakers.find((s) => s.name === seg.speaker)
    const color = speakerObj?.color || '#a855f7'

    ctx.fillStyle = isSelected ? `${color}44` : `${color}22`
    ctx.fillRect(xStart, 0, segWidth, height)

    ctx.strokeStyle = isSelected ? '#ffffff' : color
    ctx.lineWidth = isSelected ? 2 : 1
    ctx.strokeRect(xStart, 0, segWidth, height)

    ctx.fillStyle = color
    ctx.font = '10px Inter, sans-serif'
    ctx.fillText(`${seg.speaker} (${seg.start.toFixed(1)}s - ${seg.end.toFixed(1)}s)`, xStart + 4, 14)
  })

  // Deterministic waveform bars
  const numBars = Math.floor(width / 3)
  const barWidth = 2
  const gap = 1

  for (let i = 0; i < numBars; i++) {
    const x = i * (barWidth + gap)
    const normalizedTime = (x / width) * (props.duration || 1)
    const isPast = normalizedTime <= props.currentTime

    const inSegment = segs.some((s) => normalizedTime >= s.start && normalizedTime <= s.end)
    const base = Math.abs(Math.sin(i * 0.7) * 0.35 + Math.sin(i * 0.13) * 0.25)
    const val = inSegment ? Math.min(base + 0.45, 1) : base * 0.5
    const barHeight = Math.max(val * (height - 30), 3)

    ctx.fillStyle = isPast ? '#a855f7' : '#334155'
    ctx.fillRect(x, (height - barHeight) / 2 + 8, barWidth, barHeight)
  }

  // Playhead line
  const playheadX = (props.currentTime / (props.duration || 1)) * width
  ctx.strokeStyle = '#a855f7'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(playheadX, 0)
  ctx.lineTo(playheadX, height)
  ctx.stroke()

  ctx.fillStyle = '#a855f7'
  ctx.beginPath()
  ctx.arc(playheadX, 6, 5, 0, Math.PI * 2)
  ctx.fill()
}

function handleCanvasClick(e: MouseEvent) {
  const canvas = audioCanvas.value
  if (!canvas || !props.duration) return
  const rect = canvas.getBoundingClientRect()
  const clickX = e.clientX - rect.left
  const ratio = clickX / rect.width
  const clickTime = ratio * props.duration

  seek(clickTime)

  const segs = props.segments || []
  const clickedSeg = segs.find((s) => clickTime >= s.start && clickTime <= s.end)
  if (clickedSeg) {
    emit('update:selectedSegmentId', clickedSeg.id)
  }
}

function handleCanvasMouseDown(e: MouseEvent) {
  const canvas = audioCanvas.value
  if (!canvas || !props.duration) return
  const rect = canvas.getBoundingClientRect()
  const timeAtPointer = ((e.clientX - rect.left) / rect.width) * props.duration
  const segs = props.segments || []
  const segment = segs.find((item) => timeAtPointer >= item.start && timeAtPointer <= item.end)
  if (!segment) return
  draggingSegment = segment
  dragStartX = e.clientX
  dragOriginalStart = segment.start
  dragOriginalEnd = segment.end
  emit('update:selectedSegmentId', segment.id)
}

function handleCanvasMouseMove(e: MouseEvent) {
  if (!draggingSegment || !props.duration) return
  const canvas = audioCanvas.value
  if (!canvas) return
  const delta = ((e.clientX - dragStartX) / canvas.getBoundingClientRect().width) * props.duration
  const length = dragOriginalEnd - dragOriginalStart
  draggingSegment.start = Math.max(0, Math.min(props.duration - length, dragOriginalStart + delta))
  draggingSegment.end = draggingSegment.start + length
  drawWaveform()
}

function handleCanvasMouseUp() {
  if (!draggingSegment) return
  draggingSegment = null
  emit('segmentModified')
}

defineExpose({
  seek,
  togglePlay,
  drawWaveform,
  setPlaybackRate: (rate: number) => {
    if (audioEl.value) audioEl.value.playbackRate = rate
  },
})

watch(() => props.segments, () => drawWaveform(), { deep: true })
watch(() => props.selectedSegmentId, () => drawWaveform())

onMounted(() => {
  const canvas = audioCanvas.value
  if (canvas) {
    canvas.width = canvas.offsetWidth
    canvas.height = 140
    drawWaveform()
  }
})

onUnmounted(() => {
  if (animationFrameId) cancelAnimationFrame(animationFrameId)
})
</script>

<template>
  <div class="relative">
    <div v-if="mediaError" class="mb-4 rounded-xl bg-destructive/10 p-4 text-sm text-destructive-foreground">
      <div class="font-bold">Media Load Error</div>
      <p class="text-xs text-muted-foreground mt-1">{{ mediaErrorMessage }}</p>
    </div>

    <audio
      ref="audioEl"
      :src="mediaUrl"
      preload="metadata"
      class="hidden"
      @play="onAudioPlay"
      @pause="onAudioPause"
      @loadedmetadata="onAudioLoaded"
      @error="onAudioError"
      @ended="emit('update:isPlaying', false)"
    ></audio>

    <canvas
      ref="audioCanvas"
      class="h-[140px] w-full rounded-2xl cursor-pointer block shadow-inner bg-[#090d16]"
      @click="handleCanvasClick"
      @mousedown="handleCanvasMouseDown"
      @mousemove="handleCanvasMouseMove"
      @mouseup="handleCanvasMouseUp"
    ></canvas>
  </div>
</template>
