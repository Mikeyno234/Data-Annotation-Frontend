<script setup lang="ts">
import { ref } from 'vue'
import { Play, Pause, RotateCcw, Film, Tag, Sparkles } from 'lucide-vue-next'

defineProps<{
  label: string
  confidence?: string | number
  notes?: string
  mediaUrl: string | null
  mediaLoadError: boolean
}>()

const videoRef = ref<HTMLVideoElement | null>(null)
const isPlaying = ref(false)

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

function restart() {
  if (!videoRef.value) return
  videoRef.value.currentTime = 0
  videoRef.value.play()
  isPlaying.value = true
}
</script>

<template>
  <div class="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start select-none">
    <!-- Video Player Preview Container -->
    <div class="lg:col-span-8 relative rounded-xl overflow-hidden bg-zinc-950 border border-border/70 aspect-video flex items-center justify-center shadow-inner group">
      <video
        v-if="mediaUrl && !mediaLoadError"
        ref="videoRef"
        :src="mediaUrl"
        class="w-full h-full object-contain cursor-pointer"
        loop
        playsinline
        @click="togglePlay"
        @play="isPlaying = true"
        @pause="isPlaying = false"
      />
      <div v-else class="text-xs text-muted-foreground flex flex-col items-center gap-2 p-6 text-center">
        <Film class="size-7 text-muted-foreground/40" />
        <span class="font-mono text-xs">Video stream unavailable</span>
      </div>

      <!-- Sleek Overlay Player Controls -->
      <div
        v-if="mediaUrl && !mediaLoadError"
        class="absolute bottom-3 left-3 right-3 flex items-center justify-between px-3 py-1.5 rounded-lg bg-zinc-900/85 backdrop-blur-md border border-white/10 text-xs transition-opacity duration-200"
      >
        <div class="flex items-center gap-2">
          <button
            type="button"
            class="text-white hover:text-primary transition-colors cursor-pointer p-1 rounded hover:bg-white/10"
            title="Play / Pause"
            @click="togglePlay"
          >
            <Pause v-if="isPlaying" class="size-3.5" />
            <Play v-else class="size-3.5 fill-current" />
          </button>
          <button
            type="button"
            class="text-zinc-400 hover:text-white transition-colors cursor-pointer p-1 rounded hover:bg-white/10"
            title="Restart Video"
            @click="restart"
          >
            <RotateCcw class="size-3" />
          </button>
        </div>
        <div class="flex items-center gap-2 font-mono text-[10px] text-zinc-400">
          <span>Loop Mode</span>
        </div>
      </div>
    </div>

    <!-- Classification Details Card -->
    <div class="lg:col-span-4 flex flex-col gap-4 p-4 rounded-xl bg-card border border-border/70 shadow-2xs">
      <div class="flex items-center justify-between pb-2 border-b border-border/40">
        <div class="flex items-center gap-1.5 text-xs font-semibold text-foreground">
          <Tag class="size-3.5 text-primary" />
          <span>Classification Target</span>
        </div>
        <span class="text-[10px] font-mono text-muted-foreground uppercase">Video Label</span>
      </div>

      <!-- Humanized Tag / Result -->
      <div class="flex flex-col gap-2">
        <div class="flex items-center justify-between p-3 rounded-lg bg-muted/40 border border-border/50">
          <span class="text-sm font-bold tracking-tight text-foreground font-sans">
            {{ label }}
          </span>
          <span
            v-if="confidence !== undefined && confidence !== null && confidence !== ''"
            class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-primary/10 text-primary border border-primary/20"
          >
            <Sparkles class="size-2.5" />
            <span>{{ typeof confidence === 'number' ? (confidence * 100).toFixed(0) + '%' : confidence }}</span>
          </span>
        </div>
      </div>

      <!-- Annotator Notes if present -->
      <div v-if="notes" class="space-y-1.5 pt-2 border-t border-border/40">
        <div class="text-[10px] font-mono text-muted-foreground uppercase tracking-wider font-semibold">Annotator Comment</div>
        <div class="p-2.5 rounded-lg bg-muted/30 border border-border/40 text-xs text-foreground/80 leading-relaxed font-normal">
          {{ notes }}
        </div>
      </div>
    </div>
  </div>
</template>
