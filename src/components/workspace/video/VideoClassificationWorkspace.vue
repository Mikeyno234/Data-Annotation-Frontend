<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import type { DataItem, LabelOption } from '@/types'
import { createDataItemMediaUrl } from '@/api/media'
import { useAnnotationSession } from '@/composables/useAnnotationSession'
import { toast } from '@/utils/toast'
import WorkspaceShell from '@/components/workspace/WorkspaceShell.vue'
import Badge from '@/components/ui/Badge.vue'
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

const defaultLabels: LabelOption[] = [
  { name: 'Harassment', color: '#ef4444' },
  { name: 'Normal', color: '#10b981' },
  { name: 'Unlabeled', color: '#64748b' },
]

const availableLabels = computed(() => (props.labels?.length ? props.labels : defaultLabels))

// Dynamically generate unique hotkey for each label (1, 2, 3... or first letter)
const labelHotkeys = computed(() => {
  const map: Record<string, { key: string; labelName: string }> = {}
  availableLabels.value.forEach((l, idx) => {
    // 1-indexed digit hotkey
    if (idx < 9) {
      map[`Digit${idx + 1}`] = { key: String(idx + 1), labelName: l.name }
      map[`Numpad${idx + 1}`] = { key: String(idx + 1), labelName: l.name }
    }
    // First letter uppercase (e.g. 'H' for Harassment, 'N' for Normal)
    const firstChar = l.name.trim().charAt(0).toUpperCase()
    if (/^[A-Z]$/.test(firstChar)) {
      const code = `Key${firstChar}`
      // Don't collide with playback/nav keys A, D, Space
      if (code !== 'KeyA' && code !== 'KeyD' && !map[code]) {
        map[code] = { key: firstChar, labelName: l.name }
      }
    }
  })
  return map
})

function getDisplayHotkey(labelName: string, idx: number): string {
  const char = labelName.trim().charAt(0).toUpperCase()
  if (/^[A-Z]$/.test(char) && char !== 'A' && char !== 'D') {
    return `${idx + 1} / ${char}`
  }
  return `${idx + 1}`
}

// Session management
const session = useAnnotationSession<VideoClassificationPayload>({
  item: props.item,
  annotationType: props.annotationType || 'Video Clip Classification',
  initialPayload: {
    label: '',
    notes: '',
  },
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
      if ((e.target as HTMLElement)?.tagName !== 'INPUT' && (e.target as HTMLElement)?.tagName !== 'TEXTAREA') {
        e.preventDefault()
        emit('next')
      }
    },
    KeyA: (e) => {
      if ((e.target as HTMLElement)?.tagName !== 'INPUT' && (e.target as HTMLElement)?.tagName !== 'TEXTAREA') {
        e.preventDefault()
        emit('prev')
      }
    },
    Enter: (e) => {
      if ((e.target as HTMLElement)?.tagName !== 'INPUT' && (e.target as HTMLElement)?.tagName !== 'TEXTAREA') {
        e.preventDefault()
        if (currentSelectedLabel.value) {
          session.submit()
        } else {
          toast.warning('Pilih label dulu', 'Tekan tombol angka atau klik label sebelum submit.')
        }
      }
    },
    ...Object.fromEntries(
      Object.entries(labelHotkeys.value).map(([code, { labelName }]) => [
        code,
        (e: KeyboardEvent) => {
          if ((e.target as HTMLElement)?.tagName !== 'INPUT' && (e.target as HTMLElement)?.tagName !== 'TEXTAREA') {
            e.preventDefault()
            handleSelectLabel(labelName)
          }
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
  const updated: VideoClassificationPayload = {
    ...session.payload.value,
    label: labelName,
  }
  session.payload.value = updated
  session.pushState(updated)
}

function updateNotes(e: Event) {
  const target = e.target as HTMLTextAreaElement
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

const hotkeyLegend = [
  { key: '1, 2, 3..', label: 'Select Category' },
  { key: 'Space', label: 'Play / Pause' },
  { key: 'A / D', label: 'Prev / Next Clip' },
  { key: 'Enter', label: 'Submit Task' },
]

onMounted(() => {
  loadMedia()
})

onUnmounted(() => {
  if (mediaUrl.value) URL.revokeObjectURL(mediaUrl.value)
})

watch(() => props.item.id, () => {
  if (mediaUrl.value) URL.revokeObjectURL(mediaUrl.value)
  mediaUrl.value = ''
  currentTime.value = 0
  duration.value = 0
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
    <!-- Professional Ultra-Minimal Dark Workspace Canvas -->
    <div class="grid grid-cols-1 gap-5 lg:grid-cols-12 items-start select-none font-sans">
      
      <!-- LEFT: Cinema Video Monitor Viewport -->
      <div class="lg:col-span-8 flex flex-col gap-3">
        <div class="overflow-hidden rounded-2xl bg-zinc-950 border border-border/70 shadow-2xl">
          
          <!-- Top Screen Meta Bar -->
          <div class="flex items-center justify-between px-4 py-2.5 bg-zinc-900/90 border-b border-zinc-800/80 text-xs">
            <div class="flex items-center gap-2.5 min-w-0">
              <span class="size-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
              <span class="font-mono text-xs font-semibold text-zinc-200 truncate max-w-xs sm:max-w-md">
                {{ item.file_name }}
              </span>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <span class="font-mono text-[11px] text-zinc-400 bg-zinc-800/80 px-2 py-0.5 rounded border border-zinc-700/60">
                {{ formatTime(currentTime) }} / {{ formatTime(duration) }}
              </span>
              <button
                type="button"
                class="text-[10px] font-mono px-2 py-0.5 rounded border transition-colors cursor-pointer"
                :class="isAutoLoop ? 'bg-primary/20 text-primary border-primary/40' : 'bg-zinc-800 text-zinc-400 border-zinc-700'"
                @click="isAutoLoop = !isAutoLoop"
                title="Loop clip playback automatically"
              >
                LOOP: {{ isAutoLoop ? 'ON' : 'OFF' }}
              </button>
            </div>
          </div>

          <!-- Video Stage -->
          <div class="relative flex items-center justify-center min-h-[380px] max-h-[66vh] bg-black">
            <div v-if="mediaError" class="p-8 text-center text-rose-400 text-xs font-mono">
              <ShieldAlert class="size-8 mx-auto mb-2 text-rose-500" />
              <span>{{ mediaError }}</span>
            </div>
            
            <video
              v-else
              ref="videoRef"
              :src="mediaUrl || undefined"
              class="w-full max-h-[66vh] object-contain cursor-pointer"
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

            <!-- Play Button Overlay -->
            <button
              v-if="!isPlaying && mediaUrl && !mediaError"
              type="button"
              class="absolute inset-0 m-auto size-16 rounded-full bg-zinc-900/80 text-white border border-white/20 flex items-center justify-center backdrop-blur hover:scale-105 transition-transform cursor-pointer shadow-2xl"
              @click="togglePlay"
            >
              <Play class="size-7 translate-x-0.5 fill-white" />
            </button>
          </div>

          <!-- Video Transport Control Bar -->
          <div class="flex items-center justify-between px-4 py-2.5 bg-zinc-900/95 border-t border-zinc-800/80">
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

            <span class="text-[11px] font-mono text-zinc-400">
              {{ formatTime(currentTime) }}
            </span>
          </div>

          <!-- Active Label State Footer Bar -->
          <div
            class="px-5 py-3 border-t transition-colors flex items-center justify-between"
            :style="{
              backgroundColor: currentSelectedLabel ? `${activeColor}15` : 'transparent',
              borderColor: currentSelectedLabel ? `${activeColor}40` : 'rgba(255,255,255,0.08)',
            }"
          >
            <div class="flex items-center gap-2.5">
              <span
                class="size-2 rounded-full"
                :style="{ backgroundColor: currentSelectedLabel ? activeColor : '#71717a' }"
              ></span>
              <span
                v-if="currentSelectedLabel"
                class="font-mono text-xs sm:text-sm font-bold tracking-wider uppercase"
                :style="{ color: activeColor }"
              >
                SELECTED: {{ currentSelectedLabel }}
              </span>
              <span v-else class="text-xs font-mono text-muted-foreground">
                No label selected yet. Press a hotkey (1-9) or click a category.
              </span>
            </div>
            <div class="text-[11px] text-muted-foreground tabular-nums">
              Item #{{ item.id }}
            </div>
          </div>
        </div>
      </div>

      <!-- RIGHT: Precision Classification Console -->
      <div class="lg:col-span-4 flex flex-col gap-4">
        
        <!-- Category Selector Panel -->
        <div class="rounded-2xl p-4 border border-border/70 bg-card/95 shadow-sm space-y-3">
          <div class="flex items-center justify-between border-b border-border/40 pb-2.5">
            <span class="text-xs font-semibold text-foreground">
              Annotation Classes
            </span>
            <span class="text-[11px] text-muted-foreground">
              Hotkeys: 1-{{ availableLabels.length }}
            </span>
          </div>

          <div class="grid grid-cols-1 gap-2">
            <button
              v-for="(lbl, idx) in availableLabels"
              :key="lbl.name"
              type="button"
              class="group relative flex items-center justify-between px-4 py-3 rounded-xl border transition-all cursor-pointer text-left active:scale-[0.99]"
              :class="[
                currentSelectedLabel === lbl.name
                  ? 'border-foreground/70 bg-accent text-accent-foreground font-bold shadow-xs'
                  : 'border-border/60 bg-background/60 hover:bg-muted/60 hover:border-border',
              ]"
              @click="handleSelectLabel(lbl.name)"
            >
              <div class="flex items-center gap-3 min-w-0">
                <span
                  class="size-3 rounded-full shrink-0 shadow-2xs"
                  :style="{ backgroundColor: lbl.color || '#3b82f6' }"
                ></span>
                <span class="text-xs sm:text-sm font-semibold truncate">
                  {{ lbl.name }}
                </span>
              </div>

              <div class="flex items-center gap-2">
                <kbd class="px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold bg-muted/80 border border-border/70 text-foreground">
                  {{ getDisplayHotkey(lbl.name, idx) }}
                </kbd>
                <CheckCircle2
                  v-if="currentSelectedLabel === lbl.name"
                  class="size-4 stroke-[2.5]"
                  :style="{ color: activeColor }"
                />
              </div>
            </button>
          </div>
        </div>

        <!-- Optional Notes -->
        <div class="rounded-2xl p-3.5 border border-border/60 bg-card/60 space-y-1.5 shadow-2xs">
          <label class="block text-[11px] font-mono font-semibold text-muted-foreground">Notes (Optional)</label>
          <textarea
            rows="2"
            class="w-full rounded-xl border border-border/60 bg-background/80 px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/40 resize-none transition-all"
            placeholder="Additional notes for reviewer..."
            :value="session.payload.value?.notes || ''"
            @input="updateNotes"
          ></textarea>
        </div>

        <!-- Navigation & Primary Submission Bar -->
        <div class="flex flex-col gap-2 pt-1">
          <!-- Big Explicit Submit Button -->
          <Button
            size="lg"
            class="w-full h-10 rounded-xl text-xs font-bold gap-2 cursor-pointer shadow-sm transition-transform active:scale-[0.99]"
            :disabled="!currentSelectedLabel || session.isSaving.value"
            @click="session.submit()"
          >
            <CheckCircle2 class="size-4" />
            <span>{{ session.isSaving.value ? 'Saving...' : 'Submit & Save [Enter]' }}</span>
          </Button>

          <!-- Prev / Next Navigation -->
          <div class="flex items-center justify-between gap-2 pt-1">
            <Button
              variant="outline"
              size="sm"
              class="flex-1 rounded-xl text-xs font-medium gap-1.5 cursor-pointer"
              :disabled="!hasPrev"
              @click="emit('prev')"
            >
              <ChevronLeft class="size-3.5" />
              <span>Prev [A]</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              class="flex-1 rounded-xl text-xs font-medium gap-1.5 cursor-pointer"
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
