<script setup lang="ts">
import { ref, computed } from 'vue'
import { toasts } from '@/utils/toast'
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X, Layers } from 'lucide-vue-next'

const isHovered = ref(false)

// Reversed so index 0 is always the newest toast (front of the deck)
const reversedToasts = computed(() => [...toasts.value].reverse())
const totalCount = computed(() => toasts.value.length)

function remove(id: string) {
  toasts.value = toasts.value.filter((t) => t.id !== id)
}

function clearAll() {
  toasts.value = []
}

function getToastStyle(idx: number) {
  if (isHovered.value) {
    // When hovered, expand slightly into a readable stack upward, without blocking the whole screen
    return {
      transform: `translateY(-${idx * 66}px) scale(1)`,
      zIndex: 50 - idx,
      opacity: idx >= 4 ? 0 : 1,
      pointerEvents: idx >= 4 ? ('none' as const) : ('auto' as const),
    }
  }

  // When collapsed (default): stack neatly on top of each other (deck style)
  // Takes only ONE toast card height so it never towers upwards or blocks the screen
  if (idx === 0) {
    return {
      transform: 'translateY(0) scale(1)',
      zIndex: 50,
      opacity: 1,
      pointerEvents: 'auto' as const,
    }
  } else if (idx === 1) {
    return {
      transform: 'translateY(-8px) scale(0.96)',
      zIndex: 40,
      opacity: 0.85,
      pointerEvents: 'none' as const,
    }
  } else if (idx === 2) {
    return {
      transform: 'translateY(-16px) scale(0.92)',
      zIndex: 30,
      opacity: 0.60,
      pointerEvents: 'none' as const,
    }
  } else {
    return {
      transform: 'translateY(-24px) scale(0.88)',
      zIndex: 20,
      opacity: 0,
      pointerEvents: 'none' as const,
    }
  }
}
</script>

<template>
  <div
    v-if="toasts.length > 0"
    class="fixed bottom-4 right-4 z-50 pointer-events-none w-full max-w-[340px] select-none"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
  >
    <!-- Relative wrapper for stacked cards with fixed single-card footprint -->
    <div class="relative w-full h-[64px] pointer-events-auto">
      <!-- Badge counter when multiple notifications exist and stack is collapsed -->
      <div
        v-if="!isHovered && totalCount > 1"
        class="absolute -top-2.5 -left-2 z-50 flex items-center gap-1 rounded-full bg-primary text-primary-foreground px-2 py-0.5 text-[10px] font-bold shadow-md ring-2 ring-background pointer-events-none transition-transform animate-pulse"
      >
        <Layers class="size-3" />
        <span>{{ totalCount }}</span>
      </div>

      <!-- Expand header with dismiss all when hovered -->
      <div
        v-if="isHovered && totalCount > 1"
        :style="{ transform: `translateY(-${(Math.min(totalCount, 4) - 1) * 66 + 32}px)` }"
        class="absolute left-0 right-0 flex items-center justify-between text-[11px] font-medium text-muted-foreground bg-card/90 backdrop-blur-md px-3 py-1 rounded-lg border border-border/70 shadow-xs pointer-events-auto transition-all duration-300"
      >
        <span class="flex items-center gap-1.5 font-semibold text-foreground">
          <Layers class="size-3 text-primary" />
          {{ totalCount }} notifications
        </span>
        <button
          type="button"
          class="hover:text-destructive hover:underline font-semibold cursor-pointer"
          @click.stop="clearAll"
        >
          Dismiss all
        </button>
      </div>

      <!-- Stacked Toast Cards -->
      <TransitionGroup
        enter-active-class="transition duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
        enter-from-class="translate-x-full opacity-0 scale-95"
        enter-to-class="translate-x-0 opacity-100 scale-100"
        leave-active-class="transition duration-200 ease-in"
        leave-from-class="translate-x-0 opacity-100 scale-100"
        leave-to-class="translate-x-full opacity-0 scale-90"
      >
        <div
          v-for="(item, idx) in reversedToasts"
          :key="item.id"
          class="absolute bottom-0 right-0 w-full rounded-xl border p-3 shadow-lg backdrop-blur-md transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] cursor-pointer"
          :style="getToastStyle(idx)"
          :class="{
            'border-emerald-500/40 bg-card/95 text-foreground shadow-emerald-500/10': item.type === 'success',
            'border-destructive/40 bg-card/95 text-foreground shadow-destructive/10': item.type === 'error',
            'border-amber-500/40 bg-card/95 text-foreground shadow-amber-500/10': item.type === 'warning',
            'border-primary/40 bg-card/95 text-foreground shadow-primary/10': item.type === 'info',
          }"
          @click="remove(item.id)"
        >
          <div class="flex items-center justify-between gap-2.5">
            <div class="flex items-center gap-2.5 min-w-0">
              <div
                class="shrink-0 size-7 rounded-lg flex items-center justify-center"
                :class="{
                  'bg-emerald-500/10 text-emerald-500': item.type === 'success',
                  'bg-destructive/10 text-destructive': item.type === 'error',
                  'bg-amber-500/10 text-amber-500': item.type === 'warning',
                  'bg-primary/10 text-primary': item.type === 'info',
                }"
              >
                <CheckCircle2 v-if="item.type === 'success'" class="size-4" />
                <AlertCircle v-else-if="item.type === 'error'" class="size-4" />
                <AlertTriangle v-else-if="item.type === 'warning'" class="size-4" />
                <Info v-else class="size-4" />
              </div>

              <div class="min-w-0 pr-1">
                <div class="text-xs font-bold text-foreground truncate leading-tight">
                  {{ item.title }}
                </div>
                <div v-if="item.description" class="text-[11px] text-muted-foreground truncate mt-0.5">
                  {{ item.description }}
                </div>
              </div>
            </div>

            <button
              type="button"
              class="shrink-0 rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer"
              aria-label="Close"
              @click.stop="remove(item.id)"
            >
              <X class="size-3.5" />
            </button>
          </div>
        </div>
      </TransitionGroup>
    </div>
  </div>
</template>
