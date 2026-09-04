<script setup lang="ts">
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

defineProps<{
  regions: VisualizerBoxRegion[]
  labels: string[]
  mediaUrl: string | null
  mediaLoadError: boolean
}>()
</script>

<template>
  <div class="space-y-3">
    <!-- Interactive Visual Canvas Container -->
    <div class="relative w-full aspect-video sm:aspect-2/1 max-h-[320px] rounded-xl overflow-hidden bg-slate-900 border border-border/40 flex items-center justify-center select-none group">
      <img
        v-if="mediaUrl && !mediaLoadError"
        :src="mediaUrl"
        alt="Annotation Context"
        class="absolute inset-0 w-full h-full object-contain"
      />
      <div
        v-else
        class="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px] opacity-40"
      ></div>

      <!-- Bounding Boxes Overlay -->
      <div class="absolute inset-0 pointer-events-none">
        <div
          v-for="box in regions"
          :key="box.id"
          class="absolute transition-all duration-200 pointer-events-auto group/box cursor-pointer"
          :style="{
            left: `${box.x}%`,
            top: `${box.y}%`,
            width: `${box.width}%`,
            height: `${box.height}%`,
            borderColor: box.color,
          }"
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
