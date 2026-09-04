<script setup lang="ts">
import { Play, Pause, Volume2 } from 'lucide-vue-next'
import Badge from '@/components/ui/Badge.vue'

export interface VisualizerAudioSegment {
  id: string
  speaker: string
  start: number
  end: number
  text: string
  color: string
}

defineProps<{
  segments: VisualizerAudioSegment[]
  labels: string[]
  isAudioPlaying: boolean
  audioCurrentTime: number
  audioDuration: number
  activeSegmentId: string | null
}>()

const emit = defineEmits<{
  (e: 'togglePlay'): void
  (e: 'playSegment', seg: VisualizerAudioSegment): void
  (e: 'seek', event: Event): void
}>()

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00.0'
  const mins = Math.floor(seconds / 60)
  const secs = (seconds % 60).toFixed(1)
  return `${mins.toString().padStart(2, '0')}:${Number(secs) < 10 ? '0' : ''}${secs}`
}
</script>

<template>
  <div class="space-y-4">
    <!-- Audio Waveform / Progress Player Bar -->
    <div class="flex flex-col gap-2 p-3.5 rounded-xl bg-muted/40 border border-border/50">
      <div class="flex items-center gap-3">
        <button
          type="button"
          class="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all cursor-pointer shadow-xs"
          @click="emit('togglePlay')"
        >
          <Pause v-if="isAudioPlaying" class="size-4 fill-current" />
          <Play v-else class="size-4 fill-current translate-x-0.5" />
        </button>

        <!-- Progress Slider -->
        <div class="flex-1 flex flex-col gap-1">
          <input
            type="range"
            min="0"
            :max="audioDuration || 100"
            step="0.05"
            :value="audioCurrentTime"
            class="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
            @input="emit('seek', $event)"
          />
          <div class="flex items-center justify-between text-[10px] font-mono text-muted-foreground">
            <span>{{ formatTime(audioCurrentTime) }}</span>
            <span>{{ formatTime(audioDuration) }}</span>
          </div>
        </div>

        <Volume2 class="size-4 text-muted-foreground" />
      </div>
    </div>

    <!-- Diarization Segments List -->
    <div class="space-y-2 max-h-[260px] overflow-y-auto pr-1">
      <div
        v-for="seg in segments"
        :key="seg.id"
        class="flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer"
        :class="activeSegmentId === seg.id ? 'border-primary bg-primary/5' : 'border-border/60 bg-card hover:border-border'"
        @click="emit('playSegment', seg)"
      >
        <button
          type="button"
          class="size-6 flex items-center justify-center rounded-md bg-muted hover:bg-muted/80 text-foreground transition-all shrink-0 mt-0.5"
        >
          <Play class="size-3 fill-current" />
        </button>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2">
            <span
              class="px-1.5 py-0.5 rounded text-[10px] font-bold text-white shadow-2xs"
              :style="{ backgroundColor: seg.color }"
            >
              {{ seg.speaker }}
            </span>
            <span class="text-[10px] font-mono text-muted-foreground">
              {{ formatTime(seg.start) }} - {{ formatTime(seg.end) }}
            </span>
          </div>
          <p v-if="seg.text" class="text-xs text-foreground mt-1.5 leading-relaxed font-normal">
            {{ seg.text }}
          </p>
        </div>
      </div>
    </div>

    <!-- Speaker Legend -->
    <div class="flex flex-wrap items-center gap-1.5 pt-1">
      <span class="text-[11px] font-semibold text-muted-foreground mr-1">Speakers:</span>
      <Badge
        v-for="label in labels"
        :key="label"
        variant="outline"
        class="text-[11px] gap-1.5 py-0.5 px-2 bg-muted/20 border-border/60"
      >
        <span
          class="size-2 rounded-full"
          :style="{ backgroundColor: segments.find((s) => s.speaker === label)?.color || '#fa694c' }"
        ></span>
        <span>{{ label }}</span>
      </Badge>
    </div>
  </div>
</template>
