<script setup lang="ts">
import { Play } from 'lucide-vue-next'

export interface VideoActionItem {
  label: string
  start: string
  end: string
  color?: string
}

defineProps<{
  previewImageUrl?: string
  videoUrl?: string
  actions: VideoActionItem[]
}>()
</script>

<template>
  <div class="relative flex h-full w-full flex-col">
    <!-- Video Player Screen -->
    <div class="relative flex-1 bg-black overflow-hidden flex items-center justify-center">
      <video
        v-if="videoUrl"
        :src="videoUrl"
        controls
        class="h-full w-full object-contain"
      ></video>
      <template v-else>
        <img
          v-if="previewImageUrl"
          :src="previewImageUrl"
          alt="Video Keyframe"
          class="h-full w-full object-cover brightness-90"
        />
        <div class="absolute inset-0 flex items-center justify-center">
          <div class="flex size-14 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md transition-transform hover:scale-110">
            <Play class="size-6 fill-current translate-x-0.5" />
          </div>
        </div>
        <div class="absolute bottom-3 left-3 rounded bg-black/70 px-2 py-1 font-mono text-[10px] text-white">
          00:07.45 / 00:30.00
        </div>
      </template>
    </div>

    <!-- Timeline Scrubber & Actions -->
    <div class="flex flex-col gap-2 border-t border-white/10 bg-zinc-900/90 p-4">
      <div class="relative h-6 w-full rounded-lg bg-black/50 overflow-hidden">
        <!-- Playhead -->
        <div class="absolute left-1/4 top-0 bottom-0 w-0.5 bg-primary z-10"></div>
        <!-- Segments track -->
        <div class="absolute left-[10%] w-[35%] top-1 bottom-1 rounded bg-amber-500/40 border border-amber-500/60"></div>
        <div class="absolute left-[50%] w-[25%] top-1 bottom-1 rounded bg-red-500/40 border border-red-500/60"></div>
      </div>

      <div class="flex items-center justify-between pt-1">
        <div class="flex items-center gap-2">
          <span
            v-for="(action, aIdx) in actions"
            :key="aIdx"
            class="flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[10px] font-semibold"
            :style="{ backgroundColor: `${action.color || '#f59e0b'}20`, color: action.color || '#f59e0b' }"
          >
            <span class="size-1.5 rounded-full" :style="{ backgroundColor: action.color || '#f59e0b' }"></span>
            {{ action.label }} ({{ action.start }} - {{ action.end }})
          </span>
        </div>
        <span class="font-mono text-[10px] text-zinc-400">30 FPS</span>
      </div>
    </div>
  </div>
</template>
