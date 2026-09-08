<script setup lang="ts">
import { computed } from 'vue'
import Modal from '@/components/ui/Modal.vue'
import Button from '@/components/ui/Button.vue'
import { Download, Terminal, Check, Layers, FileSpreadsheet, FileCode, FileText } from 'lucide-vue-next'

const props = defineProps<{
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

const selectedOption = computed(() => {
  return props.availableFormats.find((f) => f.id === props.exportFormat) || props.availableFormats[0]
})

// Clean engineering spec & manifest preview
const manifestSpec = computed(() => {
  const fid = (props.exportFormat || '').toLowerCase()
  const optName = (selectedOption.value?.name || '').toLowerCase()

  if (fid === 'csv') {
    if (optName.includes('action') || optName.includes('segment') || optName.includes('timeline')) {
      return {
        pipeline: 'Action Recognition / Temporal Detection',
        engine: 'ActivityNet · PyTorchVideo · MMAction2',
        targetFile: 'video_action_segments.csv',
        fields: ['video_name', 'start_time', 'end_time', 'duration', 'label', 'track_id'],
        snippet: `video_name,start_time,end_time,duration,label,track_id
clip_001.mp4,0.450,3.200,2.750,running,1
clip_001.mp4,5.100,8.400,3.300,jumping,1`,
      }
    }
    if (optName.includes('classif')) {
      return {
        pipeline: 'Video Classification',
        engine: 'Kinetics-400 · PyTorch VideoFolder · Torchvision',
        targetFile: 'video_classification.csv',
        fields: ['video_name', 'label', 'notes'],
        snippet: `video_name,label,notes
gameplay_01.mp4,action,fast paced sequence
tutorial_02.mp4,educational,high confidence voiceover`,
      }
    }
    return {
      pipeline: 'Tabular Dataset Index',
      engine: 'Pandas · Scikit-Learn · PyTorch CSV Loader',
      targetFile: 'dataset_metadata.csv',
      fields: ['item_id', 'file_name', 'modality', 'status', 'labels', 'annotation_count'],
      snippet: `item_id,file_name,modality,status,labels,annotation_count
1042,video_clip.mp4,VIDEO,APPROVED,dribble;pass,2`,
    }
  }

  if (fid === 'yolo' || fid === 'yolo_seg') {
    return {
      pipeline: 'Object Detection & Segmentation',
      engine: 'Ultralytics YOLOv8 / YOLOv11',
      targetFile: 'dataset_yolo.zip',
      fields: ['train/images/*', 'train/labels/*.txt', 'data.yaml', 'train.py'],
      snippet: `# train/labels/0001.txt
0 0.482 0.315 0.220 0.410
# data.yaml
names: ['target_object']`,
    }
  }

  if (fid === 'mot') {
    return {
      pipeline: 'Multi-Object Tracking (MOT Benchmark)',
      engine: 'ByteTrack · DeepOCSORT · BoT-SORT',
      targetFile: 'gt.txt',
      fields: ['frame_id', 'track_id', 'x', 'y', 'w', 'h', 'conf', 'class', 'vis'],
      snippet: `1, 1, 136, 211, 54, 118, 1, 1, 1.0
2, 1, 138, 212, 53, 117, 1, 1, 1.0`,
    }
  }

  if (fid === 'folder_class') {
    return {
      pipeline: 'Directory Categorization Archive',
      engine: 'PyTorch ImageFolder / VideoFolder',
      targetFile: 'archive_classification.zip',
      fields: ['train/<class>/*', 'labels.csv', 'README.md'],
      snippet: `train/
├── action/clip_01.mp4
└── comedy/clip_02.mp4`,
    }
  }

  return {
    pipeline: 'Universal Annotation Object',
    engine: 'Native REST API / JSON Pipelines',
    targetFile: 'annotations_manifest.json',
    fields: ['data_item', 'annotations', 'metadata', 'reviews'],
    snippet: `[
  { "id": 1, "filename": "sample.mp4", "labels": [...] }
]`,
  }
})
</script>

<template>
  <Modal
    :open="showModal"
    title="Export Dataset"
    description="Select target training format and download curated ground-truth annotations."
    max-width="max-w-2xl"
    @close="emit('update:showModal', false)"
  >
    <div class="space-y-4 text-foreground font-sans">
      <!-- Preset List: Clean, standard sans typography -->
      <div class="space-y-2">
        <div class="flex items-center justify-between">
          <label class="text-xs font-semibold text-foreground tracking-tight">Format Export</label>
          <span class="text-xs text-muted-foreground">{{ availableFormats.length }} format tersedia</span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <button
            v-for="fmt in availableFormats"
            :key="fmt.id"
            type="button"
            class="group text-left p-3.5 rounded-xl border transition-all duration-150 relative flex flex-col justify-between cursor-pointer select-none"
            :class="exportFormat === fmt.id
              ? 'bg-primary/[0.06] border-primary/60 shadow-2xs ring-1 ring-primary/20'
              : 'bg-card border-border/70 hover:border-border hover:bg-muted/40'"
            @click="emit('update:exportFormat', fmt.id)"
          >
            <div class="flex items-start justify-between gap-2 w-full">
              <div class="font-semibold text-xs text-foreground flex items-center gap-1.5 leading-snug">
                <span>{{ fmt.name }}</span>
              </div>
              <span
                class="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-mono leading-none transition-colors uppercase font-semibold"
                :class="exportFormat === fmt.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted border border-border/60 text-muted-foreground group-hover:text-foreground'"
              >
                .{{ fmt.ext }}
              </span>
            </div>

            <p class="text-xs text-muted-foreground mt-1.5 leading-relaxed line-clamp-2">
              {{ fmt.desc }}
            </p>

            <div class="mt-2.5 flex items-center justify-between pt-2 border-t border-border/40 text-[11px]">
              <span class="text-muted-foreground/80 font-mono text-[10px]">ID: {{ fmt.id }}</span>
              <span v-if="exportFormat === fmt.id" class="text-primary font-semibold flex items-center gap-1">
                <Check class="size-3.5 stroke-[2.5]" />
                <span>Dipilih</span>
              </span>
            </div>
          </button>
        </div>
      </div>

      <!-- Manifest Inspector: Technical & cohesive with app palette -->
      <div v-if="manifestSpec" class="rounded-xl border border-border/70 bg-muted/25 overflow-hidden text-xs shadow-2xs">
        <div class="flex items-center justify-between px-3.5 py-2.5 bg-muted/50 border-b border-border/60 text-xs">
          <div class="flex items-center gap-2 text-foreground">
            <Terminal class="size-3.5 text-primary" />
            <span class="font-semibold text-xs text-foreground">{{ manifestSpec.pipeline }}</span>
            <span class="text-muted-foreground/40">/</span>
            <span class="text-muted-foreground text-xs">{{ manifestSpec.engine }}</span>
          </div>
          <span class="text-primary font-mono text-[10.5px] bg-primary/10 px-2 py-0.5 rounded border border-primary/25 font-semibold">
            {{ manifestSpec.targetFile }}
          </span>
        </div>

        <div class="p-3.5 space-y-2.5">
          <div class="flex items-center gap-1.5 flex-wrap text-xs">
            <span class="text-muted-foreground font-semibold mr-1">Kolom Dataset:</span>
            <span
              v-for="col in manifestSpec.fields"
              :key="col"
              class="px-2 py-0.5 rounded-md bg-card border border-border/80 text-foreground font-mono text-[11px]"
            >
              {{ col }}
            </span>
          </div>

          <div class="rounded-lg bg-card/90 p-3 border border-border/70 text-foreground/90 text-xs leading-relaxed overflow-x-auto whitespace-pre select-all font-mono">
{{ manifestSpec.snippet }}
          </div>
        </div>
      </div>

      <!-- Action Footer -->
      <div class="flex items-center justify-end gap-2.5 pt-2 border-t border-border/40">
        <Button variant="ghost" class="rounded-xl text-xs" @click="emit('update:showModal', false)">
          Cancel
        </Button>
        <Button
          class="gap-2 rounded-xl text-xs font-semibold cursor-pointer shadow-2xs"
          :disabled="isExporting"
          @click="emit('export')"
        >
          <Download class="size-3.5" />
          <span>{{ isExporting ? 'Preparing export...' : 'Export Dataset' }}</span>
        </Button>
      </div>
    </div>
  </Modal>
</template>


