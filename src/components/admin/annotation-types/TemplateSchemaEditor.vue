<script setup lang="ts">
import { ref } from 'vue'
import Button from '@/components/ui/Button.vue'
import Input from '@/components/ui/Input.vue'
import { Code2, Wand2, X, ChevronDown, ChevronUp } from 'lucide-vue-next'

const props = defineProps<{
  isXmlMode: boolean
  labelConfig: string
  visualLabels: Array<{ name: string; color: string }>
  activeLabelPresets: Array<{ label: string; items: Array<{ name: string; color: string }> }>
  previewImageUrl: string
  previewDataJson: string
}>()

const emit = defineEmits<{
  (e: 'update:isXmlMode', val: boolean): void
  (e: 'update:labelConfig', val: string): void
  (e: 'update:previewImageUrl', val: string): void
  (e: 'update:previewDataJson', val: string): void
  (e: 'addLabel', label: { name: string; color: string }): void
  (e: 'removeLabel', index: number): void
  (e: 'applyPreset', items: Array<{ name: string; color: string }>): void
}>()

const newLabelName = ref('')
const newLabelColor = ref('#38bdf8')
const showAdvancedSettings = ref(false)

function onAddLabel() {
  const name = newLabelName.value.trim()
  if (!name) return
  emit('addLabel', { name, color: newLabelColor.value })
  newLabelName.value = ''
}
</script>

<template>
  <div class="space-y-4">
    <!-- Default Label Classes -->
    <div class="space-y-3 rounded-2xl bg-muted/30 p-4 border border-border/40 shadow-xs">
      <div class="flex items-center justify-between">
        <div>
          <label class="text-xs font-bold text-foreground">Default Label Classes</label>
          <p class="text-[11px] text-muted-foreground">Categories annotators can assign.</p>
        </div>

        <!-- Presets -->
        <div v-if="activeLabelPresets.length > 0" class="flex flex-wrap items-center gap-1.5">
          <button
            v-for="preset in activeLabelPresets"
            :key="preset.label"
            type="button"
            class="rounded-lg border border-border/60 bg-card px-2 py-0.5 text-[10px] font-semibold text-muted-foreground hover:text-primary hover:border-primary/40 transition-all cursor-pointer"
            @click="emit('applyPreset', preset.items)"
          >
            + {{ preset.label }}
          </button>
        </div>
      </div>

      <!-- Visual Chips List -->
      <div class="flex min-h-9 flex-wrap gap-2 pt-1">
        <div
          v-for="(l, idx) in visualLabels"
          :key="`${l.name}-${idx}`"
          class="flex items-center gap-1.5 rounded-xl bg-card px-2.5 py-1 text-xs font-semibold shadow-2xs border border-border/40 text-foreground"
        >
          <span class="size-2.5 rounded-full" :style="{ backgroundColor: l.color }"></span>
          <span>{{ l.name }}</span>
          <button
            type="button"
            class="text-muted-foreground hover:text-destructive cursor-pointer ml-1"
            title="Remove class"
            @click="emit('removeLabel', idx)"
          >
            <X class="size-3" />
          </button>
        </div>
      </div>

      <!-- Quick Add Class Input -->
      <div class="flex items-center gap-2 pt-1">
        <Input
          v-model="newLabelName"
          class="flex-1 h-9 rounded-xl text-xs"
          placeholder="Type new class name and press Enter..."
          @keyup.enter.prevent="onAddLabel"
        />
        <input
          v-model="newLabelColor"
          type="color"
          class="size-9 cursor-pointer rounded-xl border-0 bg-muted/60 p-0.5 shadow-inner"
          title="Pick class color"
        />
        <Button
          type="button"
          variant="secondary"
          size="sm"
          class="gap-1 rounded-xl h-9 px-3 text-xs cursor-pointer"
          @click="onAddLabel"
        >
          <span>Add</span>
        </Button>
      </div>
    </div>

    <!-- Mode Toggle: Visual vs XML -->
    <div class="flex items-center justify-between border-t border-border/40 pt-3">
      <div class="flex items-center gap-2">
        <Code2 class="size-4 text-primary" />
        <span class="text-xs font-bold text-foreground">Label Studio XML Configuration</span>
      </div>
      <button
        type="button"
        class="text-[11px] font-semibold text-primary hover:underline cursor-pointer"
        @click="emit('update:isXmlMode', !isXmlMode)"
      >
        {{ isXmlMode ? 'Switch to Visual Designer' : 'Edit Raw XML' }}
      </button>
    </div>

    <!-- Raw XML Editor -->
    <div v-if="isXmlMode" class="space-y-1.5">
      <textarea
        :value="labelConfig"
        rows="6"
        placeholder="<View><RectangleLabels.../></View>"
        class="w-full font-mono text-xs leading-relaxed rounded-2xl border border-border/40 bg-zinc-950 p-3.5 text-zinc-200 focus:outline-none focus:ring-2 focus:ring-primary/40 shadow-inner resize-y"
        @input="emit('update:labelConfig', ($event.target as HTMLTextAreaElement).value)"
      ></textarea>
    </div>

    <!-- Advanced Settings Toggle (Preview Image & JSON specs) -->
    <div class="border-t border-border/40 pt-3">
      <button
        type="button"
        class="flex w-full items-center justify-between text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer"
        @click="showAdvancedSettings = !showAdvancedSettings"
      >
        <span>Advanced Template Settings (Preview Image & Mock JSON)</span>
        <ChevronUp v-if="showAdvancedSettings" class="size-3.5" />
        <ChevronDown v-else class="size-3.5" />
      </button>

      <div v-if="showAdvancedSettings" class="mt-3 space-y-3 pl-1">
        <div class="space-y-1">
          <label class="text-[11px] font-semibold text-muted-foreground">Preview Image URL</label>
          <Input
            :model-value="previewImageUrl"
            class="h-8 rounded-xl text-xs"
            placeholder="https://images.unsplash.com/..."
            @input="emit('update:previewImageUrl', ($event.target as HTMLInputElement).value)"
          />
        </div>
        <div class="space-y-1">
          <label class="text-[11px] font-semibold text-muted-foreground">Mock Visualizer Data (JSON)</label>
          <textarea
            :value="previewDataJson"
            rows="3"
            class="w-full font-mono text-[11px] rounded-xl border border-border/40 bg-muted/40 p-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none shadow-inner"
            placeholder='{"type": "BBOX", "boxes": [...]}'
            @input="emit('update:previewDataJson', ($event.target as HTMLTextAreaElement).value)"
          ></textarea>
        </div>
      </div>
    </div>
  </div>
</template>
