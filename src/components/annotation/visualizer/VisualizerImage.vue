<script setup lang="ts">
import { ref, computed } from 'vue'
import Badge from '@/components/ui/Badge.vue'

export interface VisualizerBoxRegion {
  id: string
  label: string
  x: number
  y: number
  width: number
  height: number
  color: string
}

const props = defineProps<{
  regions: VisualizerBoxRegion[]
  labels: string[]
  mediaUrl: string | null
  mediaLoadError: boolean
}>()

const imgRef = ref<HTMLImageElement | null>(null)
const naturalWidth = ref(0)
const naturalHeight = ref(0)

function onImageLoad(e: Event) {
  const el = e.target as HTMLImageElement
  if (el) {
    naturalWidth.value = el.naturalWidth || 0
    naturalHeight.value = el.naturalHeight || 0
  }
}

/**
 * Computes bounding box percentage styles (0..100%) for responsive image canvas overlay.
 */
const normalizedRegions = computed(() => {
  return (props.regions || []).map((box) => {
    const rawX = Number(box.x || 0)
    const rawY = Number(box.y || 0)
    const rawW = Number(box.width || 0)
    const rawH = Number(box.height || 0)

    let normX = rawX
    let normY = rawY
    let normW = rawW
    let normH = rawH

    if (rawX <= 1.0 && rawW <= 1.0) {
      normX = rawX * 100
      normY = rawY * 100
      normW = rawW * 100
      normH = rawH * 100
    } else if (rawX > 100 || rawW > 100) {
      const refW = naturalWidth.value > 0 ? naturalWidth.value : 1
      const refH = naturalHeight.value > 0 ? naturalHeight.value : 1
      normX = (rawX / refW) * 100
      normY = (rawY / refH) * 100
      normW = (rawW / refW) * 100
      normH = (rawH / refH) * 100
    }

    const clampedX = Math.max(0, Math.min(normX, 99))
    const clampedY = Math.max(0, Math.min(normY, 99))
    const clampedW = Math.max(1, Math.min(normW, 100 - clampedX))
    const clampedH = Math.max(1, Math.min(normH, 100 - clampedY))

    return {
      ...box,
      style: {
        left: `${clampedX.toFixed(2)}%`,
        top: `${clampedY.toFixed(2)}%`,
        width: `${clampedW.toFixed(2)}%`,
        height: `${clampedH.toFixed(2)}%`,
        borderColor: box.color,
      },
    }
  })
})
</script>

<template>
  <div class="space-y-3">
    <!-- Interactive Visual Canvas Container -->
    <div class="relative w-full aspect-video sm:aspect-2/1 max-h-[320px] rounded-xl overflow-hidden bg-slate-900 border border-border/40 flex items-center justify-center select-none group">
      <img
        v-if="mediaUrl && !mediaLoadError"
        ref="imgRef"
        :src="mediaUrl"
        alt="Annotation Context"
        class="absolute inset-0 w-full h-full object-contain"
        @load="onImageLoad"
      />
      <div
        v-else
        class="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px] opacity-40"
      ></div>

      <!-- Bounding Boxes Overlay -->
      <div class="absolute inset-0 pointer-events-none">
        <div
          v-for="box in normalizedRegions"
          :key="box.id"
          class="absolute transition-all duration-200 pointer-events-auto group/box cursor-pointer"
          :style="box.style"
        >
          <div
            class="w-full h-full border-2 rounded-sm transition-all"
            :style="{
              borderColor: box.color,
              backgroundColor: `${box.color}15`,
            }"
          >
            <span
              class="absolute -top-5 left-0 px-1.5 py-0.5 rounded text-[10px] font-bold text-white shadow-xs select-none whitespace-nowrap"
              :style="{ backgroundColor: box.color }"
            >
              {{ box.label }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Labels Legend Footer -->
    <div class="flex flex-wrap items-center gap-1.5 pt-1">
      <span class="text-[11px] font-semibold text-muted-foreground mr-1">Classes:</span>
      <Badge
        v-for="label in labels"
        :key="label"
        variant="outline"
        class="text-[11px] gap-1.5 py-0.5 px-2 bg-muted/20 border-border/60"
      >
        <span
          class="size-2 rounded-full"
          :style="{ backgroundColor: regions.find((r) => r.label === label)?.color || '#fa694c' }"
        ></span>
        <span>{{ label }}</span>
      </Badge>
    </div>
  </div>
</template>
