<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { projectsApi } from '@/api/projects'
import { annotationsApi } from '@/api/annotations'
import type { Project, Dataset, DataItem } from '@/types'
import { useAuthStore } from '@/stores/auth'
import { toast } from '@/utils/toast'
import ProjectDetailHeader from '@/components/project-detail/ProjectDetailHeader.vue'
import ProjectExportModal from '@/components/project-detail/ProjectExportModal.vue'
import ProjectDataItemsTable from '@/components/project-detail/ProjectDataItemsTable.vue'
import {
  Layers,
  Code2,
  FileSpreadsheet,
  FileText,
} from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const projectId = route.params.id as string
const project = ref<Project | null>(null)
const datasets = ref<Dataset[]>([])
const dataItems = ref<DataItem[]>([])
const isLoading = ref(true)

const selectedStatusFilter = ref('ALL')
const currentPage = ref(1)
const pageLimit = ref(15)
const totalDataItems = ref(0)
const totalPages = ref(1)

const showExportModal = ref(false)
const exportFormat = ref('json')
const isExporting = ref(false)

const approvedItems = computed(() =>
  dataItems.value.filter((i) => i.status === 'ACCEPTED' || i.status === 'COMPLETED' || i.status === 'ANNOTATED')
)
const canExport = computed(() => approvedItems.value.length > 0)

const availableFormats = computed(() => {
  const mod = (project.value?.modality || '').toUpperCase()
  const annType = (project.value?.annotation_type || '').toUpperCase()

  if (mod === 'IMAGE' && (annType.includes('DETECTION') || annType.includes('BBOX') || annType.includes('OBJECT') || annType === '')) {
    return [
      { id: 'yolo', name: 'YOLO (.jpg + .txt + .yaml)', desc: 'Struktur folder images/, labels/ (*.txt koordinat ternormalisasi) & data.yaml', icon: Layers, ext: 'zip' },
      { id: 'coco', name: 'COCO (.jpg + instances.json)', desc: 'File JSON tunggal dengan images, categories, dan bounding box annotations', icon: Code2, ext: 'json' },
    ]
  }
  if (mod === 'IMAGE' && annType.includes('CLASSIF')) {
    return [
      { id: 'csv', name: 'CSV (filename, label)', desc: 'File metadata CSV mapping setiap gambar ke kategori class', icon: FileSpreadsheet, ext: 'csv' },
      { id: 'json', name: 'JSONL Dataset', desc: 'Satu baris JSON per gambar dengan filename dan class label', icon: Code2, ext: 'jsonl' },
    ]
  }
  if (mod === 'IMAGE' && annType.includes('SEGMENT')) {
    return [
      { id: 'coco', name: 'COCO Segmentation (instances.json)', desc: 'File JSON dengan koordinat polygon/mask area objek detail', icon: Code2, ext: 'json' },
    ]
  }
  if (mod === 'VIDEO' && (annType.includes('DETECTION') || annType.includes('BBOX'))) {
    return [
      { id: 'yolo', name: 'YOLO Frames (Frame .jpg + .txt)', desc: 'Kumpulan frame video dengan label *.txt (class_id x_center y_center w h)', icon: Layers, ext: 'zip' },
    ]
  }
  if (mod === 'VIDEO' && (annType.includes('TRACK') || annType.includes('MOT') || annType === '')) {
    return [
      { id: 'mot', name: 'MOT Challenge (gt.txt)', desc: 'Format MOT: frame_id, track_id, x, y, width, height, conf, class, vis', icon: FileText, ext: 'txt' },
      { id: 'yolo', name: 'YOLO Video Frames (ZIP)', desc: 'Frame gambar video dengan label bounding box per frame', icon: Layers, ext: 'zip' },
    ]
  }
  if (mod === 'TEXT' && annType.includes('CLASSIF')) {
    return [
      { id: 'csv', name: 'CSV (text, label)', desc: 'Tabel CSV dengan kolom text dan label untuk training model BERT/NLP', icon: FileSpreadsheet, ext: 'csv' },
      { id: 'json', name: 'JSONL Dataset', desc: 'Satu baris per kalimat/dokumen dengan field text dan label', icon: Code2, ext: 'jsonl' },
    ]
  }
  if (mod === 'TEXT' && (annType.includes('NER') || annType.includes('ENTITY') || annType === '')) {
    return [
      { id: 'json', name: 'JSONL (Text + Entity Offsets)', desc: 'Menyimpan text, posisi start, end, dan entity label', icon: Code2, ext: 'jsonl' },
      { id: 'conll', name: 'BIO / CoNLL Format (.txt)', desc: 'Format token-level tagging (Token B-LOCATION / I-LOCATION / O)', icon: FileText, ext: 'txt' },
    ]
  }
  if (mod === 'AUDIO' && (annType.includes('SPEECH') || annType.includes('TRANSCRIPT') || annType.includes('DIARIZ') || annType === '')) {
    return [
      { id: 'stt', name: 'WAV + metadata.csv', desc: 'File audio dan metadata.csv (audio, text) untuk training Whisper/Wav2Vec2', icon: FileSpreadsheet, ext: 'csv' },
      { id: 'json', name: 'Speaker Turns JSON', desc: 'Timestamp durasi per speaker untuk model Diarisasi', icon: Code2, ext: 'json' },
    ]
  }
  return [
    { id: 'json', name: 'Standard Multi-Modal JSON', desc: 'Ekspor lengkap annotations, tags, timestamps, dan status', icon: Code2, ext: 'json' },
    { id: 'csv', name: 'Metadata CSV Summary', desc: 'Ringkasan tabular dari data item dan label terkait', icon: FileSpreadsheet, ext: 'csv' },
  ]
})

const myInProgressTask = computed(() => {
  if (!authStore.user) return undefined
  return dataItems.value.find(
    (item) => item.status === 'IN_PROGRESS' && item.locked_by_id === authStore.user?.id
  )
})

async function fetchProjectData() {
  isLoading.value = true
  try {
    const projRes = await projectsApi.getProject(Number(projectId))
    project.value = projRes.data.data

    const datasetsRes = await projectsApi.getDatasets({ projectId: Number(projectId) })
    datasets.value = datasetsRes.data.data

    await fetchDataItems()
  } catch (err: any) {
    toast.error('Failed to load project details', err?.message)
  } finally {
    isLoading.value = false
  }
}

async function fetchDataItems() {
  try {
    const res: any = await annotationsApi.getDataItems({
      project_id: Number(projectId),
      status: selectedStatusFilter.value !== 'ALL' ? selectedStatusFilter.value : undefined,
      page: currentPage.value,
      limit: pageLimit.value,
    })
    if (res.data) {
      dataItems.value = res.data.data || res.data
      if (res.data.pagination) {
        totalDataItems.value = res.data.pagination.total
        totalPages.value = res.data.pagination.total_pages
      } else {
        totalDataItems.value = dataItems.value.length
        totalPages.value = 1
      }
    }
  } catch (err: any) {
    toast.error('Failed to load data items', err?.message)
  }
}

function handleStatusFilterChange() {
  currentPage.value = 1
  fetchDataItems()
}

function handlePageChange(page: number) {
  currentPage.value = page
  fetchDataItems()
}

function handleLimitChange(limit: number) {
  pageLimit.value = limit
  currentPage.value = 1
  fetchDataItems()
}

function openExportModal() {
  if (availableFormats.value.length > 0) {
    exportFormat.value = availableFormats.value[0].id
  }
  showExportModal.value = true
}

async function handleExportDataset() {
  isExporting.value = true
  try {
    const res = await projectsApi.exportProject(projectId, exportFormat.value)
    const blob = new Blob([res.data])
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const selected = availableFormats.value.find((f) => f.id === exportFormat.value)
    const ext = selected?.ext || 'zip'
    a.download = `${project.value?.code || 'dataset'}_export_${exportFormat.value}.${ext}`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
    toast.success('Export Ready', 'Dataset export downloaded successfully')
    showExportModal.value = false
  } catch (err: any) {
    toast.error('Export Failed', err?.message || 'Could not export dataset')
  } finally {
    isExporting.value = false
  }
}

function openTaskInWorkspace(item: DataItem) {
  router.push(`/workspace?project_id=${projectId}&item_id=${item.id}`)
}

onMounted(fetchProjectData)
</script>

<template>
  <div class="flex flex-col gap-6 max-w-7xl mx-auto font-sans">
    <ProjectDetailHeader
      :project="project"
      :datasets="datasets"
      :can-export="canExport"
      @export="openExportModal"
    />

    <ProjectDataItemsTable
      :data-items="dataItems"
      :selected-status-filter="selectedStatusFilter"
      :my-in-progress-task="myInProgressTask"
      :current-user-id="authStore.user?.id"
      :current-page="currentPage"
      :page-limit="pageLimit"
      :total-data-items="totalDataItems"
      :total-pages="totalPages"
      :is-loading="isLoading"
      @update:selected-status-filter="selectedStatusFilter = $event"
      @filter-change="handleStatusFilterChange"
      @checkout-next="router.push(`/workspace?project_id=${projectId}`)"
      @open-task="openTaskInWorkspace"
      @page-change="handlePageChange"
      @limit-change="handleLimitChange"
    />

    <ProjectExportModal
      :show-modal="showExportModal"
      :available-formats="availableFormats"
      :export-format="exportFormat"
      :is-exporting="isExporting"
      @update:show-modal="showExportModal = $event"
      @update:export-format="exportFormat = $event"
      @export="handleExportDataset"
    />
  </div>
</template>
