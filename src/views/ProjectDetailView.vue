<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute } from 'vue-router'
import ProjectDetailHeader from '@/components/projects/ProjectDetailHeader.vue'
import ProjectExportModal from '@/components/projects/ProjectExportModal.vue'
import ProjectDataItemsTable from '@/components/projects/ProjectDataItemsTable.vue'
import UploadDatasetModal from '@/components/projects/UploadDatasetModal.vue'
import CreateBatchModal from '@/components/projects/CreateBatchModal.vue'
import CreateProjectModal from '@/components/projects/CreateProjectModal.vue'
import BatchAssignModal from '@/components/projects/BatchAssignModal.vue'
import Card from '@/components/ui/Card.vue'
import CardContent from '@/components/ui/CardContent.vue'
import Button from '@/components/ui/Button.vue'
import Badge from '@/components/ui/Badge.vue'
import { useProjectDetail } from '@/composables/useProjectDetail'
import { Users, Layers, Plus, UploadCloud, Database } from 'lucide-vue-next'

const route = useRoute()
const projectId = route.params.id as string

const {
  project,
  datasets,
  dataItems,
  isLoading,
  canUploadDataset,
  canEditProject,
  canManageWorkforce,
  canExport,
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
  activeBatchId,
  activeBatch,
  activeDatasetName,
  selectActiveBatch,
} = useProjectDetail(projectId)

onMounted(fetchProjectData)
</script>

<template>
  <div class="flex flex-col gap-6 max-w-7xl mx-auto w-full pb-10 font-sans">
    <!-- Project Detail Header -->
    <ProjectDetailHeader
      :project="project"
      :datasets="datasets"
      :can-export="canExport"
      :can-upload="canUploadDataset"
      :can-edit="canEditProject"
      @export="openExportModal"
      @upload="openUploadModal"
      @edit="handleOpenEditModal"
    />

    <!-- Dataset Pipeline Progress & KPI Summary (Coss UI Card Frame) -->
    <Card class="border-border/70">
      <CardContent class="p-5 space-y-4">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div class="flex items-center gap-2">
            <span class="text-xs font-semibold text-foreground tracking-tight">Dataset Pipeline Progress</span>
            <span class="text-xs text-muted-foreground font-mono">({{ completionPercentage }}% Completed)</span>
          </div>
          <span class="text-xs text-muted-foreground tabular-nums">
            {{ itemStatusCounts.total }} Total Items
          </span>
        </div>

        <!-- Segmented Progress Bar -->
        <div class="h-2 w-full rounded-full bg-muted/60 overflow-hidden flex">
          <div
            class="bg-emerald-500 transition-all duration-300"
            :style="{ width: `${itemStatusCounts.total ? (itemStatusCounts.completed / itemStatusCounts.total) * 100 : 0}%` }"
            title="Completed"
          />
          <div
            class="bg-purple-500 transition-all duration-300"
            :style="{ width: `${itemStatusCounts.total ? (itemStatusCounts.review / itemStatusCounts.total) * 100 : 0}%` }"
            title="In Review / QA"
          />
          <div
            class="bg-amber-500 transition-all duration-300"
            :style="{ width: `${itemStatusCounts.total ? (itemStatusCounts.inProgress / itemStatusCounts.total) * 100 : 0}%` }"
            title="In Progress"
          />
          <div
            class="bg-rose-500 transition-all duration-300"
            :style="{ width: `${itemStatusCounts.total ? (itemStatusCounts.rework / itemStatusCounts.total) * 100 : 0}%` }"
            title="Rework / Rejected"
          />
        </div>

        <!-- Pipeline Segment Metrics -->
        <div class="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1 text-xs">
          <div class="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/40 border border-border/60">
            <span class="size-2 rounded-full bg-muted-foreground/50 shrink-0"></span>
            <span class="text-muted-foreground text-[11px]">Backlog:</span>
            <span class="font-medium text-foreground ml-auto tabular-nums">{{ itemStatusCounts.new }}</span>
          </div>
          <div class="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <span class="size-2 rounded-full bg-amber-500 shrink-0"></span>
            <span class="text-amber-700 dark:text-amber-300 text-[11px]">In Progress:</span>
            <span class="font-medium text-amber-800 dark:text-amber-200 ml-auto tabular-nums">{{ itemStatusCounts.inProgress }}</span>
          </div>
          <div class="flex items-center gap-2 px-3 py-2 rounded-xl bg-purple-500/10 border border-purple-500/20">
            <span class="size-2 rounded-full bg-purple-500 shrink-0"></span>
            <span class="text-purple-700 dark:text-purple-300 text-[11px]">In Review:</span>
            <span class="font-medium text-purple-800 dark:text-purple-200 ml-auto tabular-nums">{{ itemStatusCounts.review }}</span>
          </div>
          <div class="flex items-center gap-2 px-3 py-2 rounded-xl bg-rose-500/10 border border-rose-500/20">
            <span class="size-2 rounded-full bg-rose-500 shrink-0"></span>
            <span class="text-rose-700 dark:text-rose-300 text-[11px]">Rework:</span>
            <span class="font-medium text-rose-800 dark:text-rose-200 ml-auto tabular-nums">{{ itemStatusCounts.rework }}</span>
          </div>
          <div class="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <span class="size-2 rounded-full bg-emerald-500 shrink-0"></span>
            <span class="text-emerald-700 dark:text-emerald-300 text-[11px]">Completed:</span>
            <span class="font-medium text-emerald-800 dark:text-emerald-200 ml-auto tabular-nums">{{ itemStatusCounts.completed }}</span>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Unified Workforce & Batch Allocations Section (Fundamental Hierarchy) -->
    <div class="space-y-4">
      <!-- Section Header with Batch Switcher & New Batch CTA -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 class="text-sm font-semibold text-foreground tracking-tight">Workforce & Batch Allocations</h2>
          <p class="text-xs text-muted-foreground">
            Partition batch workloads across annotator teams, review stages, and quality assurance
          </p>
        </div>

        <div class="flex items-center gap-2">
          <!-- Batch Switcher if multiple batches exist -->
          <div v-if="allBatches.length > 1" class="flex items-center gap-1.5 p-1 bg-muted/50 rounded-lg border border-border/60">
            <span class="text-[11px] text-muted-foreground px-1.5 font-medium">Batch:</span>
            <button
              v-for="b in allBatches"
              :key="b.batch.id"
              type="button"
              :class="[
                'px-2.5 py-1 rounded-md text-xs font-medium transition-all whitespace-nowrap cursor-pointer',
                activeBatchId === b.batch.id
                  ? 'bg-background text-foreground shadow-2xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground',
              ]"
              @click="selectActiveBatch(b.batch.id)"
            >
              {{ b.batch.name }}
            </button>
          </div>

          <Button
            v-if="canManageWorkforce"
            variant="outline"
            size="sm"
            class="gap-1.5 text-xs h-8 cursor-pointer"
            @click="openCreateBatchModal"
          >
            <Plus class="size-3.5" :stroke-width="1.8" />
            <span>New Batch</span>
          </Button>
        </div>
      </div>

      <!-- If No Batches Exist -->
      <div
        v-if="allBatches.length === 0"
        class="rounded-2xl border border-dashed border-border/80 bg-muted/10 p-10 text-center"
      >
        <Layers class="mx-auto size-9 text-muted-foreground/60" :stroke-width="1.4" />
        <h4 class="mt-3 text-sm font-semibold text-foreground">No batches created yet</h4>
        <p class="text-xs text-muted-foreground max-w-sm mx-auto mt-1">
          Batches divide datasets into structured workloads assigned to annotator teams.
        </p>
        <Button
          v-if="canManageWorkforce"
          variant="outline"
          size="sm"
          class="mt-4 gap-1.5 text-xs"
          @click="openCreateBatchModal"
        >
          <Plus class="size-3.5" :stroke-width="1.8" />
          <span>Create First Batch</span>
        </Button>
      </div>

      <!-- Active Batch Content -->
      <template v-else-if="activeBatch">
        <!-- Active Batch Summary Card (Pool-based Workforce & Actions) -->
        <Card class="border-border/70 shadow-xs">
          <CardContent class="p-4 flex flex-wrap items-center justify-between gap-4">
            <div class="flex items-center gap-3 min-w-0">
              <div class="flex size-9 items-center justify-center rounded-lg bg-muted text-foreground border border-border shrink-0">
                <Layers class="size-4" :stroke-width="1.7" />
              </div>
              <div class="min-w-0">
                <div class="flex items-center gap-2">
                  <h3 class="text-sm font-semibold text-foreground truncate">{{ activeBatch.name }}</h3>
                  <Badge variant="secondary">{{ activeBatch.status || 'OPEN' }}</Badge>
                </div>
                <div class="flex items-center gap-3 mt-0.5 text-[11px] text-muted-foreground">
                  <span v-if="activeDatasetName" class="flex items-center gap-1">
                    <Database class="size-3" :stroke-width="1.6" />
                    {{ activeDatasetName }}
                  </span>
                  <span class="tabular-nums">
                    {{ (activeBatch.total_items || itemStatusCounts.total || totalDataItems).toLocaleString() }} items
                  </span>
                  <span class="flex items-center gap-1">
                    <Users class="size-3" :stroke-width="1.6" />
                    <span v-if="activeBatch.assignees && activeBatch.assignees.length > 0">
                      {{ activeBatch.assignees.length }} annotator(s) assigned
                    </span>
                    <span v-else class="italic text-muted-foreground/80">No annotators assigned</span>
                  </span>
                </div>
              </div>
            </div>

            <div class="flex items-center gap-2 shrink-0">
              <Button
                v-if="canUploadDataset"
                variant="ghost"
                size="sm"
                class="h-8 px-2.5 text-xs gap-1.5 cursor-pointer"
                @click="openUploadModalForBatch(activeBatch.id)"
              >
                <UploadCloud class="size-3.5" :stroke-width="1.6" />
                <span>Add Data</span>
              </Button>
              <Button
                v-if="canManageWorkforce"
                variant="outline"
                size="sm"
                class="h-8 px-3 text-xs gap-1.5 cursor-pointer"
                @click="openBatchAssignModal(activeBatch)"
              >
                <Users class="size-3.5" :stroke-width="1.6" />
                <span>Assign Annotators</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        <!-- Data Items Table -->
        <ProjectDataItemsTable
          :data-items="dataItems"
          :selected-status-filter="selectedStatusFilter"
          :my-in-progress-task="myInProgressTask"
          :current-page="currentPage"
          :page-limit="pageLimit"
          :total-data-items="totalDataItems"
          :total-pages="totalPages"
          :is-loading="isLoading"
          @update:selected-status-filter="selectedStatusFilter = $event"
          @filter-change="handleStatusFilterChange"
          @page-change="handlePageChange"
          @limit-change="handleLimitChange"
          @checkout-next="handleCheckoutNext"
          @open-task="openTaskInWorkspace"
        />
      </template>
    </div>

    <!-- Batch Assign Workforce Modal (Extracted Subcomponent) -->
    <BatchAssignModal
      :open="showBatchAssignModal"
      :batch="selectedBatchToAssign"
      :selected-user-ids="selectedBatchUserIds"
      :annotators="filteredBatchAnnotators"
      :is-assigning="isAssigningBatch"
      :filter-org-only="filterOrgOnly"
      :search-query="annotatorSearchQuery"
      @close="showBatchAssignModal = false"
      @toggle-user="toggleBatchUser"
      @confirm="handleConfirmBatchAssign"
      @update:filter-org-only="filterOrgOnly = $event"
      @update:search-query="annotatorSearchQuery = $event"
    />

    <!-- Create Batch Modal -->
    <CreateBatchModal
      :open="showCreateBatchModal"
      :annotators="filteredBatchAnnotators"
      :is-creating="isCreatingBatch"
      @close="showCreateBatchModal = false"
      @submit="handleCreateBatch"
    />

    <!-- Upload Dataset Modal -->
    <UploadDatasetModal
      :show-upload-modal="showUploadModal"
      :upload-name="uploadName"
      :selected-files="selectedUploadFiles"
      :is-uploading="isUploading"
      :existing-batches="allBatches.map(b => b.batch)"
      @update:show-upload-modal="showUploadModal = $event"
      @select-files="handleFilesSelected"
      @clear-files="handleClearFiles"
      @submit="handleUploadDataset"
    />

    <!-- Export Modal -->
    <ProjectExportModal
      :show-modal="showExportModal"
      :available-formats="availableFormats"
      :export-format="exportFormat"
      :is-exporting="isExporting"
      @update:show-modal="showExportModal = $event"
      @update:export-format="exportFormat = $event"
      @export="handleExportDataset"
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
