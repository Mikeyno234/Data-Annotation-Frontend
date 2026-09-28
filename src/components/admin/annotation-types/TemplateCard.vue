<script setup lang="ts">
import { computed } from 'vue'
import type { AnnotationType } from '@/types'
import Badge from '@/components/ui/Badge.vue'
import Button from '@/components/ui/Button.vue'
import { Pencil, Trash2, FileText, Headphones, Video as VideoIcon, Image as ImageIcon } from 'lucide-vue-next'

const props = defineProps<{
  item: AnnotationType
  canUpdate: boolean
  canDelete: boolean
}>()

const emit = defineEmits<{
  (e: 'edit', item: AnnotationType): void
  (e: 'delete', item: AnnotationType): void
  (e: 'createProject', item: AnnotationType): void
}>()

const parsedBadges = computed(() => {
  if (!props.item.badges) return []
  if (Array.isArray(props.item.badges)) return props.item.badges
  try {
    const parsed = JSON.parse(props.item.badges)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return String(props.item.badges).split(',').map((s) => s.trim()).filter(Boolean)
  }
})

const modalityIcon = computed(() => {
  const m = String(props.item.modality || '').toUpperCase()
  if (m === 'AUDIO') return Headphones
  if (m === 'TEXT') return FileText
  if (m === 'VIDEO') return VideoIcon
  return ImageIcon
})

function formatTemplateName(name: string) {
  if (!name) return ''
  return name.replace(/[_-]+/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
}
</script>

<template>
  <div class="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border/80 bg-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-primary/40 shadow-xs">
    <div>
      <!-- Thumbnail Header with Preview or Ambient Pattern -->
      <div class="relative h-28 w-full overflow-hidden bg-muted/60 select-none border-b border-border/70">
        <img
          v-if="item.preview_image_url"
          :src="item.preview_image_url"
          :alt="item.name"
          class="h-full w-full object-cover filter brightness-[0.9] transition-transform duration-300 group-hover:scale-105"
        />
        <div v-else class="flex h-full w-full items-center justify-center bg-muted/40 text-muted-foreground">
          <component :is="modalityIcon" class="size-8 text-muted-foreground/70" :stroke-width="1.6" />
        </div>

        <!-- Badges Overlay -->
        <div class="absolute top-2.5 left-2.5 flex items-center gap-1.5">
          <Badge variant="outline" class="bg-card/90 text-xs capitalize shadow-2xs backdrop-blur-xs rounded-full px-2.5">
            <component :is="modalityIcon" class="size-3 mr-1" :stroke-width="1.8" />
            {{ item.modality.toLowerCase() }}
          </Badge>
          <span
            v-if="item.tool_type"
            class="rounded-full bg-background/90 px-2 py-0.5 text-[10px] text-foreground border border-border font-semibold shadow-2xs"
          >
            {{ item.tool_type }}
          </span>
        </div>

        <div class="absolute top-2.5 right-2.5">
          <Badge
            :variant="item.status === 'ACTIVE' ? 'success' : 'secondary'"
            class="bg-card/90 backdrop-blur-xs shadow-2xs rounded-full text-[10px] px-2.5 font-semibold uppercase"
          >
            {{ item.status === 'ACTIVE' ? 'Active' : 'Inactive' }}
          </Badge>
        </div>
      </div>

      <div class="p-4 space-y-1.5">
        <h3 class="text-xs font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1 tracking-tight">
          {{ formatTemplateName(item.name) }}
        </h3>
        <p class="text-xs text-muted-foreground line-clamp-2 min-h-7 leading-relaxed">
          {{ item.description || item.instructions || 'Standard schema template for multi-modal data labeling.' }}
        </p>

        <!-- Dynamic Tags / Badges -->
        <div v-if="parsedBadges.length > 0" class="pt-1 flex flex-wrap gap-1">
          <span
            v-for="(badge, bIdx) in parsedBadges.slice(0, 3)"
            :key="bIdx"
            class="rounded-full bg-muted border border-border/70 px-2 py-0.5 text-[10px] text-muted-foreground font-medium"
          >
            {{ badge }}
          </span>
        </div>
      </div>
    </div>

    <!-- Actions Bottom Bar -->
    <div class="flex items-center justify-between border-t border-border/70 bg-muted/20 px-4 py-2.5">
      <span class="font-mono text-[10px] text-muted-foreground truncate max-w-[120px]">
        {{ item.code }}
      </span>

      <div class="flex items-center gap-1.5 shrink-0">
        <Button
          size="sm"
          variant="outline"
          class="h-7 px-2.5 text-xs font-semibold gap-1 rounded-lg border-primary/40 text-primary hover:bg-primary/10 shadow-2xs"
          title="Create a new project using this template"
          @click="emit('createProject', item)"
        >
          <span>Use Template</span>
        </Button>

        <button
          v-if="canUpdate"
          type="button"
          class="size-7 rounded-lg border border-border/80 bg-card hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
          title="Edit Schema"
          @click.stop="emit('edit', item)"
        >
          <Pencil class="size-3.5" :stroke-width="1.8" />
        </button>
        <button
          v-if="canDelete"
          type="button"
          class="size-7 rounded-lg border border-border/80 bg-card hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 text-muted-foreground flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
          title="Delete Schema"
          @click.stop="emit('delete', item)"
        >
          <Trash2 class="size-3.5" :stroke-width="1.8" />
        </button>
      </div>
    </div>
  </div>
</template>
