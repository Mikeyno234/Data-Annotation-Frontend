<script setup lang="ts">
import type { VideoInterval } from '@/types'
import Button from '@/components/ui/Button.vue'
import { Plus, Scissors, Trash2 } from 'lucide-vue-next'

const props = defineProps<{
  intervals: (VideoInterval & { track: number })[]
  selectedId: string
  currentTime: number
  frameRate: number
}>()

const emit = defineEmits<{
  (e: 'addInterval'): void
  (e: 'splitSelected'): void
  (e: 'addTrack'): void
  (e: 'selectInterval', id: string): void
  (e: 'removeInterval', id: string): void
  (e: 'seek', time: number): void
}>()

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
</script>

<template>
  <div class="mt-4 flex flex-col gap-4">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h3 class="text-sm font-bold uppercase tracking-wider text-muted-foreground font-mono">
          Temporal Intervals ({{ intervals.length }})
        </h3>
        <p class="text-xs text-muted-foreground">Select a range above or mark intervals below.</p>
      </div>
      <div class="flex items-center gap-2">
        <Button variant="outline" size="sm" class="gap-1.5 rounded-xl font-semibold" @click="emit('addTrack')">
          <Plus class="size-3.5" />
          <span>New Track</span>
        </Button>
        <Button variant="outline" size="sm" class="gap-1.5 rounded-xl font-semibold" @click="emit('splitSelected')">
          <Scissors class="size-3.5" />
          <span>Cut at Frame (S)</span>
        </Button>
        <Button size="sm" class="gap-1.5 rounded-xl font-semibold shadow-xs" @click="emit('addInterval')">
          <Plus class="size-3.5" />
          <span>Add Interval (N)</span>
        </Button>
      </div>
    </div>

    <!-- Interval Cards List -->
    <div class="grid grid-cols-1 gap-2.5">
      <div
        v-for="interval in intervals"
        :key="interval.id"
        class="flex items-center justify-between gap-3 rounded-2xl p-4 transition-all shadow-xs cursor-pointer border"
        :class="[
          selectedId === interval.id
            ? 'bg-primary/10 border-primary/40'
            : 'bg-card/90 border-border/50 hover:bg-card',
        ]"
        @click="emit('selectInterval', interval.id); emit('seek', interval.start)"
      >
        <div class="flex items-center gap-3">
          <span class="rounded-lg bg-muted px-2 py-1 font-mono text-[10px] font-bold text-foreground">
            TRACK {{ (interval.track || 0) + 1 }}
          </span>
          <span class="text-xs font-bold text-foreground">{{ interval.label || 'Action' }}</span>
          <span class="font-mono text-xs text-primary font-semibold">
            {{ timecode(interval.start) }} → {{ timecode(interval.end) }}
          </span>
          <span class="text-[11px] font-mono text-muted-foreground">
            ({{ (interval.end - interval.start).toFixed(2) }}s)
          </span>
        </div>

        <Button
          variant="ghost"
          size="icon"
          class="size-8 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          @click.stop="emit('removeInterval', interval.id)"
        >
          <Trash2 class="size-3.5" />
        </Button>
      </div>
    </div>
  </div>
</template>
