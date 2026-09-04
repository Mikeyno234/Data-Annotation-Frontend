<script setup lang="ts">
export interface BoundingBoxItem {
  id?: string
  label?: string
  x: number
  y: number
  w: number
  h: number
  color?: string
  score?: string
}

export interface PolygonMaskItem {
  id?: string
  label?: string
  color?: string
  points: number[][]
}

export interface KeypointItem {
  name?: string
  x: number
  y: number
  color?: string
}

export interface ImageTagItem {
  label: string
  color?: string
  confidence?: string
}

defineProps<{
  previewKind: string
  previewImageUrl: string
  itemTitle: string
  boxes: BoundingBoxItem[]
  masks: PolygonMaskItem[]
  keypoints: KeypointItem[]
  tags: ImageTagItem[]
  activeHoverId?: string | null
}>()

const emit = defineEmits<{
  (e: 'hover', id: string | null): void
}>()

function formatPolygonPoints(points: number[][]): string {
  if (!Array.isArray(points)) return ''
  return points.map((p) => `${p[0]}%,${p[1]}%`).join(' ')
}
</script>

<template>
  <div class="relative h-full w-full">
    <img
      v-if="previewImageUrl"
      :src="previewImageUrl"
      :alt="itemTitle"
      class="h-full w-full object-cover object-center filter brightness-[0.88] contrast-[1.05]"
    />
    <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none"></div>

    <!-- 1. Bounding Boxes Overlay (BBOX / OBB) -->
    <svg v-if="previewKind === 'BBOX' || previewKind === 'OBB'" class="absolute inset-0 h-full w-full">
      <g
        v-for="(box, bIdx) in boxes"
        :key="box.id || bIdx"
        class="cursor-pointer transition-all duration-200"
        @mouseenter="emit('hover', box.id || `box-${bIdx}`)"
        @mouseleave="emit('hover', null)"
      >
        <rect
          :x="`${box.x}%`"
          :y="`${box.y}%`"
          :width="`${box.w}%`"
          :height="`${box.h}%`"
          fill="none"
          :stroke="box.color || '#38bdf8'"
          :stroke-width="activeHoverId === (box.id || `box-${bIdx}`) ? 2.5 : 1.5"
          :stroke-dasharray="previewKind === 'OBB' ? '4 2' : 'none'"
          class="transition-all duration-200"
          :style="{ filter: `drop-shadow(0 0 6px ${box.color || '#38bdf8'}80)` }"
        />
        <foreignObject
          :x="`${box.x}%`"
          :y="`max(0%, calc(${box.y}% - 22px))`"
          width="120"
          height="22"
        >
          <div
            class="inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-[10px] font-bold text-white shadow-sm"
            :style="{ backgroundColor: box.color || '#38bdf8' }"
          >
            <span>{{ box.label || 'object' }}</span>
            <span v-if="box.score" class="opacity-80 text-[9px]">{{ box.score }}</span>
          </div>
        </foreignObject>
      </g>
    </svg>

    <!-- 2. Polygon Segmentation Overlay -->
    <svg v-else-if="previewKind === 'POLYGON'" class="absolute inset-0 h-full w-full">
      <polygon
        v-for="(mask, mIdx) in masks"
        :key="mask.id || mIdx"
        :points="formatPolygonPoints(mask.points)"
        :fill="`${mask.color || '#10b981'}33`"
        :stroke="mask.color || '#10b981'"
        stroke-width="2"
        class="cursor-pointer transition-all duration-200 hover:fill-opacity-50"
      />
    </svg>

    <!-- 3. Keypoints / Pose Overlay -->
    <svg v-else-if="previewKind === 'KEYPOINT'" class="absolute inset-0 h-full w-full">
      <circle
        v-for="(kp, kIdx) in keypoints"
        :key="kp.name || kIdx"
        :cx="`${kp.x}%`"
        :cy="`${kp.y}%`"
        r="5"
        :fill="kp.color || '#ef4444'"
        stroke="#ffffff"
        stroke-width="1.5"
        class="cursor-pointer hover:scale-125 transition-transform"
      />
    </svg>

    <!-- 4. Image Tags / Classification Overlay -->
    <div v-else-if="previewKind === 'IMAGE_CLS'" class="absolute bottom-4 left-4 flex flex-wrap gap-2">
      <div
        v-for="(tag, tIdx) in tags"
        :key="tIdx"
        class="flex items-center gap-2 rounded-lg border border-white/20 bg-black/60 px-3 py-1.5 backdrop-blur-md"
      >
        <span class="size-2 rounded-full" :style="{ backgroundColor: tag.color || '#8b5cf6' }"></span>
        <span class="text-xs font-semibold text-white">{{ tag.label }}</span>
        <span class="text-[10px] font-mono text-zinc-300">{{ tag.confidence }}</span>
      </div>
    </div>
  </div>
</template>
