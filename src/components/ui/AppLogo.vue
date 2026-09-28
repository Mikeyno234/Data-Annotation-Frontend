<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    size?: 'sm' | 'md' | 'lg'
    showText?: boolean
    themeInvert?: boolean
  }>(),
  {
    size: 'md',
    showText: true,
    themeInvert: false,
  }
)

const iconSizeClass = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'size-6'
    case 'lg':
      return 'size-9'
    case 'md':
    default:
      return 'size-7'
  }
})

const textSizeClass = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'text-xs'
    case 'lg':
      return 'text-base'
    case 'md':
    default:
      return 'text-sm'
  }
})
</script>

<template>
  <div class="inline-flex items-center gap-2.5 select-none font-sans group">
    <!-- Precision Vector Glyph -->
    <div
      :class="[
        iconSizeClass,
        'relative rounded-lg flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105 shadow-2xs',
        themeInvert
          ? 'bg-foreground text-background'
          : 'bg-primary text-primary-foreground',
      ]"
    >
      <!-- Modern Geometric Annotation Glyph -->
      <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        class="w-[68%] h-[68%] text-current"
        aria-hidden="true"
      >
        <!-- Bounding Box Frame with Corner Anchors -->
        <rect
          x="3"
          y="3"
          width="18"
          height="18"
          rx="3.5"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-dasharray="3 2"
          opacity="0.5"
        />
        <!-- Internal Active Segment Polygon -->
        <path
          d="M7 16L11 8L17 11L14 17L7 16Z"
          fill="currentColor"
          fill-opacity="0.3"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linejoin="round"
        />
        <!-- 4 Keypoint / Anchor Vertices -->
        <circle cx="7" cy="16" r="1.5" fill="currentColor" />
        <circle cx="11" cy="8" r="1.5" fill="currentColor" />
        <circle cx="17" cy="11" r="1.5" fill="currentColor" />
        <circle cx="14" cy="17" r="1.5" fill="currentColor" />
      </svg>
    </div>

    <!-- Wordmark -->
    <div v-if="showText" class="flex items-center gap-1.5 leading-tight">
      <span
        :class="[
          textSizeClass,
          'font-bold tracking-tight text-foreground group-hover:text-primary transition-colors',
        ]"
      >
        Data Annotation
      </span>
      <span class="inline-flex items-center px-1.5 py-0.5 rounded text-[9.5px] font-bold font-mono tracking-wider bg-primary/10 text-primary border border-primary/20 uppercase">
        AI
      </span>
    </div>
  </div>
</template>
