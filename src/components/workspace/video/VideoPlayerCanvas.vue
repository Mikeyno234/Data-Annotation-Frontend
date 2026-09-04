<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import Button from '@/components/ui/Button.vue'
import { Play, Pause, SkipBack, SkipForward } from 'lucide-vue-next'

const props = defineProps<{
  mediaUrl: string
  mediaError: string
  duration: number
  currentTime: number
  frameRate: number
}>()

const emit = defineEmits<{
  (e: 'update:currentTime', time: number): void
  (e: 'update:duration', duration: number): void
  (e: 'seek', time: number): void
}>()

const video = ref<HTMLVideoElement | null>(null)
let videoFrameCallbackId: number | null = null

const frameDuration = computed(() => 1 / props.frameRate)
const currentFrame = computed(() => Math.max(0, Math.round(props.currentTime * props.frameRate)))

function syncVideoFrame(_now: number, metadata: VideoFrameCallbackMetadata) {
  emit('update:currentTime', metadata.mediaTime)
  videoFrameCallbackId = video.value?.requestVideoFrameCallback(syncVideoFrame) ?? null
}

function handleVideoPlay() {
  if (!video.value || videoFrameCallbackId !== null) return
  videoFrameCallbackId = video.value.requestVideoFrameCallback(syncVideoFrame)
}

function handleVideoPause() {
  if (video.value && videoFrameCallbackId !== null) {
    video.value.cancelVideoFrameCallback(videoFrameCallbackId)
    videoFrameCallbackId = null
  }
  if (video.value) emit('update:currentTime', video.value.currentTime)
}

function toggleVideo() {
  if (!video.value) return
  if (video.value.paused) video.value.play()
  else video.value.pause()
}

function stepFrame(direction: number) {
  const target = props.currentTime + direction * frameDuration.value
  seek(target)
  if (video.value && !video.value.paused) video.value.pause()
}

function seek(time: number) {
  const max = props.duration || 0
  const t = Math.max(0, Math.min(time, max))
  if (video.value) video.value.currentTime = t
  emit('update:currentTime', t)
  emit('seek', t)
}

defineExpose({
  toggleVideo,
  stepFrame,
  seek,
})

onUnmounted(() => {
  handleVideoPause()
})
</script>

<template>
  <div>
    <div v-if="mediaError" class="mb-4 rounded-2xl bg-destructive/10 p-4 text-sm text-destructive-foreground">
      {{ mediaError }}
    </div>
    <div class="overflow-hidden rounded-2xl bg-black">
      <video
        ref="video"
        :src="mediaUrl"
        class="max-h-[60vh] w-full object-contain"
        controls
        @play="handleVideoPlay"
        @pause="handleVideoPause"
        @ended="handleVideoPause"
        @loadedmetadata="emit('update:duration', video?.duration || 0); emit('update:currentTime', video?.currentTime || 0)"
      />
    </div>

    <!-- Transport Controls -->
    <div class="mt-4 flex flex-wrap items-center justify-between gap-3">
      <div>
        <p class="text-xs font-bold text-foreground">Mark a moment on the timeline</p>
        <p class="mt-0.5 text-[11px] text-muted-foreground">
          Drag on track to select a range, then press <kbd class="px-2 py-0.5 rounded-lg bg-card text-foreground font-mono shadow-xs">N</kbd> to label it.
        </p>
      </div>
      <div class="flex items-center gap-2">
        <Button variant="outline" size="icon" class="size-9 rounded-xl" title="Previous frame (,)" @click="stepFrame(-1)">
          <SkipBack class="size-4" />
        </Button>
        <span class="min-w-24 text-center font-mono text-[11px] font-semibold text-muted-foreground">
          Frame {{ currentFrame }} · {{ frameRate }} fps
        </span>
        <Button variant="outline" size="icon" class="size-9 rounded-xl" title="Next frame (.)" @click="stepFrame(1)">
          <SkipForward class="size-4" />
        </Button>
        <Button variant="outline" size="sm" class="ml-1 h-9 gap-1.5 rounded-xl font-semibold" @click="toggleVideo">
          <Pause v-if="!video?.paused" class="size-4" />
          <Play v-else class="size-4" />
          {{ video?.paused === false ? 'Pause' : 'Play' }}
        </Button>
      </div>
    </div>
  </div>
</template>
