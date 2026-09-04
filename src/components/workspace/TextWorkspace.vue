<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import type { DataItem, TextEntity, LabelOption } from '@/types'
import { createDataItemMediaUrl } from '@/api/media'
import { useAnnotationSession } from '@/composables/useAnnotationSession'
import { toast } from '@/utils/toast'
import WorkspaceShell from '@/components/workspace/WorkspaceShell.vue'
import Button from '@/components/ui/Button.vue'
import Badge from '@/components/ui/Badge.vue'
import Card from '@/components/ui/Card.vue'
import CardContent from '@/components/ui/CardContent.vue'
import { Trash2, Sparkles } from 'lucide-vue-next'

export interface TextAnnotationPayload {
  entities: TextEntity[]
  sentiment: string
}

const props = defineProps<{
  item: DataItem
  labels?: LabelOption[]
  annotationType?: string
}>()

const emit = defineEmits<{
  submitted: []
}>()

const defaultEntities = [
  { name: 'Default label', color: '#38bdf8', bg: 'bg-sky-500/20 text-sky-300 border-sky-500/40' },
]
const availableEntities = computed(() => (props.labels?.length ? props.labels : defaultEntities))
const currentEntity = ref(props.labels?.[0]?.name || 'Default label')
const selectedEntityId = ref<string | null>(null)

const textContent = ref('')
const isLoadingContent = ref(true)
const contentError = ref(false)

// Initialize Session
const session = useAnnotationSession<TextAnnotationPayload>({
  item: props.item,
  annotationType: props.annotationType || 'Text entities',
  initialPayload: {
    entities: [],
    sentiment: 'NEUTRAL',
  },
  validatePayload: (data) => {
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
    if (ent) currentEntity.value = ent.name
  },
  onDeleteSelected: () => {
    if (selectedEntityId.value) {
      deleteEntity(selectedEntityId.value)
    }
  },
})

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
  const selection = window.getSelection()
  if (!selection || selection.isCollapsed) return

  const selectedText = selection.toString().trim()
  if (!selectedText) return

  const start = textContent.value.indexOf(selectedText)
  if (start === -1) return

  const end = start + selectedText.length
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
  const updatedEntities = [...currentPayload.entities, newEntity]
  const updatedPayload = { ...currentPayload, entities: updatedEntities }

  session.payload.value = updatedPayload
  selectedEntityId.value = newEntity.id
  session.pushState(updatedPayload)

  toast.success('Entity Tagged', `${selectedText} -> [${currentEntity.value}]`)
  selection.removeAllRanges()
}

function deleteEntity(id: string) {
  const currentPayload = session.payload.value || { entities: [], sentiment: 'NEUTRAL' }
  const updatedEntities = currentPayload.entities.filter((e) => e.id !== id)
  const updatedPayload = { ...currentPayload, entities: updatedEntities }

  session.payload.value = updatedPayload
  if (selectedEntityId.value === id) selectedEntityId.value = null
  session.pushState(updatedPayload)
  toast.info('Entity deleted')
}

const hotkeyHints = [
  { key: '1-9', label: 'choose entity' },
  { key: 'Delete', label: 'remove entity' },
  { key: 'Select text', label: 'tag span' },
]

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
    modality-title="NER & Text Classification"
    modality-type="Text"
    class-label-title="Entity type:"
    :hotkey-hints="hotkeyHints"
  >
    <!-- Extra Controls Slot for Sentiment Selector -->
    <template #controls>
      <div class="flex items-center gap-2">
        <span class="text-xs text-muted-foreground font-medium font-mono">Sentiment:</span>
        <select
          v-model="session.payload.value.sentiment"
          class="h-9 rounded-xl border-0 bg-muted/60 px-3 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 shadow-inner"
          @change="session.pushState()"
        >
          <option value="POSITIVE">POSITIVE</option>
          <option value="NEUTRAL">NEUTRAL</option>
          <option value="NEGATIVE">NEGATIVE</option>
        </select>
      </div>
    </template>

    <!-- Text Corpus Annotation Viewport -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2">
        <Card class="bg-card/90 shadow-sm">
          <CardContent class="p-6">
            <div class="text-xs text-muted-foreground mb-3 font-medium">
              Highlight words with cursor to tag entity:
            </div>
            <div v-if="isLoadingContent" class="rounded-2xl bg-muted/40 p-8 text-sm text-muted-foreground">
              Loading text content…
            </div>
            <div
              v-else-if="contentError"
              class="rounded-2xl bg-destructive/10 p-8 text-sm text-destructive-foreground"
            >
              Failed to load text source: {{ item.source_url }}
            </div>
            <div
              v-else
              class="rounded-2xl bg-muted/30 p-8 text-base leading-relaxed text-foreground select-text whitespace-pre-wrap shadow-inner"
              @mouseup="handleTextSelection"
            >
              {{ textContent }}
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- Tagged Entities Inspector -->
      <div class="lg:col-span-1 flex flex-col gap-3">
        <div class="flex items-center justify-between">
          <h3 class="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-mono">
            Tagged Entities ({{ (session.payload.value?.entities || []).length }})
          </h3>
          <Badge v-if="session.hasPrelabel.value" variant="secondary" class="gap-1 text-[10px]">
            <Sparkles class="size-3" /> Pre-annotated
          </Badge>
        </div>

        <div class="space-y-2.5">
          <div
            v-for="ent in session.payload.value?.entities || []"
            :key="ent.id"
            class="flex items-center justify-between p-3.5 rounded-2xl border-0 transition-all cursor-pointer shadow-xs"
            :class="[
              selectedEntityId === ent.id
                ? 'bg-primary/10 ring-2 ring-primary/40'
                : 'bg-card/90 hover:bg-card hover:shadow-md',
            ]"
            @click="selectedEntityId = ent.id"
          >
            <div>
              <div class="flex items-center gap-2">
                <span class="text-xs font-bold text-foreground">"{{ ent.text }}"</span>
                <span
                  class="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold"
                  :style="{ color: ent.color, backgroundColor: `${ent.color}22` }"
                >
                  {{ ent.label }}
                </span>
              </div>
              <div class="text-[10px] text-muted-foreground font-mono mt-1">
                Range: [{{ ent.start }} - {{ ent.end }}]
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              class="size-8 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10"
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
