<script setup lang="ts">
import { ref } from 'vue'
import Badge from '@/components/ui/Badge.vue'
import { Play, Pause, RotateCcw, Film } from 'lucide-vue-next'

const props = defineProps<{
  label: string
  confidence?: string
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
  <div class="grid grid-cols-1 md:grid-cols-12 gap-4 items-center select-none">
    <!-- Video Player Preview -->
    <div class="md:col-span-7 relative rounded-xl overflow-hidden bg-black border border-border/60 aspect-video flex items-center justify-center">
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
      <div v-else class="text-xs font-mono text-muted-foreground flex flex-col items-center gap-1.5 p-4 text-center">
        <Film class="size-6 text-muted-foreground/60" />
        <span>Video preview not available</span>
      </div>

      <!-- Floating Controls -->
      <div v-if="mediaUrl && !mediaLoadError" class="absolute bottom-2 left-2 right-2 flex items-center justify-between px-3 py-1.5 rounded-lg bg-zinc-950/80 backdrop-blur border border-white/10 text-xs">
        <div class="flex items-center gap-2">
          <button
            type="button"
            class="text-white hover:text-primary transition-colors cursor-pointer"
            @click="togglePlay"
          >
            <Pause v-if="isPlaying" class="size-3.5" />
            <Play v-else class="size-3.5 fill-current" />
          </button>
          <button
            type="button"
            class="text-zinc-400 hover:text-white transition-colors cursor-pointer"
            @click="restart"
          >
            <RotateCcw class="size-3" />
          </button>
        </div>
        <span class="font-mono text-[10px] text-zinc-400">Clip Preview</span>
      </div>
    </div>

    <!-- Classification Summary Card -->
    <div class="md:col-span-5 flex flex-col gap-3 p-4 rounded-xl bg-card border border-border/70 shadow-2xs">
      <div class="text-[10px] font-mono uppercase tracking-wider text-muted-foreground font-bold">
        Clip Classification Result
      </div>

      <div class="p-3 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-between">
        <span class="font-mono text-base font-black text-primary uppercase tracking-wide">
          {{ label }}
        </span>
        <Badge v-if="confidence" variant="default" class="font-mono text-[10px] font-extrabold uppercase">
          {{ confidence }}
        </Badge>
      </div>

      <div v-if="notes" class="text-xs text-muted-foreground pt-1 border-t border-border/40">
        <span class="font-bold text-foreground font-mono">Notes:</span>
        <p class="mt-0.5 italic text-foreground/80">{{ notes }}</p>
      </div>
    </div>
  </div>
</template>
