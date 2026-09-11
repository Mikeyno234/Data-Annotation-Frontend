<script setup lang="ts">
import { computed } from 'vue'
import type { AnnotationType } from '@/types'
import Card from '@/components/ui/Card.vue'
import CardContent from '@/components/ui/CardContent.vue'
import Badge from '@/components/ui/Badge.vue'
import Button from '@/components/ui/Button.vue'
import { Edit2, Trash2, FileText, Headphones, Video as VideoIcon, Image as ImageIcon } from 'lucide-vue-next'

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
  <Card class="group relative flex flex-col justify-between overflow-hidden rounded-lg border border-border bg-card transition-all hover:border-foreground/30 shadow-2xs">
    <div>
      <!-- Thumbnail Header with Preview or Ambient Pattern -->
      <div class="relative h-28 w-full overflow-hidden bg-muted select-none border-b border-border">
        <img
          v-if="item.preview_image_url"
          :src="item.preview_image_url"
          :alt="item.name"
          class="h-full w-full object-cover filter brightness-[0.9] transition-transform duration-300 group-hover:scale-105"
        />
        <div v-else class="flex h-full w-full items-center justify-center bg-muted text-muted-foreground">
          <component :is="modalityIcon" class="size-7" :stroke-width="1.6" />
        </div>

        <!-- Badges Overlay -->
        <div class="absolute top-2 left-2 flex items-center gap-1.5">
          <Badge variant="outline" class="bg-card/90 text-xs capitalize shadow-2xs backdrop-blur-xs">
            <component :is="modalityIcon" class="size-3 mr-1" :stroke-width="1.6" />
            {{ item.modality.toLowerCase() }}
          </Badge>
          <span
            v-if="item.tool_type"
            class="rounded bg-background/90 px-1.5 py-0.5 text-[10px] text-foreground border border-border font-medium"
          >
            {{ item.tool_type }}
          </span>
        </div>

        <div class="absolute top-2 right-2">
          <Badge
            :variant="item.status === 'ACTIVE' ? 'success' : 'secondary'"
            :dot="item.status === 'ACTIVE'"
            class="bg-card/90 backdrop-blur-xs shadow-2xs"
          >
            {{ item.status === 'ACTIVE' ? 'Active' : 'Inactive' }}
          </Badge>
        </div>
      </div>

      <CardContent class="p-4">
        <h3 class="text-xs font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1 tracking-tight">
          {{ formatTemplateName(item.name) }}
        </h3>
        <p class="mt-0.5 text-xs text-muted-foreground line-clamp-2 min-h-7 leading-relaxed">
          {{ item.description || item.instructions || 'Standard schema template for multi-modal data labeling.' }}
        </p>

        <!-- Dynamic Tags / Badges -->
        <div v-if="parsedBadges.length > 0" class="mt-2.5 flex flex-wrap gap-1">
          <span
            v-for="(badge, bIdx) in parsedBadges.slice(0, 3)"
            :key="bIdx"
            class="rounded bg-muted border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground font-medium"
          >
            {{ badge }}
          </span>
        </div>
      </CardContent>
    </div>

    <!-- Actions Bottom Bar -->
    <div class="flex items-center justify-between border-t border-border bg-muted/20 px-3.5 py-2">
      <span class="font-mono text-[10px] text-muted-foreground truncate max-w-[120px]">
        {{ item.code }}
      </span>

      <div class="flex items-center gap-1">
        <Button
          size="sm"
          variant="secondary"
          class="h-6.5 px-2 text-xs font-medium gap-1 rounded cursor-pointer"
          title="Create a new project using this template"
          @click="emit('createProject', item)"
        >
          <span>Use Template</span>
        </Button>

        <Button
          v-if="canUpdate"
          variant="ghost"
          size="sm"
          class="size-6.5 p-0 rounded hover:bg-muted"
          title="Edit Schema"
          @click="emit('edit', item)"
        >
          <Edit2 class="size-3" :stroke-width="1.6" />
        </Button>
        <Button
          v-if="canDelete"
          variant="ghost"
          size="sm"
          class="size-6.5 p-0 rounded hover:bg-destructive/10 hover:text-destructive"
          title="Delete Schema"
          @click="emit('delete', item)"
        >
          <Trash2 class="size-3" :stroke-width="1.6" />
        </Button>
      </div>
    </div>
  </Card>
</template>
