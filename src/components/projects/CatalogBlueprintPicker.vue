<script setup lang="ts">
import { ref, computed } from 'vue'
import type { MetadataOption } from '@/api/metadata'
import {
  Sparkles,
  ArrowUp,
  Headphones,
  FileText,
  Image as ImageIcon,
  Video as VideoIcon,
  Check,
  Search,
} from 'lucide-vue-next'
import Input from '@/components/ui/Input.vue'
import Button from '@/components/ui/Button.vue'

const props = defineProps<{
  options: MetadataOption[]
  isLoading: boolean
  selectedCode?: string
  modalityFilter: string
  modalityList: { value: string; label: string }[]
}>()

const emit = defineEmits<{
  (e: 'select', opt: MetadataOption): void
  (e: 'update:modalityFilter', val: string): void
  (e: 'aiPromptSubmit', prompt: string): void
}>()

const searchQuery = ref('')
const aiPrompt = ref('')

const filteredOptions = computed(() => {
  let list = props.options
  if (props.modalityFilter && props.modalityFilter !== 'ALL') {
    list = list.filter((o) => (o as any).modality === props.modalityFilter)
  }
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase().trim()
    list = list.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        o.value.toLowerCase().includes(q) ||
        (o.description || '').toLowerCase().includes(q) ||
        (o.tool_type || '').toLowerCase().includes(q)
    )
  }
  return list
})

function onAiSubmit() {
  if (!aiPrompt.value.trim()) return
  emit('aiPromptSubmit', aiPrompt.value)
}

function parseBadges(badges?: any): string[] {
  if (!badges) return []
  if (Array.isArray(badges)) return badges
  try {
    const parsed = JSON.parse(badges)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return String(badges).split(',').map((s) => s.trim()).filter(Boolean)
  }
}
</script>

<template>
  <div class="space-y-4 w-full">
    <!-- AI Intent Resolver -->
    <div class="rounded-2xl border border-primary/25 bg-primary/5 p-3 sm:p-3.5 space-y-2">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-1.5 text-xs font-bold text-primary font-sans">
          <Sparkles class="size-3.5 animate-pulse text-primary" />
          <span>Describe your project goal, and AI will pick the best blueprint</span>
        </div>
        <span class="text-[10px] font-mono font-semibold text-muted-foreground">AI Engine Matcher</span>
      </div>
      <div class="flex items-center gap-2">
        <Input
          v-model="aiPrompt"
          placeholder="e.g. Detect vehicles with bounding boxes, speech diarization, sentiment..."
          class="h-9 bg-card text-xs border-border/50 rounded-xl"
          @keyup.enter="onAiSubmit"
        />
        <Button
          type="button"
          size="sm"
          class="h-9 shrink-0 gap-1.5 px-3 font-semibold rounded-xl btn-tactile cursor-pointer"
          @click="onAiSubmit"
        >
          <ArrowUp class="size-3.5" />
          <span class="hidden sm:inline">Resolve</span>
        </Button>
      </div>
    </div>

    <!-- Modality Filter Pills & Search -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <!-- Modality Tabs -->
      <div class="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-muted/40 border border-border/40">
        <button
          type="button"
          class="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-all duration-150 cursor-pointer font-sans btn-tactile"
          :class="
            modalityFilter === 'ALL'
              ? 'bg-card text-foreground font-semibold shadow-2xs border border-border/60'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
          "
          @click="emit('update:modalityFilter', 'ALL')"
        >
          All
        </button>

        <button
          v-for="m in modalityList"
          :key="m.value"
          type="button"
          class="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-all duration-150 cursor-pointer font-sans btn-tactile"
          :class="
            modalityFilter === m.value
              ? 'bg-card text-foreground font-semibold shadow-2xs border border-border/60'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
          "
          @click="emit('update:modalityFilter', m.value)"
        >
          <component
            :is="m.value === 'AUDIO' ? Headphones : m.value === 'IMAGE' ? ImageIcon : m.value === 'TEXT' ? FileText : VideoIcon"
            class="size-3"
          />
          <span>{{ m.label }}</span>
        </button>
      </div>

      <!-- Quick Search -->
      <div class="relative w-full sm:w-56">
        <Search class="pointer-events-none absolute left-3 top-2.5 size-3.5 text-muted-foreground" />
        <Input
          v-model="searchQuery"
          placeholder="Filter catalog..."
          class="h-8 pl-8.5 text-xs rounded-xl border-border/50 bg-card"
        />
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4">
      <div v-for="i in 4" :key="i" class="h-28 rounded-2xl border border-border/30 bg-muted/20 animate-pulse"></div>
    </div>

    <!-- Empty Catalog Result -->
    <div
      v-else-if="filteredOptions.length === 0"
      class="p-8 text-center rounded-2xl border border-dashed border-border/60 bg-muted/20 text-xs text-muted-foreground"
    >
      No task blueprints found matching your filter.
    </div>

    <!-- Catalog Blueprints Grid -->
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[50vh] overflow-y-auto pr-1">
      <div
        v-for="opt in filteredOptions"
        :key="opt.value"
        class="group relative flex flex-col justify-between rounded-2xl border p-3.5 transition-all duration-200 cursor-pointer select-none btn-tactile"
        :class="[
          selectedCode === opt.value
            ? 'border-primary/50 bg-card shadow-xs ring-2 ring-primary/25'
            : 'border-border/50 bg-card/70 hover:border-border hover:bg-muted/40 shadow-2xs',
        ]"
        @click="emit('select', opt)"
      >
        <!-- Selection Check Indicator -->
        <div
          v-if="selectedCode === opt.value"
          class="absolute top-3 right-3 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-2xs"
        >
          <Check class="size-3 stroke-[3]" />
        </div>

        <div>
          <div class="flex items-center gap-2 pr-6">
            <span class="text-xs font-bold text-foreground group-hover:text-primary transition-colors font-sans line-clamp-1">
              {{ opt.label }}
            </span>
          </div>

          <div class="flex items-center gap-1.5 mt-1">
            <span class="text-[9.5px] px-1.5 py-0.2 rounded font-mono font-medium bg-muted text-muted-foreground uppercase">
              {{ (opt as any).modality }}
            </span>
            <span
              v-if="opt.tool_type"
              class="rounded px-1.5 py-0.2 font-mono text-[9.5px] font-semibold bg-primary/10 text-primary border border-primary/20"
            >
              {{ opt.tool_type }}
            </span>
          </div>

          <p class="mt-2 text-[11px] text-muted-foreground line-clamp-2 leading-relaxed font-sans">
            {{ opt.description || opt.instructions || 'Interactive dataset annotation blueprint from task catalog.' }}
          </p>
        </div>

        <!-- Badges -->
        <div v-if="parseBadges(opt.badges).length > 0" class="mt-2.5 flex flex-wrap gap-1">
          <span
            v-for="b in parseBadges(opt.badges).slice(0, 3)"
            :key="b"
            class="rounded-md bg-muted/60 px-1.5 py-0.2 text-[9px] font-mono text-muted-foreground"
          >
            {{ b }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
