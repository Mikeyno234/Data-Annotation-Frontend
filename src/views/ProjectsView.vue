<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { projectsApi } from '@/api/projects'
import { useAuthStore } from '@/stores/auth'
import type { Project } from '@/types'
import { toast } from '@/utils/toast'
import Card from '@/components/ui/Card.vue'
import Button from '@/components/ui/Button.vue'
import Pagination from '@/components/ui/Pagination.vue'
import ProjectCard from '@/components/projects/ProjectCard.vue'
import ProjectFilterBar from '@/components/projects/ProjectFilterBar.vue'
import CreateProjectModal from '@/components/projects/CreateProjectModal.vue'
import UploadDatasetModal from '@/components/projects/UploadDatasetModal.vue'
import { useProjectForm } from '@/components/projects/useProjectForm'
import { Search } from 'lucide-vue-next'

const authStore = useAuthStore()

const projects = ref<Project[]>([])
const searchQuery = ref('')
const selectedModality = ref<string>('ALL')
const isLoading = ref(true)

const currentPage = ref(1)
const pageLimit = ref(12)
const totalProjects = ref(0)
const totalPages = ref(1)

let searchDebounceTimer: any = null

const canCreateProject = computed(() => authStore.hasPermission('project.create'))
const canEditProject = computed(() => authStore.hasPermission('project.update'))
const canUploadDataset = computed(() => authStore.hasPermission('dataset.create'))

// Upload Dataset Modal State
const showUploadModal = ref(false)
const uploadProjectId = ref<number | null>(null)
const uploadFile = ref<File | null>(null)
const uploadName = ref('')
const uploadModality = ref('')
const isUploading = ref(false)

function openUploadModal(id: number, modality: string) {
  uploadProjectId.value = id
  uploadModality.value = modality
  uploadFile.value = null
  uploadName.value = ''
  showUploadModal.value = true
}

function handleFileSelect(e: Event) {
  const target = e.target as HTMLInputElement
  if (target.files && target.files[0]) {
    uploadFile.value = target.files[0]
    uploadName.value = target.files[0].name
  }
}

async function handleUploadDataset() {
  if (!uploadProjectId.value || !uploadFile.value) {
    toast.error('Validation Error', 'Please select a file to upload')
    return
  }
  isUploading.value = true
  try {
    const formData = new FormData()
    formData.append('project_id', String(uploadProjectId.value))
    formData.append('file', uploadFile.value)
    formData.append('name', uploadName.value || uploadFile.value.name)
    await projectsApi.uploadDataset(formData)
    toast.success('Upload Successful', 'File uploaded and tasks queued')
    showUploadModal.value = false
    fetchProjects()
  } catch (err: any) {
    toast.error('Upload Failed', err?.message)
  } finally {
    isUploading.value = false
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
    if (res.data) {
      projects.value = res.data.data || res.data
      if (res.data.pagination) {
        totalProjects.value = res.data.pagination.total
        totalPages.value = res.data.pagination.total_pages
      } else {
        totalProjects.value = projects.value.length
        totalPages.value = 1
      }
    }
  } catch (err: any) {
    toast.error('Failed to load projects', err?.message)
  } finally {
    isLoading.value = false
  }
}

const projectForm = useProjectForm(() => fetchProjects())

function handleSearchInput(val: string) {
  searchQuery.value = val
  if (searchDebounceTimer) clearTimeout(searchDebounceTimer)
  searchDebounceTimer = setTimeout(() => {
    currentPage.value = 1
    fetchProjects()
  }, 300)
}

function setModalityFilter(modality: string) {
  selectedModality.value = modality
  currentPage.value = 1
  fetchProjects()
}

import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

onMounted(async () => {
  fetchProjects()
  await projectForm.fetchMetadata()
  if (route.query.new === 'true' || route.query.template) {
    const templateCode = (route.query.template as string) || undefined
    projectForm.openCreateModal(templateCode)
    router.replace({ path: '/projects' })
  }
})
</script>

<template>
  <div class="space-y-6">
    <ProjectFilterBar
      :search-query="searchQuery"
      :selected-modality="selectedModality"
      :can-create-project="canCreateProject"
      @update:search-query="handleSearchInput"
      @update:selected-modality="setModalityFilter"
      @create="projectForm.openCreateModal"
    />

    <!-- Projects Grid -->
    <div v-if="isLoading" class="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
      <div v-for="i in 6" :key="i" class="h-64 rounded-2xl border border-border/40 bg-card/50 animate-pulse"></div>
    </div>

    <div v-else-if="projects.length > 0" class="flex flex-col gap-6">
      <div class="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        <ProjectCard
          v-for="proj in projects"
          :key="proj.id"
          :project="proj"
          :can-upload-dataset="canUploadDataset"
          :can-edit-project="canEditProject"
          @upload="openUploadModal"
          @edit="projectForm.openEditModal"
        />
      </div>

      <!-- Pagination -->
      <Card class="bg-card/95 px-5 py-2 shadow-2xs">
        <Pagination
          :page="currentPage"
          :limit="pageLimit"
          :total="totalProjects"
          :total-pages="totalPages"
          :page-size-options="[6, 12, 24, 48]"
          :disabled="isLoading"
          @update:page="currentPage = $event; fetchProjects()"
          @update:limit="pageLimit = $event; currentPage = 1; fetchProjects()"
        />
      </Card>
    </div>

    <div v-else class="rounded-2xl border border-border/60 bg-card/90 px-6 py-20 text-center shadow-2xs">
      <div class="mx-auto flex size-14 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground border border-border/40">
        <Search class="size-6" />
      </div>
      <h2 class="mt-4 text-base font-bold text-foreground tracking-tight">No Projects Found</h2>
      <p class="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-muted-foreground">
        No dataset annotation projects match your current filter. Clear your search or create a new project.
      </p>
      <Button
        v-if="canCreateProject"
        variant="default"
        size="sm"
        class="mt-5"
        @click="projectForm.openCreateModal"
      >
        Create New Project
      </Button>
    </div>

    <!-- Create / Edit Project Modal -->
    <CreateProjectModal
      :show-create-modal="projectForm.showCreateModal.value"
      :editing-project-id="projectForm.editingProjectId.value"
      :new-project="projectForm.newProject.value"
      :project-labels="projectForm.projectLabels.value"
      :modality-options="projectForm.modalityOptions.value"
      :annotation-type-options="projectForm.annotationTypeOptions.value"
      :is-metadata-loading="projectForm.isMetadataLoading.value"
      :selected-task-object="projectForm.selectedTaskObject.value"
      @update:show-create-modal="projectForm.showCreateModal.value = $event"
      @modality-change="projectForm.onModalityChange"
      @select-task="projectForm.handleSelectTask"
      @ai-prompt-submit="projectForm.handleAiPromptSubmit"
      @add-label="projectForm.handleAddProjectLabel"
      @remove-label="projectForm.handleRemoveProjectLabel"
      @submit="projectForm.handleCreateProject"
    />

    <!-- Upload Dataset Modal -->
    <UploadDatasetModal
      :show-upload-modal="showUploadModal"
      :is-uploading="isUploading"
      :upload-name="uploadName"
      @update:show-upload-modal="showUploadModal = $event"
      @update:upload-name="uploadName = $event"
      @file-select="handleFileSelect"
      @submit="handleUploadDataset"
    />
  </div>
</template>
