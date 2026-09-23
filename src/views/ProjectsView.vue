<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import Pagination from '@/components/ui/Pagination.vue'
import Button from '@/components/ui/Button.vue'
import ProjectCard from '@/components/projects/ProjectCard.vue'
import ProjectTableView from '@/components/projects/ProjectTableView.vue'
import ProjectFilterBar from '@/components/projects/ProjectFilterBar.vue'
import ProjectPreviewDrawer from '@/components/projects/ProjectPreviewDrawer.vue'
import CreateProjectModal from '@/components/projects/CreateProjectModal.vue'
import UploadDatasetModal from '@/components/projects/UploadDatasetModal.vue'
import { useProjects } from '@/composables/useProjects'
import { useProjectForm } from '@/components/projects/useProjectForm'
import { FolderKanban, Plus } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const canCreateProject = computed(() => authStore.hasPermission('project.create'))
const canEditProject = computed(() => authStore.hasPermission('project.update'))
const canUploadDataset = computed(() => authStore.hasPermission('dataset.create'))

const {
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
} = useProjects()

const projectForm = useProjectForm(() => fetchProjects())

onMounted(async () => {
  await Promise.all([
    fetchModalities(),
    fetchProjects(),
    projectForm.fetchMetadata(),
  ])

  // If redirected with action=create
  if (route.query.action === 'create' && canCreateProject.value) {
    projectForm.openCreateModal()
    router.replace({ query: {} })
  }
})
</script>

<template>
  <div class="flex flex-col gap-6 max-w-7xl mx-auto w-full pb-10">
    <!-- Search & Discovery Filter Bar (SaaS Search-Flows) -->
    <ProjectFilterBar
      :search-query="searchQuery"
      :selected-modality="selectedModality"
      :modalities="dynamicModalities"
      :can-create-project="canCreateProject"
      :total-count="totalProjects"
      :view-mode="viewMode"
      @update:search-query="handleSearchInput"
      @update:selected-modality="setModalityFilter"
      @update:view-mode="setViewMode"
      @clear-search="clearSearch"
      @create="projectForm.openCreateModal()"
    />

    <!-- Main Content Area -->
    <div>
      <!-- Skeleton Loading State -->
      <div
        v-if="isLoading"
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        <div
          v-for="i in 6"
          :key="i"
          class="h-48 rounded-2xl border border-border/60 bg-card p-5 animate-pulse flex flex-col justify-between"
        >
          <div class="space-y-2.5">
            <div class="flex items-center justify-between">
              <div class="h-4 w-28 bg-muted rounded"></div>
              <div class="h-4 w-14 bg-muted rounded-full"></div>
            </div>
            <div class="h-3 w-40 bg-muted/60 rounded"></div>
          </div>
          <div class="h-8 w-full bg-muted/40 rounded-lg"></div>
        </div>
      </div>

      <!-- Empty State -->
      <div
        v-else-if="projects.length === 0"
        class="rounded-2xl border border-dashed border-border/80 bg-muted/10 p-12 text-center"
      >
        <FolderKanban class="mx-auto size-10 text-muted-foreground/60" :stroke-width="1.4" />
        <h3 class="mt-3 text-sm font-semibold text-foreground">No projects found</h3>
        <p class="text-xs text-muted-foreground max-w-sm mx-auto mt-1">
          {{ searchQuery ? `No matches for "${searchQuery}". Try adjusting your filters.` : 'Get started by creating your first annotation project.' }}
        </p>
        <div class="mt-4 flex items-center justify-center gap-2">
          <Button
            v-if="searchQuery"
            variant="outline"
            size="sm"
            class="text-xs"
            @click="clearSearch"
          >
            Clear Filters
          </Button>
          <Button
            v-if="canCreateProject"
            size="sm"
            class="gap-1.5 text-xs"
            @click="projectForm.openCreateModal()"
          >
            <Plus class="size-3.5" :stroke-width="1.8" />
            <span>Create Project</span>
          </Button>
        </div>
      </div>

      <!-- Table View (TailAdmin eCommerce style) -->
      <ProjectTableView
        v-else-if="viewMode === 'table'"
        :projects="projects"
        :is-loading="isLoading"
        :can-upload-dataset="canUploadDataset"
        @preview="openPreview"
        @upload="openUploadModal"
      />

      <!-- Bento Grid View (Coss UI Cards) -->
      <div
        v-else
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        <ProjectCard
          v-for="project in projects"
          :key="project.id"
          :project="project"
          :can-edit-project="canEditProject"
          :can-upload-dataset="canUploadDataset"
          @edit="projectForm.openEditModal"
          @upload="openUploadModal(project.id, project.modality)"
        />
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="mt-6 flex justify-center">
        <Pagination
          :page="currentPage"
          :limit="pageLimit"
          :total="totalProjects"
          :total-pages="totalPages"
          @change="handlePageChange"
        />
      </div>
    </div>

    <!-- Side Panel Quick View Drawer (SaaS Search-Flows) -->
    <ProjectPreviewDrawer
      :open="showPreviewDrawer"
      :project="selectedProjectForPreview"
      @close="closePreview"
      @upload="openUploadModal"
    />

    <!-- Upload Dataset Modal -->
    <UploadDatasetModal
      :show-upload-modal="showUploadModal"
      :upload-name="uploadName"
      :selected-files="selectedUploadFiles"
      :is-uploading="isUploading"
      @update:show-upload-modal="showUploadModal = $event"
      @select-files="handleFilesSelected"
      @clear-files="handleClearFiles"
      @submit="handleUploadDataset"
    />

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
      :available-annotators="projectForm.availableAnnotators.value"
      @update:show-create-modal="projectForm.showCreateModal.value = $event"
      @modality-change="projectForm.onModalityChange"
      @select-task="projectForm.handleSelectTask"
      @add-label="projectForm.handleAddProjectLabel"
      @update-label-color="projectForm.handleUpdateProjectLabelColor"
      @remove-label="projectForm.handleRemoveProjectLabel"
      @submit="projectForm.handleCreateProject"
    />
  </div>
</template>
