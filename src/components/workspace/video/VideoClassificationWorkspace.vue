<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import type { DataItem, LabelOption } from '@/types'
import { createDataItemMediaUrl } from '@/api/media'
import { useAnnotationSession } from '@/composables/useAnnotationSession'
import { normalizeVideoPayload } from '@/utils/annotation'
import { useLabelHotkeys } from '@/composables/workspace/useLabelHotkeys'
import { toast } from '@/utils/toast'
import WorkspaceShell from '@/components/workspace/WorkspaceShell.vue'
import Button from '@/components/ui/Button.vue'
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  ShieldAlert,
  LoaderCircle,
  Repeat,
} from 'lucide-vue-next'

export interface VideoClassificationPayload {
  label: string
  notes?: string
  tags?: string[]
}

const props = defineProps<{
  item: DataItem
  labels?: LabelOption[]
  annotationType?: string
  hasNext?: boolean
  hasPrev?: boolean
}>()

const emit = defineEmits<{
  submitted: []
  next: []
  prev: []
}>()

const videoRef = ref<HTMLVideoElement | null>(null)
const mediaUrl = ref('')
const mediaError = ref('')
const isPlaying = ref(false)
const isMuted = ref(false)
const currentTime = ref(0)
const duration = ref(0)
const isAutoLoop = ref(true)

// Rapid labeling: Auto-advance to next video clip upon label selection
const isAutoAdvance = ref<boolean>(
  typeof window !== 'undefined' && localStorage.getItem('video_auto_advance') !== 'false'
)

function toggleAutoAdvance() {
  isAutoAdvance.value = !isAutoAdvance.value
  if (typeof window !== 'undefined') {
    localStorage.setItem('video_auto_advance', String(isAutoAdvance.value))
  }
  if (isAutoAdvance.value) {
    toast.info('Auto-Advance Enabled', 'Selecting a label will immediately submit and advance to the next video.')
  } else {
    toast.info('Auto-Advance Disabled', 'Labels will be selected. Press Enter or click Submit to advance.')
  }
}

const isSubmittingAuto = ref(false)

const availableLabels = computed(() => props.labels || [])

// Clean Composable: Disambiguated keyboard shortcuts (Digits 1-9 and unique mnemonic letters)
const { labelHotkeys, getDisplayHotkey } = useLabelHotkeys(availableLabels)

let autoAdvanceTimer: ReturnType<typeof setTimeout> | null = null

function clearAutoAdvanceTimer() {
  if (autoAdvanceTimer) {
    clearTimeout(autoAdvanceTimer)
    autoAdvanceTimer = null
  }
}

// Session management
const session = useAnnotationSession<VideoClassificationPayload>({
  item: props.item,
  annotationType: props.annotationType || 'Video Clip Classification',
  initialPayload: {
    label: '',
    notes: '',
  },
  normalizer: (raw) => normalizeVideoPayload(raw, 'classification') as VideoClassificationPayload,
  validatePayload: (data) => {
    if (!data.label || !data.label.trim()) {
      return 'Please choose a category before submitting'
    }
    return null
  },
  onSubmitted: () => {
    emit('submitted')
  },
  onSelectLabelIndex: (index) => {
    if (availableLabels.value[index]) {
      handleSelectLabel(availableLabels.value[index].name)
    }
  },
  customHotkeys: {
    Space: (e) => {
      e.preventDefault()
      togglePlay()
    },
    KeyD: (e) => {
      e.preventDefault()
      emit('next')
    },
    KeyA: (e) => {
      e.preventDefault()
      emit('prev')
    },
    Enter: (e) => {
      e.preventDefault()
      if (session.isSaving.value || isSubmittingAuto.value) return
      if (currentSelectedLabel.value) {
        session.submit()
      } else {
        toast.warning('Pilih label dulu', 'Tekan tombol angka atau klik label sebelum submit.')
      }
    },
    ...Object.fromEntries(
      Object.entries(labelHotkeys.value).map(([code, { labelName }]) => [
        code,
        (e: KeyboardEvent) => {
          e.preventDefault()
          handleSelectLabel(labelName)
        },
      ])
    ),
  },
})

const currentSelectedLabel = computed(() => session.payload.value?.label || '')

const activeColor = computed(() => {
  const matched = availableLabels.value.find((l) => l.name === currentSelectedLabel.value)
  return matched?.color || '#3b82f6'
})

function handleSelectLabel(labelName: string) {
  if (session.isSaving.value || isSubmittingAuto.value) return

  const updated: VideoClassificationPayload = {
    ...session.payload.value,
    label: labelName,
  }
  session.payload.value = updated
  session.pushState(updated)

  // Rapid Auto-Advance: Automatically submit and advance to the next video
  if (isAutoAdvance.value) {
    clearAutoAdvanceTimer()
    isSubmittingAuto.value = true
    autoAdvanceTimer = setTimeout(async () => {
      try {
        await session.submit()
      } catch {
        // Handled inside session
      } finally {
        isSubmittingAuto.value = false
      }
    }, 100)
  }
}

function updateNotes(e: Event) {
  const target = e.target as HTMLInputElement | HTMLTextAreaElement
  const updated: VideoClassificationPayload = {
    ...session.payload.value,
    notes: target.value,
  }
  session.payload.value = updated
  session.pushState(updated)
}

function togglePlay() {
  if (!videoRef.value) return
  if (videoRef.value.paused) {
    videoRef.value.play()
    isPlaying.value = true
  } else {
    videoRef.value.pause()
    isPlaying.value = false
  }
}

function toggleMute() {
  if (!videoRef.value) return
  videoRef.value.muted = !videoRef.value.muted
  isMuted.value = videoRef.value.muted
}

function restartVideo() {
  if (!videoRef.value) return
  videoRef.value.currentTime = 0
  videoRef.value.play()
  isPlaying.value = true
}

function handleTimeUpdate() {
  if (!videoRef.value) return
  currentTime.value = videoRef.value.currentTime
}

function handleLoadedMetadata() {
  if (!videoRef.value) return
  duration.value = videoRef.value.duration
}

function handleEnded() {
  if (isAutoLoop.value && videoRef.value) {
    videoRef.value.currentTime = 0
    videoRef.value.play()
  } else {
    isPlaying.value = false
  }
}

function formatTime(secs: number) {
  const m = Math.floor(secs / 60)
  const s = Math.floor(secs % 60)
  const ms = Math.floor((secs % 1) * 10)
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms}`
}

async function loadMedia() {
  try {
    mediaUrl.value = await createDataItemMediaUrl(props.item.id)
  } catch (err: any) {
    mediaError.value = err?.message || 'Video file could not be loaded'
  }
}

const hotkeyLegend = computed(() => [
  { key: '1-9', label: isAutoAdvance.value ? 'Select and Advance' : 'Select Category' },
  { key: 'Space', label: 'Play / Pause' },
  { key: 'A / D', label: 'Prev / Next Clip' },
  { key: 'Enter', label: 'Submit Task' },
])

onMounted(() => {
  loadMedia()
})

onUnmounted(() => {
  clearAutoAdvanceTimer()
  if (mediaUrl.value) URL.revokeObjectURL(mediaUrl.value)
})

watch(() => props.item.id, () => {
  clearAutoAdvanceTimer()
  if (mediaUrl.value) URL.revokeObjectURL(mediaUrl.value)
  mediaUrl.value = ''
  currentTime.value = 0
  duration.value = 0
  isSubmittingAuto.value = false
  loadMedia()
})
</script>

<template>
  <WorkspaceShell
    :item="item"
    :session="session"
    :labels="availableLabels"
    :current-label="currentSelectedLabel"
    :show-header="false"
    :show-class-selector="false"
  >
    <!-- Viewport-fitted high-craft cinema workbench -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch select-none font-sans lg:h-[calc(100vh-200px)] min-h-[480px] max-h-[760px]">
      
      <!-- LEFT: Cinema Video Monitor Viewport -->
      <div class="lg:col-span-8 flex flex-col h-full rounded-2xl bg-zinc-950 border border-zinc-800/80 overflow-hidden shadow-xl">
        
        <!-- Video Screen Header Bar -->
        <div class="flex items-center justify-between px-4 py-2 bg-zinc-900/90 border-b border-zinc-800/80 text-xs shrink-0">
          <div class="flex items-center gap-2 min-w-0">
            <span class="text-xs font-medium text-zinc-300 truncate max-w-xs sm:max-w-md">
              {{ item.file_name }}
            </span>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <span class="font-mono text-[11px] tabular-nums text-zinc-400 bg-zinc-800/80 px-2 py-0.5 rounded border border-zinc-700/60">
              {{ formatTime(currentTime) }} / {{ formatTime(duration) }}
            </span>
            <button
              type="button"
              class="flex items-center gap-1.5 text-[11px] px-2.5 py-0.5 rounded border transition-colors cursor-pointer"
              :class="isAutoLoop ? 'bg-primary/20 text-primary border-primary/40 font-medium' : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-zinc-200'"
              @click="isAutoLoop = !isAutoLoop"
              title="Toggle automatic loop playback"
            >
              <Repeat class="size-3" />
              <span>Loop</span>
            </button>
          </div>
        </div>

        <!-- Video Canvas Stage -->
        <div class="relative flex-1 min-h-0 bg-black flex items-center justify-center overflow-hidden">
          <div v-if="mediaError" class="p-8 text-center text-rose-400 text-xs font-mono">
            <ShieldAlert class="size-8 mx-auto mb-2 text-rose-500" />
            <span>{{ mediaError }}</span>
          </div>

          <video
            v-else
            ref="videoRef"
            :src="mediaUrl || undefined"
            class="w-full h-full max-h-full object-contain cursor-pointer"
            autoplay
            loop
            playsinline
            @click="togglePlay"
            @timeupdate="handleTimeUpdate"
            @loadedmetadata="handleLoadedMetadata"
            @ended="handleEnded"
            @play="isPlaying = true"
            @pause="isPlaying = false"
          />

          <!-- Play Button Overlay when paused -->
          <button
            v-if="!isPlaying && mediaUrl && !mediaError"
            type="button"
            class="absolute inset-0 m-auto size-14 rounded-full bg-zinc-900/80 text-white border border-white/20 flex items-center justify-center backdrop-blur hover:scale-105 transition-transform cursor-pointer shadow-2xl"
            @click="togglePlay"
          >
            <Play class="size-6 translate-x-0.5 fill-white" />
          </button>
        </div>

        <!-- Video Transport Control Bar -->
        <div class="flex items-center justify-between px-4 py-2 bg-zinc-900/95 border-t border-zinc-800/80 shrink-0">
          <div class="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="sm"
              class="size-8 p-0 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-800 cursor-pointer"
              title="Play/Pause (Space)"
              @click="togglePlay"
            >
              <Play v-if="!isPlaying" class="size-4 fill-current" />
              <Pause v-else class="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              class="size-8 p-0 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-800 cursor-pointer"
              title="Restart clip"
              @click="restartVideo"
            >
              <RotateCcw class="size-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              class="size-8 p-0 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-800 cursor-pointer"
              :title="isMuted ? 'Unmute' : 'Mute'"
              @click="toggleMute"
            >
              <VolumeX v-if="isMuted" class="size-4 text-rose-400" />
              <Volume2 v-else class="size-4" />
            </Button>
          </div>

          <!-- Scrubber Track -->
          <div class="flex-1 max-w-md mx-4">
            <input
              type="range"
              min="0"
              :max="duration || 1"
              step="0.05"
              :value="currentTime"
              class="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-primary focus:outline-none"
              @input="videoRef && (videoRef.currentTime = Number(($event.target as HTMLInputElement).value))"
            />
          </div>

          <span class="text-[11px] font-mono tabular-nums text-zinc-400 shrink-0">
            {{ formatTime(currentTime) }}
          </span>
        </div>
      </div>

      <!-- RIGHT: Precision Classification Console (Single Cohesive Workbench) -->
      <div class="lg:col-span-4 flex flex-col h-full rounded-2xl border border-border/80 bg-card p-4 shadow-sm justify-between gap-3">
        
        <!-- 1. Console Header: Category Title + Inline Auto-Advance Switch -->
        <div class="flex items-center justify-between pb-3 border-b border-border/60 shrink-0">
          <div>
            <h3 class="text-xs font-semibold text-foreground tracking-tight">
              Annotation Classes
            </h3>
            <p class="text-[10.5px] text-muted-foreground mt-0.5">
              Press <kbd class="px-1 py-0.2 rounded bg-muted font-mono font-semibold text-foreground text-[10px]">1-{{ Math.min(9, availableLabels.length) }}</kbd> or click to select
            </p>
          </div>

          <!-- Sleek Auto-Advance Switch -->
          <div class="flex items-center gap-2 pl-2">
            <span class="text-[11px] font-medium text-muted-foreground select-none">Auto-advance</span>
            <button
              type="button"
              role="switch"
              :aria-checked="isAutoAdvance"
              class="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
              :class="isAutoAdvance ? 'bg-primary' : 'bg-muted-foreground/30'"
              @click="toggleAutoAdvance"
              title="Auto-advance: Automatically advances upon label selection"
            >
              <span
                class="pointer-events-none inline-block size-4 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out"
                :class="isAutoAdvance ? 'translate-x-4' : 'translate-x-0'"
              />
            </button>
          </div>
        </div>

        <!-- 2. Middle Body: Classes List & Compact Notes -->
        <div class="flex-1 min-h-0 flex flex-col gap-3 overflow-y-auto">
          <!-- Class Option Buttons -->
          <div class="flex flex-col gap-1.5 overflow-y-auto pr-0.5">
            <button
              v-for="(lbl, idx) in availableLabels"
              :key="lbl.name"
              type="button"
              class="group relative flex items-center justify-between px-3.5 py-2.5 rounded-xl border transition-all cursor-pointer text-left active:scale-[0.99]"
              :class="[
                currentSelectedLabel === lbl.name
                  ? 'border-primary/80 bg-primary/10 text-foreground font-semibold shadow-xs'
                  : 'border-border/60 bg-background/60 hover:bg-muted/50 hover:border-border text-foreground/90',
              ]"
              @click="handleSelectLabel(lbl.name)"
            >
              <div class="flex items-center gap-2.5 min-w-0">
                <span
                  class="size-2.5 rounded-full shrink-0 shadow-2xs"
                  :style="{ backgroundColor: lbl.color || '#3b82f6' }"
                />
                <span class="text-xs sm:text-sm font-medium truncate">
                  {{ lbl.name }}
                </span>
              </div>

              <div class="flex items-center gap-2 shrink-0">
                <kbd class="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-muted/80 border border-border/70 text-foreground">
                  {{ idx + 1 }}
                </kbd>
                <CheckCircle2
                  v-if="currentSelectedLabel === lbl.name"
                  class="size-4 text-primary stroke-[2.5]"
                />
              </div>
            </button>
          </div>

          <!-- Compact Reviewer Notes -->
          <div class="shrink-0 pt-1">
            <input
              type="text"
              class="w-full rounded-lg border border-border/60 bg-background/80 px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/40 transition-all"
              placeholder="Add reviewer notes (optional)..."
              :value="session.payload.value?.notes || ''"
              @input="updateNotes"
            />
          </div>
        </div>

        <!-- 3. Pinned Action Footer: Submit & Prev/Next (Always 100% visible) -->
        <div class="shrink-0 pt-3 border-t border-border/60 flex flex-col gap-2">
          <!-- Big Primary Submit Button -->
          <Button
            size="sm"
            class="w-full h-9 rounded-xl text-xs font-semibold gap-2 cursor-pointer shadow-xs transition-transform active:scale-[0.99]"
            :disabled="!currentSelectedLabel || session.isSaving.value || isSubmittingAuto"
            @click="session.submit()"
          >
            <LoaderCircle v-if="session.isSaving.value || isSubmittingAuto" class="size-4 animate-spin" />
            <CheckCircle2 v-else class="size-4" />
            <span>{{ (session.isSaving.value || isSubmittingAuto) ? 'Submitting & Advancing...' : isAutoAdvance ? 'Submit & Next [Enter]' : 'Submit [Enter]' }}</span>
          </Button>

          <!-- Prev / Next Navigation Row -->
          <div class="flex items-center justify-between gap-2">
            <Button
              variant="outline"
              size="sm"
              class="flex-1 h-8 rounded-lg text-xs font-medium gap-1.5 cursor-pointer"
              :disabled="!hasPrev"
              @click="emit('prev')"
            >
              <ChevronLeft class="size-3.5" />
              <span>Prev [A]</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              class="flex-1 h-8 rounded-lg text-xs font-medium gap-1.5 cursor-pointer"
              :disabled="!hasNext"
              @click="emit('next')"
            >
              <span>Next [D]</span>
              <ChevronRight class="size-3.5" />
            </Button>
          </div>
        </div>

      </div>
    </div>
  </WorkspaceShell>
</template>
