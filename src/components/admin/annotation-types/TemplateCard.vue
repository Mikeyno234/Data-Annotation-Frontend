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
</script>

<template>
  <Card class="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border/60 bg-card/95 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-md">
    <div>
      <!-- Thumbnail Header with Preview or Ambient Pattern -->
      <div class="relative h-32 w-full overflow-hidden bg-muted/40 select-none border-b border-border/40">
        <img
          v-if="item.preview_image_url"
          :src="item.preview_image_url"
          :alt="item.name"
          class="h-full w-full object-cover filter brightness-[0.9] transition-transform duration-500 group-hover:scale-105"
        />
        <div v-else class="flex h-full w-full items-center justify-center bg-muted/30 text-muted-foreground/40">
          <component :is="modalityIcon" class="size-9" />
        </div>

        <!-- Badges Overlay -->
        <div class="absolute top-2.5 left-2.5 flex items-center gap-1.5">
          <Badge variant="outline" class="bg-card/90 backdrop-blur-md text-[10px] font-bold shadow-2xs">
            <component :is="modalityIcon" class="size-3 mr-1" />
            {{ item.modality }}
          </Badge>
          <span
            v-if="item.tool_type"
            class="rounded-md bg-zinc-950/80 px-2 py-0.5 font-mono text-[9px] font-semibold text-white/90 backdrop-blur-md border border-white/10"
          >
            {{ item.tool_type }}
          </span>
        </div>

        <div class="absolute top-2.5 right-2.5">
          <Badge
            :variant="item.status === 'ACTIVE' ? 'success' : 'outline'"
            :dot="item.status === 'ACTIVE'"
            class="text-[9px] font-bold tracking-wider uppercase backdrop-blur-md"
          >
            {{ item.status }}
          </Badge>
        </div>
      </div>

      <CardContent class="p-5">
        <h3 class="text-sm font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1 tracking-tight">
          {{ item.name }}
        </h3>
        <p class="mt-1 text-xs leading-relaxed text-muted-foreground line-clamp-2 min-h-8">
          {{ item.description || item.instructions || 'Standard schema template for multi-modal data labeling.' }}
        </p>

        <!-- Dynamic Tags / Badges -->
        <div v-if="parsedBadges.length > 0" class="mt-3 flex flex-wrap gap-1.5">
          <span
            v-for="(badge, bIdx) in parsedBadges.slice(0, 3)"
            :key="bIdx"
            class="rounded-md bg-muted/60 border border-border/40 px-2 py-0.5 text-[10px] font-mono text-muted-foreground"
          >
            {{ badge }}
          </span>
        </div>
      </CardContent>
    </div>

    <!-- Actions Bottom Bar -->
    <div class="flex items-center justify-between border-t border-border/40 bg-muted/15 px-5 py-2.5">
      <span class="font-mono text-[10px] text-muted-foreground truncate max-w-[120px]">
        {{ item.code }}
      </span>

      <div class="flex items-center gap-1.5">
        <Button
          size="sm"
          variant="secondary"
          class="h-7.5 px-2.5 text-[11px] font-semibold gap-1 rounded-xl btn-tactile cursor-pointer bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
          title="Create a new project using this blueprint"
          @click="emit('createProject', item)"
        >
          <span>Use Blueprint</span>
        </Button>

        <Button
          v-if="canUpdate"
          variant="ghost"
          size="sm"
          class="size-7.5 p-0 rounded-xl hover:bg-primary/10 hover:text-primary"
          title="Edit Schema"
          @click="emit('edit', item)"
        >
          <Edit2 class="size-3.5" />
        </Button>
        <Button
          v-if="canDelete"
          variant="ghost"
          size="sm"
          class="size-7.5 p-0 rounded-xl hover:bg-destructive/10 hover:text-destructive"
          title="Delete Schema"
          @click="emit('delete', item)"
        >
          <Trash2 class="size-3.5" />
        </Button>
      </div>
    </div>
  </Card>
</template>
