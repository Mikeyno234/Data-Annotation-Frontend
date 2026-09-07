<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { projectsApi } from '@/api/projects'
import { annotationsApi } from '@/api/annotations'
import type { Project, Dataset, DataItem, ExportFormatOption } from '@/types'
import { useAuthStore } from '@/stores/auth'
import { toast } from '@/utils/toast'
import ProjectDetailHeader from '@/components/projects/ProjectDetailHeader.vue'
import ProjectExportModal from '@/components/projects/ProjectExportModal.vue'
import ProjectDataItemsTable from '@/components/projects/ProjectDataItemsTable.vue'
import UploadDatasetModal from '@/components/projects/UploadDatasetModal.vue'
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

const canUploadDataset = computed(() => authStore.hasPermission('dataset.create'))
const showUploadModal = ref(false)
const selectedUploadFiles = ref<File[]>([])
const uploadName = ref('')
const isUploading = ref(false)

function openUploadModal() {
  selectedUploadFiles.value = []
  uploadName.value = ''
  showUploadModal.value = true
}

function handleFilesSelected(files: File[]) {
  selectedUploadFiles.value = files
  if (files.length === 1) {
    const rawName = files[0].name.replace(/\.[^/.]+$/, '')
    uploadName.value = rawName
  } else if (files.length > 1) {
    const dateStr = new Date().toISOString().slice(0, 10)
    uploadName.value = `Batch_Upload_${dateStr}_(${files.length}_files)`
  }
}

function handleClearFiles() {
  selectedUploadFiles.value = []
  uploadName.value = ''
}

async function handleUploadDataset() {
  if (selectedUploadFiles.value.length === 0) {
    toast.error('Validation Error', 'Please select at least one file or a ZIP archive to upload')
    return
  }
  isUploading.value = true
  try {
    const formData = new FormData()
    formData.append('project_id', projectId)
    formData.append('name', uploadName.value || 'Batch Upload')
    if (project.value?.modality) {
      formData.append('modality', project.value.modality)
    }

    if (selectedUploadFiles.value.length === 1 && selectedUploadFiles.value[0].name.toLowerCase().endsWith('.zip')) {
      formData.append('file', selectedUploadFiles.value[0])
    } else {
      selectedUploadFiles.value.forEach((file) => {
        formData.append('files', file)
      })
    }

    await projectsApi.uploadDataset(formData)
    toast.success('Upload Successful', `Successfully uploaded and queued ${selectedUploadFiles.value.length} item(s)`)
    showUploadModal.value = false
    selectedUploadFiles.value = []
    fetchProjectData()
  } catch (err: any) {
    toast.error('Upload Failed', err?.message)
  } finally {
    isUploading.value = false
  }
}

const selectedStatusFilter = ref('ALL')
const currentPage = ref(1)
const pageLimit = ref(15)
const totalDataItems = ref(0)
const totalPages = ref(1)

const showExportModal = ref(false)
const exportFormat = ref('yolo')
const isExporting = ref(false)

const approvedItems = computed(() =>
  dataItems.value.filter((i) => i.status === 'ACCEPTED' || i.status === 'COMPLETED' || i.status === 'ANNOTATED')
)
const canExport = computed(() => approvedItems.value.length > 0)

interface FormattedExportOption extends ExportFormatOption {
  icon: any
}

function getFormatIcon(ext: string) {
  if (ext === 'zip') return Layers
  if (ext === 'csv') return FileSpreadsheet
  if (ext === 'txt') return FileText
  return Code2
}

const availableFormats = ref<FormattedExportOption[]>([
  { id: 'yolo', name: 'YOLO (.jpg + .txt + .yaml)', desc: 'Struktur folder images/, labels/ (*.txt koordinat ternormalisasi) & data.yaml', icon: Layers, ext: 'zip' },
  { id: 'json', name: 'Standard Multi-Modal JSON', desc: 'Ekspor lengkap annotations, tags, timestamps, dan status', icon: Code2, ext: 'json' },
  { id: 'csv', name: 'Metadata CSV Summary', desc: 'Ringkasan tabular dari data item dan label terkait', icon: FileSpreadsheet, ext: 'csv' },
])

const myInProgressTask = computed(() => {
  if (!authStore.user) return undefined
  return dataItems.value.find(
    (item) => item.status === 'IN_PROGRESS' && item.locked_by_id === authStore.user?.id
  )
})

async function fetchProjectData() {
  isLoading.value = true
  try {
    const projRes: any = await projectsApi.getProject(Number(projectId))
    project.value = projRes?.data?.data || projRes?.data || projRes

    const datasetsRes: any = await projectsApi.getDatasets({ projectId: Number(projectId) })
    const rawDatasets = datasetsRes?.data?.data || datasetsRes?.data || datasetsRes
    datasets.value = Array.isArray(rawDatasets) ? rawDatasets : []

    // Dynamically fetch available export formats from backend endpoint
    try {
      const formatsRes: any = await projectsApi.getExportFormats(Number(projectId))
      const rawFormats = formatsRes?.data?.data || formatsRes?.data || formatsRes
      if (Array.isArray(rawFormats) && rawFormats.length > 0) {
        availableFormats.value = rawFormats.map((f: ExportFormatOption) => ({
          ...f,
          icon: getFormatIcon(f.ext),
        }))
        if (!availableFormats.value.some((f) => f.id === exportFormat.value)) {
          exportFormat.value = availableFormats.value[0].id
        }
      }
    } catch (fmtErr) {
      console.warn('Could not fetch export formats dynamically:', fmtErr)
    }

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
    const payload = res?.data?.data || res?.data || res
    dataItems.value = Array.isArray(payload) ? payload : []
    const pagination = res?.pagination || res?.data?.pagination
    if (pagination) {
      totalDataItems.value = pagination.total ?? dataItems.value.length
      totalPages.value = pagination.total_pages ?? 1
    } else {
      totalDataItems.value = dataItems.value.length
      totalPages.value = 1
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
    const res: any = await projectsApi.exportProject(projectId, exportFormat.value)

    // Handle Blob response properly when apiClient interceptor already unwraps response.data
    const blob: Blob = res instanceof Blob
      ? res
      : (res?.data instanceof Blob ? res.data : new Blob([res?.data ?? res]))

    const selected = availableFormats.value.find((f) => f.id === exportFormat.value)
    const ext = selected?.ext || 'zip'
    const downloadFilename = `${project.value?.code || 'dataset'}_export_${exportFormat.value}.${ext}`

    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = downloadFilename
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
    toast.success('Export Ready', `Dataset export downloaded: ${downloadFilename}`)
    showExportModal.value = false
  } catch (err: any) {
    let msg = err?.message || 'Could not export dataset'
    // Extract actual server error message if Axios rejected with a Blob error response
    if (err?.response?.data instanceof Blob && err.response.data.type?.includes('application/json')) {
      try {
        const text = await err.response.data.text()
        const errJson = JSON.parse(text)
        msg = errJson?.message || errJson?.error || msg
      } catch {}
    }
    toast.error('Export Failed', msg)
  } finally {
    isExporting.value = false
  }
}

function openTaskInWorkspace(item: DataItem) {
  router.push(`/workspace?project_id=${projectId}&task_id=${item.id}`)
}

onMounted(fetchProjectData)
</script>

<template>
  <div class="flex flex-col gap-6 max-w-7xl mx-auto font-sans">
    <ProjectDetailHeader
      :project="project"
      :datasets="datasets"
      :can-export="canExport"
      :can-upload="canUploadDataset"
      @export="openExportModal"
      @upload="openUploadModal"
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

    <!-- Upload Dataset Modal -->
    <UploadDatasetModal
      :show-upload-modal="showUploadModal"
      :is-uploading="isUploading"
      :upload-name="uploadName"
      :selected-files="selectedUploadFiles"
      @update:show-upload-modal="showUploadModal = $event"
      @update:upload-name="uploadName = $event"
      @files-selected="handleFilesSelected"
      @clear-files="handleClearFiles"
      @submit="handleUploadDataset"
    />
  </div>
</template>
