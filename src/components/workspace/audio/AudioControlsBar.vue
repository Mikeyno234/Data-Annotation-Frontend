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
      <Button variant="ghost" size="icon" class="size-8 rounded-xl" title="Seek Back 5s" @click="emit('skip', -5)">
        <RotateCcw class="size-4" />
      </Button>

      <Button
        size="icon"
        class="size-10 rounded-2xl shadow-md"
        :title="isPlaying ? 'Pause (Space)' : 'Play (Space)'"
        @click="emit('togglePlay')"
      >
        <Pause v-if="isPlaying" class="size-4" />
        <Play v-else class="size-4 fill-current ml-0.5" />
      </Button>

      <Button variant="ghost" size="icon" class="size-8 rounded-xl" title="Seek Forward 5s" @click="emit('skip', 5)">
        <RotateCw class="size-4" />
      </Button>

      <span class="font-mono text-xs font-semibold text-foreground ml-2">
        {{ formatTime(currentTime) }} / {{ formatTime(duration) }}
      </span>
    </div>

    <div class="flex items-center gap-2">
      <Button variant="outline" size="sm" class="gap-1.5 rounded-xl text-xs font-semibold" @click="emit('addSegment')">
        <Plus class="size-3.5" />
        <span>Add Segment (N)</span>
      </Button>

      <Button variant="outline" size="sm" class="gap-1.5 rounded-xl text-xs font-semibold" @click="emit('splitSegment')">
        <Scissors class="size-3.5" />
        <span>Split (K)</span>
      </Button>

      <select
        v-model="playbackRate"
        class="h-8 rounded-xl border-0 bg-muted/60 px-2.5 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 shadow-inner"
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
