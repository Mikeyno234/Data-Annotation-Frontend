<script setup lang="ts">
import type { AudioSegment } from '@/types'
import Badge from '@/components/ui/Badge.vue'
import Button from '@/components/ui/Button.vue'
import { Play, Trash2 } from 'lucide-vue-next'

const props = defineProps<{
  segments: AudioSegment[]
  availableSpeakers: { name: string; color?: string }[]
  selectedSegmentId: string | null
  hasPrelabel: boolean
}>()

const emit = defineEmits<{
  (e: 'selectSegment', seg: AudioSegment): void
  (e: 'deleteSegment', id: string): void
  (e: 'playRegion', seg: AudioSegment): void
  (e: 'stateChanged'): void
}>()

function getSpeakerColor(speakerName: string): string {
  const found = props.availableSpeakers.find((s) => s.name === speakerName)
  return found?.color || '#a855f7'
}
</script>

<template>
  <div class="flex flex-col gap-3">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <h3 class="text-xs font-semibold text-foreground">
          Diarization Segments ({{ segments.length }})
        </h3>
        <Badge v-if="hasPrelabel" variant="secondary" class="text-[10px]">
          Pre-annotated
        </Badge>
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-if="segments.length === 0"
      class="rounded-xl border border-border/50 bg-muted/20 p-6 text-center text-xs text-muted-foreground"
    >
      No audio segments yet. Click <kbd class="px-1 py-0.2 rounded bg-muted font-mono font-semibold text-foreground text-[10px]">Add Segment</kbd> or press <kbd class="px-1 py-0.2 rounded bg-muted font-mono font-semibold text-foreground text-[10px]">N</kbd> while listening.
    </div>

    <div v-else class="grid grid-cols-1 gap-3 max-h-[50vh] overflow-y-auto pr-1">
      <div
        v-for="seg in segments"
        :key="seg.id"
        class="rounded-xl p-4 transition-all shadow-2xs cursor-pointer border"
        :style="selectedSegmentId === seg.id ? {
          borderColor: getSpeakerColor(seg.speaker),
          backgroundColor: `${getSpeakerColor(seg.speaker)}14`
        } : {}"
        :class="[
          selectedSegmentId === seg.id
            ? 'ring-1 font-semibold'
            : 'bg-card border-border/60 hover:bg-muted/40 hover:border-border hover:shadow-xs',
        ]"
        @click="emit('selectSegment', seg)"
      >
        <div class="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-border/40">
          <div class="flex items-center gap-2.5">
            <span
              class="size-2.5 rounded-full shrink-0 shadow-2xs"
              :style="{ backgroundColor: getSpeakerColor(seg.speaker) }"
            />
            <select
              v-model="seg.speaker"
              class="h-7 rounded-lg border border-border/60 bg-muted/60 px-2 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              @change="seg.label = seg.speaker; emit('stateChanged')"
            >
              <option v-for="spk in availableSpeakers" :key="spk.name" :value="spk.name">
                {{ spk.name }}
              </option>
            </select>

            <span class="text-xs font-semibold tabular-nums" :style="{ color: getSpeakerColor(seg.speaker) }">
              {{ seg.start.toFixed(2) }}s - {{ seg.end.toFixed(2) }}s
            </span>

            <span class="text-[10px] text-muted-foreground tabular-nums">
              ({{ (seg.end - seg.start).toFixed(2) }}s)
            </span>

            <Badge v-if="seg.confidence" variant="outline" class="text-[10px] tabular-nums">
              {{ Math.round(seg.confidence * 100) }}% confidence
            </Badge>
          </div>

          <div class="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="sm"
              class="h-7 px-2.5 rounded-lg text-xs text-muted-foreground hover:text-foreground gap-1"
              @click.stop="emit('playRegion', seg)"
            >
              <Play class="size-3 fill-current text-primary" />
              <span>Play</span>
            </Button>

            <Button
              variant="ghost"
              size="icon"
              class="size-7 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              title="Delete Segment [Delete]"
              @click.stop="emit('deleteSegment', seg.id)"
            >
              <Trash2 class="size-3.5" />
            </Button>
          </div>
        </div>

        <!-- Verbatim Transcript Input -->
        <div class="mt-2.5">
          <textarea
            v-model="seg.transcript"
            rows="2"
            placeholder="Input transcribed text for this audio segment..."
            class="w-full rounded-lg border border-border/50 bg-background/70 p-2.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:bg-background focus:outline-none focus:ring-1 focus:ring-primary/40 transition-all resize-none"
            @input="emit('stateChanged')"
          ></textarea>
        </div>
      </div>
    </div>
  </div>
</template>
