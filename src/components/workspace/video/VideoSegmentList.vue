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
        <h3 class="text-sm font-semibold text-foreground">
          Temporal Intervals ({{ intervals.length }})
        </h3>
        <p class="text-xs text-muted-foreground">Select a range above or mark intervals below.</p>
      </div>
      <div class="flex items-center gap-2">
        <Button variant="outline" size="sm" class="gap-1.5 rounded-md font-medium text-xs h-8" @click="emit('addTrack')">
          <Plus class="size-3.5" />
          <span>New Track</span>
        </Button>
        <Button variant="outline" size="sm" class="gap-1.5 rounded-md font-medium text-xs h-8" @click="emit('splitSelected')">
          <Scissors class="size-3.5" />
          <span>Cut at frame</span>
          <kbd class="ml-0.5 px-1 py-0.2 rounded text-[10px] font-mono bg-muted text-muted-foreground border border-border/70">S</kbd>
        </Button>
        <Button size="sm" class="gap-1.5 rounded-md font-medium text-xs h-8 shadow-xs" @click="emit('addInterval')">
          <Plus class="size-3.5" />
          <span>Add interval</span>
          <kbd class="ml-0.5 px-1 py-0.2 rounded text-[10px] font-mono bg-primary-foreground/20 text-primary-foreground border border-primary-foreground/30">N</kbd>
        </Button>
      </div>
    </div>

    <!-- Interval Cards List -->
    <div class="grid grid-cols-1 gap-2">
      <div
        v-for="interval in intervals"
        :key="interval.id"
        class="flex items-center justify-between gap-3 rounded-lg p-2.5 transition-colors cursor-pointer border"
        :class="[
          selectedId === interval.id
            ? 'bg-primary/10 border-primary/40'
            : 'bg-card border-border/50 hover:bg-muted/40',
        ]"
        @click="emit('selectInterval', interval.id); emit('seek', interval.start)"
      >
        <div class="flex items-center gap-3">
          <span class="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground border border-border/50">
            Track {{ (interval.track || 0) + 1 }}
          </span>
          <span class="text-xs font-semibold text-foreground">{{ interval.label || 'Action' }}</span>
          <span class="font-mono text-xs text-foreground font-medium tabular-nums">
            {{ timecode(interval.start) }} → {{ timecode(interval.end) }}
          </span>
          <span class="text-[11px] font-mono text-muted-foreground tabular-nums">
            ({{ (interval.end - interval.start).toFixed(2) }}s)
          </span>
        </div>

        <Button
          variant="ghost"
          size="icon"
          class="size-7 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          @click.stop="emit('removeInterval', interval.id)"
        >
          <Trash2 class="size-3.5" />
        </Button>
      </div>
    </div>
  </div>
</template>
