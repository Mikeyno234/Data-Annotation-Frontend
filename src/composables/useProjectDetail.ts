import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { projectsApi } from '@/api/projects'
import { annotationsApi } from '@/api/annotations'
import type { Project, Dataset, DataItem, ExportFormatOption, Batch, ProjectStats, TaskStatus } from '@/types'
import { toast } from '@/utils/toast'
import { useAuthStore } from '@/stores/auth'
import { useProjectForm } from '@/components/projects/useProjectForm'
import type { UploadDatasetSubmitPayload } from '@/components/projects/UploadDatasetModal.vue'
import { Code2, FileSpreadsheet, FileText, Layers } from 'lucide-vue-next'

export interface FormattedExportOption extends ExportFormatOption {
  icon: any
}

function getFormatIcon(ext: string) {
  if (ext === 'zip') return Layers
  if (ext === 'csv') return FileSpreadsheet
  if (ext === 'txt') return FileText
  return Code2
}

export function useProjectDetail(projectId: string | number) {
  const router = useRouter()
  const authStore = useAuthStore()

  const project = ref<Project | null>(null)
  const datasets = ref<Dataset[]>([])
  const dataItems = ref<DataItem[]>([])
  const projectStats = ref<ProjectStats | null>(null)
  const isLoading = ref(true)

  const canUploadDataset = computed(() => authStore.hasPermission('dataset.create'))
  const canEditProject = computed(() => authStore.hasPermission('project.update'))
  const canManageWorkforce = computed(() =>
    authStore.hasPermission('project.update') ||
    authStore.isProjectManager ||
    authStore.currentRole === 'Admin' ||
    authStore.isSuperAdmin
  )

  const canExport = computed(() => (projectStats.value?.completed ?? 0) > 0)

  const projectOrgName = computed(() => {
    return project.value?.organization?.name || (project.value?.organization_id ? `Organization #${project.value.organization_id}` : '')
  })

  // Batch Flattening across datasets
  const allBatches = computed(() => {
    const list: { batch: Batch; datasetName: string }[] = []
    for (const ds of datasets.value) {
      if (ds.batches && ds.batches.length > 0) {
        for (const b of ds.batches) {
          list.push({ batch: b, datasetName: ds.name })
        }
      }
    }
    return list
  })

  const projectForm = useProjectForm(() => fetchProjectData())

  // Data Items filtering & pagination state
  const selectedStatusFilter = ref<TaskStatus | ''>('')
  const currentPage = ref(1)
  const pageLimit = ref(10)
  const totalDataItems = ref(0)
  const totalPages = ref(1)

  const myInProgressTask = computed<DataItem | undefined>(() => {
    return projectStats.value?.my_active_task || undefined
  })

  const itemStatusCounts = computed(() => {
    if (projectStats.value) {
      return {
        total: projectStats.value.total_items,
        new: projectStats.value.unassigned,
        inProgress: projectStats.value.in_progress,
        review: projectStats.value.annotated + projectStats.value.qa_pending,
        rework: projectStats.value.rework,
        completed: projectStats.value.completed,
      }
    }
    return {
      total: totalDataItems.value,
      new: 0,
      inProgress: 0,
      review: 0,
      rework: 0,
      completed: 0,
    }
  })

  const completionPercentage = computed(() => {
    return projectStats.value?.completion_percentage ?? 0
  })

  // Batch Assignment State
  const showBatchAssignModal = ref(false)
  const selectedBatchToAssign = ref<Batch | null>(null)
  const selectedBatchUserIds = ref<number[]>([])
  const isAssigningBatch = ref(false)
  const filterOrgOnly = ref(true)
  const annotatorSearchQuery = ref('')

  const filteredBatchAnnotators = computed(() => {
    const pool = projectForm.allUsers.value.length > 0 ? projectForm.allUsers.value : projectForm.availableAnnotators.value

    let list = pool.filter((u) => {
      const roleName = (u.role?.name || '').toLowerCase()
      const isEligibleRole =
        roleName.includes('annotator') ||
        roleName.includes('manager') ||
        roleName.includes('reviewer') ||
        roleName.includes('admin') ||
        roleName === ''
      const isActive = !u.status || u.status.toUpperCase() === 'ACTIVE'
      return isEligibleRole && isActive
    })

    if (filterOrgOnly.value && project.value?.organization_id) {
      const targetOrg = project.value.organization_id
      list = list.filter(
        (u) => !u.organization_id || u.organization_id === targetOrg || u.organization?.id === targetOrg
      )
    }

    if (annotatorSearchQuery.value.trim()) {
      const q = annotatorSearchQuery.value.toLowerCase().trim()
      list = list.filter(
        (u) =>
          (u.full_name && u.full_name.toLowerCase().includes(q)) ||
          (u.email && u.email.toLowerCase().includes(q)) ||
          (u.role?.name && u.role.name.toLowerCase().includes(q)) ||
          (u.organization?.name && u.organization.name.toLowerCase().includes(q))
      )
    }

    return list
  })

  function openBatchAssignModal(batch: Batch) {
    selectedBatchToAssign.value = batch
    selectedBatchUserIds.value = batch.assignees ? batch.assignees.map((u) => u.id) : []
    annotatorSearchQuery.value = ''
    if (authStore.isSuperAdmin) {
      projectForm.fetchAnnotators()
    } else {
      projectForm.fetchAnnotators(project.value?.organization_id)
    }
    showBatchAssignModal.value = true
  }

  function toggleBatchUser(userId: number) {
    const idx = selectedBatchUserIds.value.indexOf(userId)
    if (idx >= 0) {
      selectedBatchUserIds.value.splice(idx, 1)
    } else {
      selectedBatchUserIds.value.push(userId)
    }
  }

  async function handleConfirmBatchAssign() {
    if (!selectedBatchToAssign.value) return
    isAssigningBatch.value = true
    try {
      await projectsApi.assignBatch(selectedBatchToAssign.value.id, selectedBatchUserIds.value)
      toast.success('Batch Assignees Updated', `Assigned ${selectedBatchUserIds.value.length} annotator(s) to ${selectedBatchToAssign.value.name}`)
      showBatchAssignModal.value = false
      await fetchProjectData()
    } catch (err: any) {
      toast.error('Assignment Failed', err?.message || 'Could not assign batch annotators')
    } finally {
      isAssigningBatch.value = false
    }
  }

  // Create Batch State
  const showCreateBatchModal = ref(false)
  const isCreatingBatch = ref(false)

  function openCreateBatchModal() {
    if (authStore.isSuperAdmin) {
      projectForm.fetchAnnotators()
    } else {
      projectForm.fetchAnnotators(project.value?.organization_id)
    }
    showCreateBatchModal.value = true
  }

  async function handleCreateBatch(payload: { name: string; priority: string; assigneeIds: number[] }) {
    isCreatingBatch.value = true
    try {
      const firstDataset = datasets.value.length > 0 ? datasets.value[0].id : undefined
      await projectsApi.createBatch(projectId, {
        name: payload.name,
        priority: payload.priority,
        dataset_id: firstDataset,
        assignee_ids: payload.assigneeIds,
      })
      toast.success('Batch Created', `Batch "${payload.name}" created successfully`)
      showCreateBatchModal.value = false
      await fetchProjectData()
    } catch (err: any) {
      toast.error('Batch Creation Failed', err?.message || 'Could not create batch')
    } finally {
      isCreatingBatch.value = false
    }
  }

  // Upload Dataset State
  const showUploadModal = ref(false)
  const selectedBatchForUpload = ref<number | undefined>(undefined)
  const selectedUploadFiles = ref<File[]>([])
  const uploadName = ref('')
  const isUploading = ref(false)

  function openUploadModal() {
    selectedBatchForUpload.value = undefined
    selectedUploadFiles.value = []
    uploadName.value = ''
    showUploadModal.value = true
  }

  function openUploadModalForBatch(batchId: number) {
    selectedBatchForUpload.value = batchId
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

  async function handleUploadDataset(payload?: UploadDatasetSubmitPayload) {
    if (selectedUploadFiles.value.length === 0) {
      toast.error('Validation Error', 'Please select at least one file or a ZIP archive to upload')
      return
    }
    isUploading.value = true
    try {
      const formData = new FormData()
      formData.append('project_id', String(projectId))
      formData.append('name', payload?.uploadName || uploadName.value || 'Batch Upload')
      if (project.value?.modality) {
        formData.append('modality', project.value.modality)
      }

      if (payload?.batchSize && payload.batchSize > 0) {
        formData.append('batch_size', String(payload.batchSize))
      }
      if (payload?.batchName) {
        formData.append('batch_name', payload.batchName)
      }
      const targetBatchId = payload?.batchId || selectedBatchForUpload.value
      if (targetBatchId) {
        formData.append('batch_id', String(targetBatchId))
      }
      if (payload?.assigneeIds && payload.assigneeIds.length > 0) {
        payload.assigneeIds.forEach((uid) => {
          formData.append('assignee_ids', String(uid))
        })
      }

      selectedUploadFiles.value.forEach((file) => {
        formData.append('files', file)
      })
      if (selectedUploadFiles.value.length === 1) {
        formData.append('file', selectedUploadFiles.value[0])
      }

      await projectsApi.uploadDataset(formData)
      toast.success('Upload Successful', `Successfully uploaded and processed ${selectedUploadFiles.value.length} item(s)`)
      showUploadModal.value = false
      selectedUploadFiles.value = []
      selectedBatchForUpload.value = undefined
      await fetchProjectData()
    } catch (err: any) {
      toast.error('Upload Failed', err?.message || 'Could not upload dataset')
    } finally {
      isUploading.value = false
    }
  }

  // Export State
  const showExportModal = ref(false)
  const exportFormat = ref('json')
  const isExporting = ref(false)
  const availableFormats = ref<FormattedExportOption[]>([])

  async function openExportModal() {
    showExportModal.value = true
    try {
      const res: any = await projectsApi.getExportFormats(Number(projectId))
      const rawFormats = res?.data?.data || res?.data || res
      if (Array.isArray(rawFormats) && rawFormats.length > 0) {
        availableFormats.value = rawFormats.map((f: any) => ({
          id: f.id || f.format,
          name: f.name || f.label || f.format,
          desc: f.desc || f.description || '',
          icon: getFormatIcon(f.ext || f.format),
          ext: f.ext || f.format || 'json',
        }))
        if (!availableFormats.value.some((f) => f.id === exportFormat.value)) {
          exportFormat.value = availableFormats.value[0]?.id || 'json'
        }
      }
    } catch {
      availableFormats.value = [
        {
          id: 'json',
          name: 'Standard JSON Export',
          desc: 'Universal JSON metadata and annotation array',
          ext: 'json',
          icon: Code2,
        },
      ]
    }
  }

  async function handleExportDataset() {
    isExporting.value = true
    try {
      const res: any = await projectsApi.exportProject(projectId, exportFormat.value)
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

  // Data items query & stats
  async function fetchProjectStats() {
    try {
      const res: any = await projectsApi.getProjectStats(Number(projectId))
      const payload = res?.data?.data || res?.data || res
      if (payload && typeof payload === 'object') {
        projectStats.value = payload
      }
    } catch (err) {
      console.warn('Could not fetch project stats:', err)
    }
  }

  async function fetchDataItems() {
    try {
      const res: any = await annotationsApi.getDataItems({
        project_id: Number(projectId),
        status: selectedStatusFilter.value || undefined,
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
      fetchProjectStats()
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

  function openTaskInWorkspace(item: DataItem) {
    router.push(`/workspace?project_id=${projectId}&task_id=${item.id}`)
  }

  function handleCheckoutNext() {
    router.push(`/workspace?project_id=${projectId}`)
  }

  function handleOpenEditModal() {
    if (project.value) {
      projectForm.openEditModal(project.value)
    }
  }

  // Master fetcher
  async function fetchProjectData() {
    isLoading.value = true
    try {
      const [projRes, dsRes]: any = await Promise.all([
        projectsApi.getProject(Number(projectId)),
        projectsApi.getDatasets({ projectId: Number(projectId) }),
      ])

      project.value = projRes?.data?.data || projRes?.data || projRes
      const rawDatasets = dsRes?.data?.data || dsRes?.data || dsRes
      datasets.value = Array.isArray(rawDatasets) ? rawDatasets : []

      await Promise.all([
        fetchProjectStats(),
        fetchDataItems(),
      ])

      if (authStore.isSuperAdmin) {
        await projectForm.fetchAnnotators()
      } else {
        await projectForm.fetchAnnotators(project.value?.organization_id)
      }
    } catch (err: any) {
      toast.error('Failed to load project details', err?.message)
    } finally {
      isLoading.value = false
    }
  }

  return {
    project,
    datasets,
    dataItems,
    projectStats,
    isLoading,
    canUploadDataset,
    canEditProject,
    canManageWorkforce,
    canExport,
    projectOrgName,
    allBatches,
    projectForm,
    selectedStatusFilter,
    currentPage,
    pageLimit,
    totalDataItems,
    totalPages,
    myInProgressTask,
    itemStatusCounts,
    completionPercentage,
    showBatchAssignModal,
    selectedBatchToAssign,
    selectedBatchUserIds,
    isAssigningBatch,
    filterOrgOnly,
    annotatorSearchQuery,
    filteredBatchAnnotators,
    showCreateBatchModal,
    isCreatingBatch,
    showUploadModal,
    selectedBatchForUpload,
    selectedUploadFiles,
    uploadName,
    isUploading,
    showExportModal,
    exportFormat,
    isExporting,
    availableFormats,
    openBatchAssignModal,
    toggleBatchUser,
    handleConfirmBatchAssign,
    openCreateBatchModal,
    handleCreateBatch,
    openUploadModal,
    openUploadModalForBatch,
    handleFilesSelected,
    handleClearFiles,
    handleUploadDataset,
    openExportModal,
    handleExportDataset,
    handleStatusFilterChange,
    handlePageChange,
    handleLimitChange,
    openTaskInWorkspace,
    handleCheckoutNext,
    handleOpenEditModal,
    fetchProjectData,
  }
}
