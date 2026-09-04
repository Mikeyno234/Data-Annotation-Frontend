<script setup lang="ts">
import { Play } from 'lucide-vue-next'

export interface AudioSegmentItem {
  speaker?: string
  start?: string
  end?: string
  text?: string
  color?: string
}

defineProps<{
  segments: AudioSegmentItem[]
  audioUrl?: string
  activeHoverId?: string | null
}>()

const emit = defineEmits<{
  (e: 'hover', id: string | null): void
}>()
</script>

<template>
  <div class="relative flex h-full w-full flex-col justify-between p-6">
    <!-- Waveform Visualizer simulation -->
    <div class="flex flex-1 flex-col justify-center gap-3">
      <div class="flex h-20 w-full items-center justify-between gap-1 rounded-2xl border border-white/10 bg-black/40 px-4">
        <div
          v-for="i in 36"
          :key="i"
          class="w-1.5 rounded-full transition-all duration-300"
          :class="[
            i > 8 && i < 22
              ? 'bg-sky-400 h-14'
              : i >= 22 && i < 30
                ? 'bg-emerald-400 h-10'
                : 'bg-white/20 h-4',
          ]"
        ></div>
      </div>

      <audio
        v-if="audioUrl"
        :src="audioUrl"
        controls
        class="w-full h-8 rounded-xl bg-zinc-900 border border-white/10"
      ></audio>

      <div class="flex items-center justify-between text-[11px] font-mono text-zinc-400">
        <span>00:00.00</span>
        <span class="text-sky-400">Active Diarization: 2 Speakers</span>
        <span>00:15.00</span>
      </div>
    </div>

    <!-- Segment cards -->
    <div class="flex flex-col gap-2 pt-2">
      <div
        v-for="(seg, idx) in segments"
        :key="idx"
        class="flex items-center gap-3 rounded-xl border border-white/10 bg-zinc-900/80 p-3 transition-colors duration-150 hover:border-white/20"
        @mouseenter="emit('hover', `seg-${idx}`)"
        @mouseleave="emit('hover', null)"
      >
        <button
          type="button"
          class="flex size-7 items-center justify-center rounded-lg bg-white/10 text-white hover:bg-white/20"
        >
          <Play class="size-3.5 fill-current" />
        </button>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2">
            <span
              class="rounded px-1.5 py-0.5 text-[10px] font-bold"
              :style="{ backgroundColor: `${seg.color}20`, color: seg.color }"
            >
              {{ seg.speaker || `Speaker ${idx + 1}` }}
            </span>
            <span class="font-mono text-[10px] text-zinc-400">
              {{ seg.start }} - {{ seg.end }}
            </span>
          </div>
          <p class="mt-1 truncate text-xs text-zinc-200">
            {{ seg.text }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
