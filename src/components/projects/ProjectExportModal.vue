<script setup lang="ts">
import Modal from '@/components/ui/Modal.vue'
import Button from '@/components/ui/Button.vue'
import { Download } from 'lucide-vue-next'

defineProps<{
  showModal: boolean
  availableFormats: Array<{
    id: string
    name: string
    desc: string
    icon: any
    ext: string
  }>
  exportFormat: string
  isExporting: boolean
}>()

const emit = defineEmits<{
  (e: 'update:showModal', val: boolean): void
  (e: 'update:exportFormat', val: string): void
  (e: 'export'): void
}>()
</script>

<template>
  <Modal
    :open="showModal"
    title="Export Annotated Dataset"
    description="Select the output format to export labels, bboxes, segments, and QA scores for ML training."
    @close="emit('update:showModal', false)"
  >
    <div class="space-y-4 font-sans">
      <div class="space-y-2">
        <label class="text-xs font-semibold text-foreground">Target Format</label>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <label
            v-for="fmt in availableFormats"
            :key="fmt.id"
            class="flex items-start gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer select-none"
            :class="exportFormat === fmt.id ? 'border-primary bg-primary/5 text-foreground' : 'border-border/60 bg-card hover:bg-muted/40 text-muted-foreground'"
          >
            <input
              type="radio"
              :value="fmt.id"
              :checked="exportFormat === fmt.id"
              class="mt-0.5"
              @change="emit('update:exportFormat', fmt.id)"
            />
            <div>
              <div class="text-xs font-bold text-foreground flex items-center gap-1.5">
                <component :is="fmt.icon" class="size-3.5 text-primary" />
                {{ fmt.name }}
              </div>
              <div class="text-[11px] text-muted-foreground mt-0.5">{{ fmt.desc }}</div>
            </div>
          </label>
        </div>
      </div>

      <div class="flex items-center justify-end gap-2.5 pt-3 border-t border-border/40">
        <Button variant="ghost" class="rounded-xl font-sans" @click="emit('update:showModal', false)">
          Cancel
        </Button>
        <Button
          class="gap-2 rounded-xl font-semibold font-sans shadow-xs cursor-pointer"
          :disabled="isExporting"
          @click="emit('export')"
        >
          <Download class="size-4" />
          <span>{{ isExporting ? 'Exporting...' : 'Download Export' }}</span>
        </Button>
      </div>
    </div>
  </Modal>
</template>
