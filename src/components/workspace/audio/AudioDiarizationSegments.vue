<script setup lang="ts">
import type { AudioSegment, LabelOption } from '@/types'
import Badge from '@/components/ui/Badge.vue'
import Button from '@/components/ui/Button.vue'
import { Play, Trash2, Sparkles } from 'lucide-vue-next'

defineProps<{
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
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <h3 class="text-sm font-bold uppercase tracking-wider text-muted-foreground font-mono">
          Diarization Segments & Transcripts ({{ segments.length }})
        </h3>
        <Badge v-if="hasPrelabel" variant="secondary" class="gap-1 text-[10px]">
          <Sparkles class="size-3" />
          Pre-annotated
        </Badge>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-3.5">
      <div
        v-for="seg in segments"
        :key="seg.id"
        class="rounded-2xl p-5 transition-all shadow-sm cursor-pointer"
        :class="[
          selectedSegmentId === seg.id
            ? 'bg-primary/10 ring-2 ring-primary/40'
            : 'bg-card/90 hover:bg-card hover:shadow-md',
        ]"
        @click="emit('selectSegment', seg)"
      >
        <div class="flex flex-wrap items-center justify-between gap-2 pb-3">
          <div class="flex items-center gap-3">
            <select
              v-model="seg.speaker"
              class="h-8 rounded-xl border-0 bg-muted/70 px-2.5 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 shadow-inner"
              @change="seg.label = seg.speaker; emit('stateChanged')"
            >
              <option v-for="spk in availableSpeakers" :key="spk.name" :value="spk.name">
                {{ spk.name }}
              </option>
            </select>

            <span class="font-mono text-xs font-semibold text-primary">
              [{{ seg.start.toFixed(2) }}s → {{ seg.end.toFixed(2) }}s]
            </span>

            <span class="text-[11px] text-muted-foreground font-mono">
              Duration: {{ (seg.end - seg.start).toFixed(2) }}s
            </span>

            <Badge v-if="seg.confidence" variant="success" class="text-[10px]">
              {{ (seg.confidence * 100).toFixed(0) }}% conf
            </Badge>
          </div>

          <div class="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              class="h-8 px-3 rounded-xl text-xs text-muted-foreground hover:text-foreground"
              @click.stop="emit('playRegion', seg)"
            >
              <Play class="size-3 fill-current mr-1 text-primary" />
              Play Region
            </Button>

            <Button
              variant="ghost"
              size="icon"
              class="size-8 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              @click.stop="emit('deleteSegment', seg.id)"
            >
              <Trash2 class="size-3.5" />
            </Button>
          </div>
        </div>

        <!-- Verbatim Transcript Input -->
        <div class="mt-3">
          <label class="block text-[11px] font-semibold text-muted-foreground mb-1.5">Verbatim Transcript</label>
          <textarea
            v-model="seg.transcript"
            rows="2"
            placeholder="Input transcribed text for this audio segment..."
            class="w-full rounded-xl border-0 bg-muted/60 p-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:bg-card focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all resize-none shadow-inner"
            @input="emit('stateChanged')"
          ></textarea>
        </div>
      </div>
    </div>
  </div>
</template>
