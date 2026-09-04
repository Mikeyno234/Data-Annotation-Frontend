<script setup lang="ts">
import Card from '@/components/ui/Card.vue'
import CardContent from '@/components/ui/CardContent.vue'

const shortcuts = [
  { key: 'Space', desc: 'Play / Pause media playback (Audio & Video)' },
  { key: 'Ctrl + S', desc: 'Save current draft to server' },
  { key: 'Ctrl + Z', desc: 'Undo last annotation region or modification' },
  { key: 'Ctrl + Y', desc: 'Redo undone action' },
  { key: 'Ctrl + Enter', desc: 'Submit completed item and advance' },
  { key: 'Delete / Backspace', desc: 'Remove selected bounding box or segment' },
  { key: '1 - 9', desc: 'Select label class hotkey shortcut' },
  { key: 'Esc', desc: 'Deselect active region or cancel drawing mode' },
]
</script>

<template>
  <Card class="bg-card/90 shadow-sm max-w-2xl">
    <div class="px-6 py-4">
      <h2 class="text-sm font-bold text-foreground">Keyboard Shortcuts</h2>
      <p class="text-xs text-muted-foreground mt-0.5">High-speed hotkeys for expert annotation workflow.</p>
    </div>

    <CardContent class="p-6 pt-2">
      <div class="divide-y divide-border/40 text-xs">
        <div v-for="s in shortcuts" :key="s.key" class="flex items-center justify-between py-3">
          <span class="text-foreground font-medium">{{ s.desc }}</span>
          <kbd class="px-2.5 py-1 rounded-lg bg-muted text-[11px] font-mono font-bold text-foreground border border-border/60 shadow-2xs">
            {{ s.key }}
          </kbd>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
