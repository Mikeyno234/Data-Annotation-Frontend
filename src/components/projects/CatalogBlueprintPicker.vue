<script setup lang="ts">
import { ref, computed } from 'vue'
import type { MetadataOption } from '@/api/metadata'
import {
  Headphones,
  FileText,
  Image as ImageIcon,
  Video as VideoIcon,
  Check,
  Search,
  Layers,
  Sparkles,
  ArrowUpRight,
} from 'lucide-vue-next'
import Input from '@/components/ui/Input.vue'

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
}>()

const searchQuery = ref('')

const modalityTabs = computed(() => {
  return [
    { value: 'ALL', label: 'All Modalities', icon: Layers },
    { value: 'IMAGE', label: 'Image & Vision', icon: ImageIcon },
    { value: 'AUDIO', label: 'Audio & Speech', icon: Headphones },
    { value: 'TEXT', label: 'Text & NLP', icon: FileText },
    { value: 'VIDEO', label: 'Video Streams', icon: VideoIcon },
  ]
})

const filteredOptions = computed(() => {
  let list = props.options
  if (props.modalityFilter && props.modalityFilter !== 'ALL') {
    list = list.filter((o) => (o.modality || '').toUpperCase() === props.modalityFilter.toUpperCase())
  }
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase().trim()
    list = list.filter(
      (o) =>
        (o.label || '').toLowerCase().includes(q) ||
        (o.value || '').toLowerCase().includes(q) ||
        (o.description || '').toLowerCase().includes(q) ||
        (o.tool_type || '').toLowerCase().includes(q) ||
        (o.instructions || '').toLowerCase().includes(q)
    )
  }
  return list
})

function getModalityIcon(m?: string) {
  const norm = (m || '').toUpperCase()
  if (norm === 'AUDIO') return Headphones
  if (norm === 'TEXT') return FileText
  if (norm === 'VIDEO') return VideoIcon
  return ImageIcon
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
  <div class="space-y-4 w-full select-none">
    <!-- Top Bar: Modality Tabs & Search Filter (Vercel Segments) -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-muted/25 p-1.5 rounded-2xl border border-border/50">
      <!-- Modality Tab Switcher -->
      <div class="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
        <button
          v-for="tab in modalityTabs"
          :key="tab.value"
          type="button"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold tracking-tight transition-all duration-150 cursor-pointer whitespace-nowrap"
          :class="
            modalityFilter === tab.value
              ? 'bg-background text-foreground shadow-xs border border-border/70 font-bold'
              : 'text-muted-foreground hover:text-foreground hover:bg-background/40'
          "
          @click="emit('update:modalityFilter', tab.value)"
        >
          <component :is="tab.icon" class="size-3.5" :class="modalityFilter === tab.value ? 'text-primary' : 'opacity-70'" />
          <span>{{ tab.label }}</span>
        </button>
      </div>

      <!-- Live Count & Search Bar -->
      <div class="relative min-w-[240px] sm:w-72">
        <Search class="pointer-events-none absolute left-3 top-2.5 size-3.5 text-muted-foreground/70" />
        <Input
          v-model="searchQuery"
          placeholder="Filter blueprints..."
          class="h-8.5 pl-8.5 text-xs rounded-xl bg-background border-border/60 focus:border-primary/50"
        />
        <span
          v-if="searchQuery"
          class="absolute right-2.5 top-2 text-[10px] font-mono text-muted-foreground cursor-pointer hover:text-foreground"
          @click="searchQuery = ''"
        >
          ✕
        </span>
      </div>
    </div>

    <!-- Loading Skeletons -->
    <div v-if="isLoading" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 p-1">
      <div
        v-for="i in 6"
        :key="i"
        class="h-44 rounded-2xl border border-border/40 bg-card/40 animate-pulse flex flex-col justify-between p-4"
      >
        <div class="space-y-2">
          <div class="h-4 w-28 bg-muted/60 rounded"></div>
          <div class="h-3 w-full bg-muted/40 rounded"></div>
        </div>
        <div class="h-6 w-16 bg-muted/30 rounded"></div>
      </div>
    </div>

    <!-- Empty Catalog Result -->
    <div
      v-else-if="filteredOptions.length === 0"
      class="py-14 text-center rounded-2xl border border-dashed border-border/70 bg-card/30 flex flex-col items-center justify-center space-y-2"
    >
      <div class="flex size-10 items-center justify-center rounded-xl bg-muted/40 text-muted-foreground border border-border/40">
        <Layers class="size-5" />
      </div>
      <p class="text-xs font-semibold text-foreground">No blueprints match your filter</p>
      <p class="text-[11px] text-muted-foreground max-w-xs">
        Try switching the modality tab or clearing the search query to view all available schemas.
      </p>
      <button
        type="button"
        class="mt-2 text-xs text-primary font-semibold hover:underline cursor-pointer"
        @click="searchQuery = ''; emit('update:modalityFilter', 'ALL')"
      >
        Reset Filters
      </button>
    </div>

    <!-- Vercel-Grade Interactive Blueprint Cards Grid -->
    <div
      v-else
      class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-[54vh] overflow-y-auto pr-1 pb-1 scrollbar-thin"
    >
      <div
        v-for="opt in filteredOptions"
        :key="opt.value"
        class="group relative flex flex-col justify-between overflow-hidden rounded-2xl border bg-card/80 p-4 transition-all duration-200 cursor-pointer hover:border-foreground/25 hover:shadow-sm"
        :class="[
          selectedCode === opt.value
            ? 'border-primary bg-primary/[0.03] ring-2 ring-primary/20 shadow-xs'
            : 'border-border/60 hover:bg-card',
        ]"
        @click="emit('select', opt)"
      >
        <!-- Top Visual Header -->
        <div>
          <div class="flex items-start justify-between gap-2">
            <!-- Modality & Tool Indicators -->
            <div class="flex items-center gap-1.5 flex-wrap">
              <span
                class="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider border"
                :class="
                  selectedCode === opt.value
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-muted/70 text-foreground border-border/60'
                "
              >
                <component :is="getModalityIcon(opt.modality)" class="size-3" />
                {{ opt.modality || 'MULTI' }}
              </span>

              <span
                v-if="opt.tool_type"
                class="px-2 py-0.5 rounded-lg text-[10px] font-mono font-semibold bg-muted/40 text-muted-foreground border border-border/40"
              >
                {{ opt.tool_type }}
              </span>
            </div>

            <!-- Selection Indicator -->
            <div
              class="flex size-5 shrink-0 items-center justify-center rounded-full transition-all duration-150"
              :class="
                selectedCode === opt.value
                  ? 'bg-primary text-primary-foreground scale-105 shadow-2xs'
                  : 'border border-border/60 bg-muted/20 text-transparent group-hover:border-foreground/30'
              "
            >
              <Check class="size-3 stroke-[3]" />
            </div>
          </div>

          <!-- Title & Description -->
          <div class="mt-3">
            <h4
              class="text-xs font-bold tracking-tight text-foreground transition-colors group-hover:text-primary line-clamp-1"
            >
              {{ opt.label }}
            </h4>
            <p class="mt-1 text-[11px] leading-relaxed text-muted-foreground line-clamp-2 min-h-8">
              {{ opt.description || opt.instructions || 'Standard multi-modal annotation blueprint configuration.' }}
            </p>
          </div>
        </div>

        <!-- Card Footer: Badges & Select CTA -->
        <div class="mt-4 pt-3 border-t border-border/40 flex items-center justify-between gap-2">
          <div class="flex items-center gap-1 overflow-hidden flex-wrap max-h-5">
            <span
              v-for="b in parseBadges(opt.badges).slice(0, 2)"
              :key="b"
              class="rounded-md bg-muted/60 px-1.5 py-0.5 text-[9px] font-mono text-muted-foreground truncate max-w-[110px]"
            >
              {{ b }}
            </span>
          </div>

          <div
            class="inline-flex items-center gap-1 text-[10.5px] font-bold transition-transform duration-150 group-hover:translate-x-0.5"
            :class="selectedCode === opt.value ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'"
          >
            <span>{{ selectedCode === opt.value ? 'Active' : 'Choose' }}</span>
            <ArrowUpRight class="size-3" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

