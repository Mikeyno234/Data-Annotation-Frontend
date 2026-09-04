<script setup lang="ts">
import { ref, nextTick } from 'vue'
import type { VideoInterval } from '@/types'

const props = defineProps<{
  duration: number
  currentTime: number
  frameRate: number
  frameDuration: number
  tracks: number[]
  activeTrack: number
  selectedId: string
  intervals: (VideoInterval & { track: number })[]
  draftRange: { start: number; end: number } | null
  currentLabel: string
  activeLabelColor: string
}>()

const emit = defineEmits<{
  (e: 'selectTrack', track: number): void
  (e: 'selectInterval', id: string): void
  (e: 'seek', time: number): void
  (e: 'update:draftRange', range: { start: number; end: number } | null): void
}>()

const timelineViewport = ref<HTMLElement | null>(null)
const timelineZoom = ref(1)

let drawing = false
let drawStart = 0

function snapToFrame(value: number) {
  return Math.round(value / props.frameDuration) * props.frameDuration
}

function timecode(value: number) {
  const totalFrames = Math.max(0, Math.round(value * props.frameRate))
  const frames = totalFrames % props.frameRate
  const totalSeconds = Math.floor(totalFrames / props.frameRate)
  const seconds = totalSeconds % 60
  const minutes = Math.floor(totalSeconds / 60) % 60
  const hours = Math.floor(totalSeconds / 3600)
  const frameWidth = Math.max(2, String(Math.max(0, Math.ceil(props.frameRate) - 1)).length)
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}:${frames.toString().padStart(frameWidth, '0')}`
}

function timelineTime(event: PointerEvent) {
  if (!props.duration) return 0
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  return snapToFrame(Math.max(0, Math.min(props.duration, ((event.clientX - rect.left) / rect.width) * props.duration)))
}

function setTimelineZoom(value: number, clientX?: number) {
  const viewport = timelineViewport.value
  if (!viewport) return
  const nextZoom = Math.max(1, Math.min(8, Number(value.toFixed(2))))
  const anchor = clientX === undefined
    ? viewport.scrollLeft + viewport.clientWidth / 2
    : viewport.scrollLeft + clientX - viewport.getBoundingClientRect().left
  const ratio = viewport.scrollWidth ? anchor / viewport.scrollWidth : 0
  timelineZoom.value = nextZoom
  nextTick(() => {
    viewport.scrollLeft = Math.max(0, ratio * viewport.scrollWidth - (clientX === undefined ? viewport.clientWidth / 2 : clientX - viewport.getBoundingClientRect().left))
  })
}

function handleTimelineWheel(event: WheelEvent) {
  const viewport = timelineViewport.value
  if (!viewport) return
  if (event.shiftKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)) {
    viewport.scrollLeft += event.deltaX || event.deltaY
    return
  }
  setTimelineZoom(timelineZoom.value + (event.deltaY < 0 ? 0.5 : -0.5), event.clientX)
}

function startInterval(event: PointerEvent) {
  drawing = true
  drawStart = timelineTime(event)
  emit('update:draftRange', { start: drawStart, end: drawStart })
  emit('selectTrack', Number((event.currentTarget as HTMLElement).dataset.track || 0))
  ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
}

function moveInterval(event: PointerEvent) {
  if (!drawing) return
  const current = timelineTime(event)
  const start = Math.min(drawStart, current)
  const finish = Math.max(drawStart, current)
  emit('update:draftRange', { start, end: finish })
  emit('seek', current)
}

function finishInterval(event: PointerEvent) {
  if (!drawing) return
  drawing = false
  const end = timelineTime(event)
  const start = Math.min(drawStart, end)
  const finish = Math.max(drawStart, end)
  if (finish - start < props.frameDuration) {
    emit('update:draftRange', null)
    emit('seek', start)
    return
  }
  emit('update:draftRange', { start, end: finish })
  emit('seek', start)
}
</script>

<template>
  <div
    ref="timelineViewport"
    class="timeline-scroll mt-4 overflow-x-auto rounded-2xl shadow-inner bg-[#0d141c]"
    @wheel.prevent="handleTimelineWheel"
  >
    <div class="relative min-w-full" :style="{ width: `${timelineZoom * 100}%` }">
      <!-- Timecode Header -->
      <div class="pointer-events-none flex h-7 items-center bg-[#090d16] font-mono text-[9px] text-slate-400 px-2">
        <span class="w-16 shrink-0"></span>
        <span class="flex flex-1 justify-between px-2">
          <span>{{ timecode(0) }}</span>
          <span>{{ timecode(duration / 2) }}</span>
          <span>{{ timecode(duration) }}</span>
        </span>
      </div>

      <!-- Tracks -->
      <div v-for="track in tracks" :key="track" class="flex min-h-14 bg-[#111820]/90">
        <button
          type="button"
          class="w-16 shrink-0 bg-[#090d16] px-2 text-left font-mono text-[9px] text-slate-400 hover:text-primary transition-colors cursor-pointer"
          :class="activeTrack === track ? 'text-primary font-bold' : ''"
          @click="emit('selectTrack', track)"
        >
          TRACK {{ track + 1 }}
        </button>

        <div
          class="relative flex-1 cursor-crosshair select-none"
          :data-track="track"
          :style="{
            backgroundImage: 'linear-gradient(to right, rgba(148,163,184,.08) 1px, transparent 1px)',
            backgroundSize: `${10 / timelineZoom}% 100%`,
          }"
          @pointerdown="startInterval"
          @pointermove="moveInterval"
          @pointerup="finishInterval"
          @pointercancel="finishInterval"
        >
          <!-- Current Playhead line -->
          <div
            class="absolute bottom-0 top-0 z-10 w-0.5 bg-primary pointer-events-none shadow-sm shadow-primary"
            :style="{ left: `${duration ? (currentTime / duration) * 100 : 0}%` }"
          ></div>

          <!-- Active Draft Range -->
          <div
            v-if="draftRange && activeTrack === track"
            class="absolute inset-y-2 z-[5] flex items-center overflow-hidden rounded-xl px-2 text-[10px] shadow-sm backdrop-blur-[2px] pointer-events-none"
            :style="{
              left: `${duration ? (draftRange.start / duration) * 100 : 0}%`,
              width: `${duration ? Math.max(0.2, ((draftRange.end - draftRange.start) / duration) * 100) : 0}%`,
              backgroundColor: `${activeLabelColor}40`,
              color: activeLabelColor,
            }"
          >
            <span class="truncate font-bold tracking-wide">{{ currentLabel }} (Draft)</span>
          </div>

          <!-- Existing Interval Blocks -->
          <div
            v-for="interval in intervals.filter((item) => item.track === track)"
            :key="interval.id"
            class="absolute inset-y-2 z-[6] flex cursor-pointer items-center overflow-hidden rounded-xl px-2 text-[10px] transition-transform hover:brightness-110"
            :class="selectedId === interval.id ? 'ring-2 ring-white shadow-md' : 'opacity-90'"
            :style="{
              left: `${duration ? (interval.start / duration) * 100 : 0}%`,
              width: `${duration ? Math.max(0.2, ((interval.end - interval.start) / duration) * 100) : 0}%`,
              backgroundColor: `${activeLabelColor}80`,
              color: '#ffffff',
            }"
            @pointerdown.stop="emit('selectInterval', interval.id); emit('seek', interval.start)"
          >
            <span class="truncate font-semibold">{{ interval.label || 'Interval' }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
