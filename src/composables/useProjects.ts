import { ref } from 'vue'
import { projectsApi } from '@/api/projects'
import { metadataApi } from '@/api/metadata'
import type { Project } from '@/types'
import { toast } from '@/utils/toast'
import { getModalityConfig, MODALITY_CONFIG } from '@/utils/design'
import { Layers, type LucideIcon } from 'lucide-vue-next'

export interface ModalityFilterOption {
  id: string
  label: string
  icon: LucideIcon
}

export function useProjects() {
  const projects = ref<Project[]>([])
  const isLoading = ref(true)
  const searchQuery = ref('')
  const selectedModality = ref<string>('ALL')

  // Dynamic modalities fetched from backend API (/metadata/annotation-options)
  const dynamicModalities = ref<ModalityFilterOption[]>([
    { id: 'ALL', label: 'All', icon: Layers },
  ])

  // Pagination state
  const currentPage = ref(1)
  const pageLimit = ref(12)
  const totalProjects = ref(0)
  const totalPages = ref(1)

  // View Mode: 'grid' | 'table' with localStorage persistence
  const savedViewMode = (typeof window !== 'undefined' && localStorage.getItem('projects_view_mode')) as 'grid' | 'table' | null
  const viewMode = ref<'grid' | 'table'>(savedViewMode === 'table' ? 'table' : 'grid')

  function setViewMode(mode: 'grid' | 'table') {
    viewMode.value = mode
    try {
      localStorage.setItem('projects_view_mode', mode)
    } catch {
      // Storage unavailable or disabled
    }
  }

  // Side Panel Quick View state (SaaS Search-Flows pattern)
  const selectedProjectForPreview = ref<Project | null>(null)
  const showPreviewDrawer = ref(false)

  function openPreview(project: Project) {
    selectedProjectForPreview.value = project
    showPreviewDrawer.value = true
  }

  function closePreview() {
    showPreviewDrawer.value = false
  }

  // Upload Dataset Modal State
  const showUploadModal = ref(false)
  const uploadProjectId = ref<number | null>(null)
  const selectedUploadFiles = ref<File[]>([])
  const uploadName = ref('')
  const uploadModality = ref('')
  const isUploading = ref(false)

  function openUploadModal(id: number, modality: string) {
    uploadProjectId.value = id
    uploadModality.value = modality
    selectedUploadFiles.value = []
    uploadName.value = ''
    showUploadModal.value = true
  }

  function handleFilesSelected(files: File[]) {
    selectedUploadFiles.value = files
    if (files.length === 1) {
      uploadName.value = files[0].name.replace(/\.[^/.]+$/, '')
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
    if (!uploadProjectId.value || selectedUploadFiles.value.length === 0) {
      toast.error('Validation Error', 'Please select at least one file or a ZIP archive to upload')
      return
    }
    isUploading.value = true
    try {
      const formData = new FormData()
      formData.append('project_id', String(uploadProjectId.value))
      formData.append('name', uploadName.value || 'Batch Upload')
      if (uploadModality.value) {
        formData.append('modality', uploadModality.value)
      }

      selectedUploadFiles.value.forEach((file) => {
        formData.append('files', file)
      })
      if (selectedUploadFiles.value.length === 1) {
        formData.append('file', selectedUploadFiles.value[0])
      }

      await projectsApi.uploadDataset(formData)
      toast.success('Upload Successful', `Successfully uploaded and queued ${selectedUploadFiles.value.length} item(s)`)
      showUploadModal.value = false
      selectedUploadFiles.value = []
      await fetchProjects()
    } catch (err: any) {
      toast.error('Upload Failed', err?.message)
    } finally {
      isUploading.value = false
    }
  }

  let searchDebounceTimer: ReturnType<typeof setTimeout> | null = null

  async function fetchModalities() {
    try {
      const res: any = await metadataApi.getAnnotationOptions()
      const rawList = res?.data?.modalities || res?.data?.data?.modalities || []
      if (Array.isArray(rawList) && rawList.length > 0) {
        const options: ModalityFilterOption[] = [
          { id: 'ALL', label: 'All', icon: Layers },
        ]
        rawList.forEach((m: any) => {
          const code = (m.value || m.code || m.label || '').toUpperCase()
          const cfg = getModalityConfig(code)
          options.push({
            id: code,
            label: cfg.shortLabel || m.label || code,
            icon: cfg.icon,
          })
        })
        dynamicModalities.value = options
      } else {
        // Fallback to configured modalities if endpoint returns empty list
        dynamicModalities.value = [
          { id: 'ALL', label: 'All', icon: Layers },
          { id: 'IMAGE', label: MODALITY_CONFIG.IMAGE.shortLabel, icon: MODALITY_CONFIG.IMAGE.icon },
          { id: 'AUDIO', label: MODALITY_CONFIG.AUDIO.shortLabel, icon: MODALITY_CONFIG.AUDIO.icon },
          { id: 'TEXT', label: MODALITY_CONFIG.TEXT.shortLabel, icon: MODALITY_CONFIG.TEXT.icon },
          { id: 'VIDEO', label: MODALITY_CONFIG.VIDEO.shortLabel, icon: MODALITY_CONFIG.VIDEO.icon },
        ]
      }
    } catch {
      dynamicModalities.value = [
        { id: 'ALL', label: 'All', icon: Layers },
        { id: 'IMAGE', label: MODALITY_CONFIG.IMAGE.shortLabel, icon: MODALITY_CONFIG.IMAGE.icon },
        { id: 'AUDIO', label: MODALITY_CONFIG.AUDIO.shortLabel, icon: MODALITY_CONFIG.AUDIO.icon },
        { id: 'TEXT', label: MODALITY_CONFIG.TEXT.shortLabel, icon: MODALITY_CONFIG.TEXT.icon },
        { id: 'VIDEO', label: MODALITY_CONFIG.VIDEO.shortLabel, icon: MODALITY_CONFIG.VIDEO.icon },
      ]
    }
  }

  async function fetchProjects() {
    isLoading.value = true
    try {
      const res: any = await projectsApi.getProjects({
        page: currentPage.value,
        limit: pageLimit.value,
        modality: selectedModality.value !== 'ALL' ? selectedModality.value : undefined,
        search: searchQuery.value.trim() || undefined,
      })
      const payload = res?.data?.data || res?.data || res
      projects.value = Array.isArray(payload) ? payload : []
      const pagination = res?.pagination || res?.data?.pagination
      if (pagination) {
        totalProjects.value = pagination.total ?? projects.value.length
        totalPages.value = pagination.total_pages ?? 1
      } else {
        totalProjects.value = projects.value.length
        totalPages.value = 1
      }
    } catch (err: any) {
      toast.error('Failed to load projects', err?.message)
    } finally {
      isLoading.value = false
    }
  }

  function handleSearchInput(val: string) {
    searchQuery.value = val
    if (searchDebounceTimer) clearTimeout(searchDebounceTimer)
    searchDebounceTimer = setTimeout(() => {
      currentPage.value = 1
      fetchProjects()
    }, 300)
  }

  function clearSearch() {
    searchQuery.value = ''
    currentPage.value = 1
    fetchProjects()
  }

  function setModalityFilter(modality: string) {
    selectedModality.value = modality
    currentPage.value = 1
    fetchProjects()
  }

  function handlePageChange(payload: { page: number; limit?: number } | number) {
    if (typeof payload === 'number') {
      currentPage.value = payload
    } else {
      currentPage.value = payload.page
      if (payload.limit) pageLimit.value = payload.limit
    }
    fetchProjects()
  }

  return {
    projects,
    isLoading,
    searchQuery,
    selectedModality,
    dynamicModalities,
    currentPage,
    pageLimit,
    totalProjects,
    totalPages,
    viewMode,
    selectedProjectForPreview,
    showPreviewDrawer,
    showUploadModal,
    uploadProjectId,
    selectedUploadFiles,
    uploadName,
    uploadModality,
    isUploading,
    setViewMode,
    openPreview,
    closePreview,
    openUploadModal,
    handleFilesSelected,
    handleClearFiles,
    handleUploadDataset,
    fetchModalities,
    fetchProjects,
    handleSearchInput,
    clearSearch,
    setModalityFilter,
    handlePageChange,
  }
}
