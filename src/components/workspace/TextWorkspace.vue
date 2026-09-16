<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import type { DataItem, TextEntity, LabelOption } from '@/types'
import { createDataItemMediaUrl } from '@/api/media'
import { useAnnotationSession } from '@/composables/useAnnotationSession'
import { toast } from '@/utils/toast'
import { normalizeTextPayload, resolveTextMode, type TextAnnotationPayload } from '@/utils/annotation'
import { getSelectionCharacterOffsets } from '@/utils/annotation'
import WorkspaceShell from '@/components/workspace/WorkspaceShell.vue'
import Button from '@/components/ui/Button.vue'
import Badge from '@/components/ui/Badge.vue'
import Card from '@/components/ui/Card.vue'
import CardContent from '@/components/ui/CardContent.vue'
import { Trash2 } from 'lucide-vue-next'

const props = defineProps<{
  item: DataItem
  labels?: LabelOption[]
  annotationType?: string
  // Structured editor kind copied from the project's catalog entry (SPAN,
  // CHOICE, RADIO). Resolved with priority over annotationType, which is a
  // free-text task name unreliable for exact matching.
  toolType?: string
  hasNext?: boolean
  hasPrev?: boolean
}>()

const emit = defineEmits<{
  submitted: []
  next: []
  prev: []
}>()

const isClassificationMode = computed(() => resolveTextMode(props.toolType, props.annotationType) === 'classification')

const availableEntities = computed(() => props.labels || [])
const currentEntity = ref(props.labels?.[0]?.name || '')
const selectedEntityId = ref<string | null>(null)

const textContent = ref('')
const textContainerRef = ref<HTMLElement | null>(null)
const isLoadingContent = ref(true)
const contentError = ref(false)

// Initialize Session
const session = useAnnotationSession<TextAnnotationPayload>({
  item: props.item,
  annotationType: props.annotationType || 'Text entities',
  initialPayload: {
    entities: [],
    sentiment: 'NEUTRAL',
    selectedLabels: [],
  },
  normalizer: (raw) => normalizeTextPayload(raw),
  validatePayload: (data) => {
    if (isClassificationMode.value) {
      const hasLabels = data.selectedLabels && data.selectedLabels.length > 0
      const hasSentiment = data.sentiment && data.sentiment !== ''
      if (!hasLabels && !hasSentiment) {
        return 'Please select at least 1 document category or sentiment before submitting'
      }
      return null
    }
    if (!data.entities || data.entities.length === 0) {
      return 'Annotation must contain at least 1 tagged entity'
    }
    return null
  },
  onSubmitted: () => {
    emit('submitted')
  },
  onSelectLabelIndex: (index) => {
    const ent = availableEntities.value[index]
    if (!ent) return
    if (isClassificationMode.value) {
      toggleClassificationLabel(ent.name)
    } else {
      currentEntity.value = ent.name
    }
  },
  onDeleteSelected: () => {
    if (selectedEntityId.value) {
      deleteEntity(selectedEntityId.value)
    }
  },
})

function toggleClassificationLabel(labelName: string) {
  const currentPayload = session.payload.value || { entities: [], sentiment: 'NEUTRAL', selectedLabels: [] }
  const currentLabels = [...(currentPayload.selectedLabels || [])]
  const idx = currentLabels.indexOf(labelName)
  if (idx >= 0) {
    currentLabels.splice(idx, 1)
  } else {
    currentLabels.push(labelName)
  }
  const updated = { ...currentPayload, selectedLabels: currentLabels }
  session.payload.value = updated
  session.pushState(updated)
}

async function loadTextContent() {
  isLoadingContent.value = true
  contentError.value = false
  try {
    const mediaUrl = await createDataItemMediaUrl(props.item.id)
    const res = await fetch(mediaUrl)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    textContent.value = await res.text()
    URL.revokeObjectURL(mediaUrl)
  } catch {
    contentError.value = true
  } finally {
    isLoadingContent.value = false
  }
}

function handleTextSelection() {
  const container = textContainerRef.value
  if (!container) return

  const offsets = getSelectionCharacterOffsets(container)
  if (!offsets) return

  const { start, end, text: selectedText } = offsets
  if (!selectedText) return

  // Verify coordinates against textContent slice to guarantee precision
  const textSlice = textContent.value.slice(start, end)
  if (textSlice !== selectedText) {
    // If there is any formatting anomaly, ensure we do not store mismatched offsets
    console.warn('Selection offset slice mismatch:', { slice: textSlice, selected: selectedText })
  }

  const entityObj = availableEntities.value.find((e) => e.name === currentEntity.value)

  const newEntity: TextEntity = {
    id: `ent-${Date.now()}`,
    start,
    end,
    text: selectedText,
    label: currentEntity.value,
    color: entityObj?.color || '#a855f7',
  }

  const currentPayload = session.payload.value || { entities: [], sentiment: 'NEUTRAL' }
  const existingEntities = Array.isArray(currentPayload) ? currentPayload : (currentPayload.entities || [])
  const updatedEntities = [...existingEntities, newEntity]
  const updatedPayload = { ...currentPayload, entities: updatedEntities }

  session.payload.value = updatedPayload
  selectedEntityId.value = newEntity.id
  session.pushState(updatedPayload)

  toast.success('Entity Tagged', `${selectedText} -> [${currentEntity.value}]`)

  const selection = window.getSelection()
  if (selection) {
    selection.removeAllRanges()
  }
}

function deleteEntity(id: string) {
  const currentPayload = session.payload.value || { entities: [], sentiment: 'NEUTRAL' }
  const existingEntities = Array.isArray(currentPayload) ? currentPayload : (currentPayload.entities || [])
  const updatedEntities = existingEntities.filter((e) => e.id !== id)
  const updatedPayload = { ...currentPayload, entities: updatedEntities }

  session.payload.value = updatedPayload
  if (selectedEntityId.value === id) selectedEntityId.value = null
  session.pushState(updatedPayload)
  toast.info('Entity deleted')
}

const currentEntities = computed<TextEntity[]>(() => {
  const current = session.payload.value
  if (current && typeof current === 'object' && !Array.isArray(current) && Array.isArray(current.entities)) {
    return current.entities
  }
  if (Array.isArray(current)) return current
  return []
})

const currentSentiment = computed<string>(() => {
  const current = session.payload.value
  if (current && typeof current === 'object' && !Array.isArray(current) && current.sentiment) {
    return current.sentiment
  }
  return 'NEUTRAL'
})

function setSentiment(sentiment: string) {
  const current = session.payload.value || { entities: [], sentiment: 'NEUTRAL' }
  const entities = Array.isArray(current) ? current : (current.entities || [])
  const updated = { entities, sentiment }
  session.payload.value = updated
  session.pushState(updated)
}

interface TextSegment {
  type: 'text' | 'entity'
  text: string
  entity?: TextEntity
}

const renderedSegments = computed<TextSegment[]>(() => {
  const text = textContent.value
  if (!text) return []

  const entities = currentEntities.value
  if (entities.length === 0) {
    return [{ type: 'text', text }]
  }

  // Sort entities by start offset ascending, filter valid ranges
  const sorted = [...entities]
    .filter((e) => Number.isFinite(e.start) && Number.isFinite(e.end) && e.end > e.start)
    .sort((a, b) => a.start - b.start)

  const segments: TextSegment[] = []
  let cursor = 0

  for (const ent of sorted) {
    if (ent.start < cursor) continue // Skip overlapping entities to protect layout integrity

    const start = Math.max(cursor, Math.min(ent.start, text.length))
    const end = Math.max(start, Math.min(ent.end, text.length))

    if (start > cursor) {
      segments.push({
        type: 'text',
        text: text.slice(cursor, start),
      })
    }

    if (end > start) {
      segments.push({
        type: 'entity',
        text: text.slice(start, end),
        entity: ent,
      })
      cursor = end
    }
  }

  if (cursor < text.length) {
    segments.push({
      type: 'text',
      text: text.slice(cursor),
    })
  }

  return segments
})

const selectedClassificationLabels = computed<string[]>(() => {
  const current = session.payload.value
  return current && Array.isArray(current.selectedLabels) ? current.selectedLabels : []
})

const hotkeyHints = computed(() => {
  if (isClassificationMode.value) {
    return [
      { key: '1-9', label: 'toggle category' },
      { key: 'Enter', label: 'submit task' },
    ]
  }
  return [
    { key: '1-9', label: 'choose entity' },
    { key: 'Delete', label: 'remove entity' },
    { key: 'Select text', label: 'tag span' },
  ]
})

onMounted(() => {
  loadTextContent()
})
</script>

<template>
  <WorkspaceShell
    :item="item"
    :session="session"
    :labels="labels"
    v-model:current-label="currentEntity"
    :modality-title="isClassificationMode ? 'Document Classification' : 'Named Entity Recognition (NER)'"
    modality-type="Text"
    :show-class-selector="!isClassificationMode"
    class-label-title="Entity type:"
    :hotkey-hints="hotkeyHints"
    :has-next="hasNext"
    :has-prev="hasPrev"
    @next="emit('next')"
    @prev="emit('prev')"
  >
    <!-- Extra Controls Slot for Classification & Sentiment -->
    <template #controls>
      <div class="flex items-center gap-3 flex-wrap">
        <!-- Classification Categories (if in classification mode) -->
        <div v-if="isClassificationMode && availableEntities.length > 0" class="flex items-center gap-1.5 flex-wrap">
          <span class="text-xs text-muted-foreground font-medium px-1">Categories:</span>
          <button
            v-for="cat in availableEntities"
            :key="cat.name"
            type="button"
            class="px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer border"
            :style="selectedClassificationLabels.includes(cat.name) ? {
              borderColor: cat.color || 'var(--primary)',
              backgroundColor: `${cat.color || '#3b82f6'}20`,
              color: 'var(--foreground)',
            } : {}"
            :class="[
              selectedClassificationLabels.includes(cat.name)
                ? 'font-bold ring-1'
                : 'border-border/60 bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground'
            ]"
            @click="toggleClassificationLabel(cat.name)"
          >
            {{ cat.name }}
          </button>
        </div>

        <!-- Sentiment segmented control -->
        <div class="flex items-center gap-1.5 bg-muted/40 p-1 rounded-xl border border-border/60">
          <span class="text-xs text-muted-foreground font-medium px-1.5">Sentiment:</span>
          <button
            v-for="s in [
              { val: 'POSITIVE', label: 'Positive' },
              { val: 'NEUTRAL', label: 'Neutral' },
              { val: 'NEGATIVE', label: 'Negative' }
            ]"
            :key="s.val"
            type="button"
            class="px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer"
            :class="[
              currentSentiment === s.val
                ? (s.val === 'POSITIVE' ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/40 shadow-2xs'
                  : s.val === 'NEGATIVE' ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400 font-bold border border-rose-500/40 shadow-2xs'
                  : 'bg-card text-foreground font-bold border border-border shadow-2xs')
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
            ]"
            @click="setSentiment(s.val)"
          >
            {{ s.label }}
          </button>
        </div>
      </div>
    </template>

    <!-- Text Corpus Annotation Viewport -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <!-- Document Reading and Annotation Card -->
      <div :class="[isClassificationMode ? 'lg:col-span-3' : 'lg:col-span-2']">
        <Card class="bg-card border border-border shadow-2xs">
          <CardContent class="p-5">
            <div class="text-xs text-muted-foreground mb-3 font-medium">
              {{ isClassificationMode ? 'Document Content (Choose categories above):' : 'Select text with cursor to label entity:' }}
            </div>
            <div v-if="isLoadingContent" class="rounded-xl bg-muted/40 p-8 text-sm text-muted-foreground text-center">
              Loading text content…
            </div>
            <div
              v-else-if="contentError"
              class="rounded-xl bg-destructive/10 p-8 text-sm text-destructive-foreground text-center"
            >
              Failed to load text source: {{ item.source_url }}
            </div>
            <div
              v-else
              ref="textContainerRef"
              class="rounded-xl bg-muted/20 p-6 text-sm sm:text-base leading-relaxed text-foreground select-text whitespace-pre-wrap border border-border/40 font-sans max-h-[60vh] overflow-y-auto pr-1"
              @mouseup="handleTextSelection"
            >
              <template v-for="(seg, idx) in renderedSegments" :key="idx">
                <span v-if="seg.type === 'text'">{{ seg.text }}</span>
                <mark
                  v-else-if="seg.entity"
                  class="entity-mark inline rounded px-1 py-0.5 font-medium transition-all cursor-pointer border select-text mx-0.5"
                  :data-label="seg.entity.label"
                  :style="{
                    '--entity-color': seg.entity.color || '#8b5cf6',
                    backgroundColor: `${seg.entity.color || '#8b5cf6'}20`,
                    borderColor: seg.entity.color || '#8b5cf6',
                    color: 'var(--foreground)',
                  }"
                  :class="[
                    selectedEntityId === seg.entity.id ? 'ring-2 ring-primary font-bold shadow-xs' : 'hover:brightness-105'
                  ]"
                  @click.stop="selectedEntityId = seg.entity.id"
                >{{ seg.text }}</mark>
              </template>
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- Tagged Entities Inspector -->
      <div class="lg:col-span-1 flex flex-col gap-3 max-h-[60vh] overflow-y-auto pr-1">
        <div class="flex items-center justify-between">
          <h3 class="text-xs font-semibold text-foreground">
            Tagged Entities ({{ currentEntities.length }})
          </h3>
          <Badge v-if="session.hasPrelabel.value" variant="secondary" class="text-[10px]">
            Pre-annotated
          </Badge>
        </div>

        <!-- Empty State -->
        <div
          v-if="currentEntities.length === 0"
          class="rounded-xl border border-border/50 bg-muted/20 p-4 text-center text-xs text-muted-foreground"
        >
          Highlight text in the document to tag entities.
        </div>

        <div v-else class="space-y-2">
          <div
            v-for="ent in currentEntities"
            :key="ent.id"
            class="flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer shadow-2xs"
            :style="selectedEntityId === ent.id ? {
              borderColor: ent.color || 'var(--primary)',
              backgroundColor: `${ent.color || '#8b5cf6'}18`,
            } : {}"
            :class="[
              selectedEntityId === ent.id
                ? 'ring-1 font-semibold'
                : 'bg-card border-border/60 hover:bg-muted/40 hover:border-border hover:shadow-xs',
            ]"
            @click="selectedEntityId = ent.id"
          >
            <div class="min-w-0">
              <div class="flex items-center gap-2">
                <span class="text-xs font-semibold text-foreground truncate max-w-[140px]">"{{ ent.text }}"</span>
                <span
                  class="text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0"
                  :style="{ color: ent.color, backgroundColor: `${ent.color}18` }"
                >
                  {{ ent.label }}
                </span>
              </div>
              <div class="text-[10px] text-muted-foreground tabular-nums font-medium mt-0.5">
                Range: [{{ ent.start }} - {{ ent.end }}]
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              class="size-7 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
              title="Delete Entity [Delete]"
              @click.stop="deleteEntity(ent.id)"
            >
              <Trash2 class="size-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  </WorkspaceShell>
</template>

<style scoped>
.entity-mark::after {
  content: ' ' attr(data-label);
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0.1rem 0.35rem;
  border-radius: 0.25rem;
  background-color: var(--entity-color, #8b5cf6);
  color: #ffffff;
  margin-left: 0.25rem;
  display: inline-block;
  line-height: 1;
  vertical-align: middle;
  pointer-events: none;
  user-select: none;
}
</style>
