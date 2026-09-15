<script setup lang="ts">
import { ref, watch } from 'vue'
import Button from '@/components/ui/Button.vue'
import { Play, Pause, RotateCcw, RotateCw, Plus, Scissors } from 'lucide-vue-next'
import { formatAudioTimestamp as formatTime } from '@/utils/annotation'

const props = defineProps<{
  isPlaying: boolean
  currentTime: number
  duration: number
}>()

const emit = defineEmits<{
  (e: 'togglePlay'): void
  (e: 'skip', seconds: number): void
  (e: 'addSegment'): void
  (e: 'splitSegment'): void
  (e: 'rateChange', rate: number): void
}>()

const playbackRate = ref(1)

watch(playbackRate, (rate) => {
  emit('rateChange', rate)
})
</script>

<template>
  <div class="mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-border/40 pt-4">
    <div class="flex items-center gap-2">
      <Button variant="ghost" size="icon" class="size-8 rounded-lg" title="Seek Back 5s" @click="emit('skip', -5)">
        <RotateCcw class="size-4" />
      </Button>

      <Button
        size="icon"
        class="size-9 rounded-xl shadow-xs"
        :title="isPlaying ? 'Pause (Space)' : 'Play (Space)'"
        @click="emit('togglePlay')"
      >
        <Pause v-if="isPlaying" class="size-4" />
        <Play v-else class="size-4 fill-current ml-0.5" />
      </Button>

      <Button variant="ghost" size="icon" class="size-8 rounded-lg" title="Seek Forward 5s" @click="emit('skip', 5)">
        <RotateCw class="size-4" />
      </Button>

      <span class="text-xs font-medium tabular-nums text-foreground ml-2">
        {{ formatTime(currentTime) }} of {{ formatTime(duration) }}
      </span>
    </div>

    <div class="flex items-center gap-2">
      <Button variant="outline" size="sm" class="gap-1.5 rounded-lg text-xs font-medium h-8" @click="emit('addSegment')">
        <Plus class="size-3.5" />
        <span>Add Segment</span>
        <kbd class="px-1 py-0.2 rounded bg-muted font-mono text-[10px] text-muted-foreground border border-border/60">N</kbd>
      </Button>

      <Button variant="outline" size="sm" class="gap-1.5 rounded-lg text-xs font-medium h-8" @click="emit('splitSegment')">
        <Scissors class="size-3.5" />
        <span>Split</span>
        <kbd class="px-1 py-0.2 rounded bg-muted font-mono text-[10px] text-muted-foreground border border-border/60">K</kbd>
      </Button>

      <select
        v-model="playbackRate"
        class="h-8 rounded-lg border border-border/60 bg-muted/50 px-2 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
      >
        <option :value="0.5">0.5x</option>
        <option :value="0.75">0.75x</option>
        <option :value="1.0">1.0x</option>
        <option :value="1.25">1.25x</option>
        <option :value="1.5">1.5x</option>
        <option :value="2.0">2.0x</option>
      </select>
    </div>
  </div>
</template>
