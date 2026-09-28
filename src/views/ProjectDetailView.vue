<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import ProjectDetailHeader from '@/components/projects/ProjectDetailHeader.vue'
import ProjectExportModal from '@/components/projects/ProjectExportModal.vue'
import ProjectDataItemsTable from '@/components/projects/ProjectDataItemsTable.vue'
import UploadDatasetModal from '@/components/projects/UploadDatasetModal.vue'
import CreateBatchModal from '@/components/projects/CreateBatchModal.vue'
import CreateProjectModal from '@/components/projects/CreateProjectModal.vue'
import BatchAssignModal from '@/components/projects/BatchAssignModal.vue'
import Button from '@/components/ui/Button.vue'
import Badge from '@/components/ui/Badge.vue'
import Select, { type SelectOption } from '@/components/ui/Select.vue'
import { useProjectDetail } from '@/composables/useProjectDetail'
import { Users, Layers, Plus, UploadCloud, Database, ChevronLeft, ChevronRight } from 'lucide-vue-next'

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
  selectedBatchFilter,
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
  handleBatchFilterChange,
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

const batchScrollContainer = ref<HTMLElement | null>(null)

function scrollBatches(direction: 'left' | 'right') {
  if (batchScrollContainer.value) {
    const delta = direction === 'left' ? -260 : 260
    batchScrollContainer.value.scrollBy({ left: delta, behavior: 'smooth' })
  }
}

const quickBatchOptions = computed<SelectOption<number>[]>(() =>
  allBatches.value.map((b) => ({
    value: b.batch.id,
    label: `${b.batch.name} (${b.batch.total_items || 0})`,
  }))
)

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

    <!-- Dataset Pipeline Progress & KPI Summary (Berry MainCard Frame) -->
    <div class="relative rounded-2xl border border-border/80 bg-card p-6 shadow-xs overflow-hidden before:absolute before:size-52 before:rounded-full before:bg-primary/5 before:-top-20 before:-right-20 before:pointer-events-none space-y-4">
      <div class="flex flex-wrap items-center justify-between gap-2 relative z-10">
        <div class="flex items-center gap-2">
          <span class="text-xs font-semibold text-foreground tracking-tight">Dataset Pipeline Progress</span>
          <span class="text-xs text-primary font-mono font-medium">({{ completionPercentage }}% Completed)</span>
        </div>
        <span class="text-xs text-muted-foreground tabular-nums">
          <strong class="text-foreground font-semibold">{{ itemStatusCounts.total }}</strong> Total Items
        </span>
      </div>

      <!-- Segmented Progress Bar -->
      <div class="h-2.5 w-full rounded-full bg-muted/80 overflow-hidden flex relative z-10 shadow-inner">
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

      <!-- Pipeline Segment Metrics (Berry Soft Tonal Metric Chips) -->
      <div class="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-1 text-xs relative z-10">
        <div class="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/50 border border-border/70 shadow-2xs">
          <span class="size-2 rounded-full bg-muted-foreground/50 shrink-0"></span>
          <span class="text-muted-foreground text-[11px] font-medium">Backlog:</span>
          <span class="font-bold text-foreground ml-auto tabular-nums">{{ itemStatusCounts.new }}</span>
        </div>
        <div class="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 shadow-2xs">
          <span class="size-2 rounded-full bg-amber-500 shrink-0"></span>
          <span class="text-amber-700 dark:text-amber-300 text-[11px] font-medium">In Progress:</span>
          <span class="font-bold text-amber-800 dark:text-amber-200 ml-auto tabular-nums">{{ itemStatusCounts.inProgress }}</span>
        </div>
        <div class="flex items-center gap-2 px-3 py-2 rounded-xl bg-purple-500/10 border border-purple-500/20 shadow-2xs">
          <span class="size-2 rounded-full bg-purple-500 shrink-0"></span>
          <span class="text-purple-700 dark:text-purple-300 text-[11px] font-medium">In Review:</span>
          <span class="font-bold text-purple-800 dark:text-purple-200 ml-auto tabular-nums">{{ itemStatusCounts.review }}</span>
        </div>
        <div class="flex items-center gap-2 px-3 py-2 rounded-xl bg-rose-500/10 border border-rose-500/20 shadow-2xs">
          <span class="size-2 rounded-full bg-rose-500 shrink-0"></span>
          <span class="text-rose-700 dark:text-rose-300 text-[11px] font-medium">Rework:</span>
          <span class="font-bold text-rose-800 dark:text-rose-200 ml-auto tabular-nums">{{ itemStatusCounts.rework }}</span>
        </div>
        <div class="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 shadow-2xs">
          <span class="size-2 rounded-full bg-emerald-500 shrink-0"></span>
          <span class="text-emerald-700 dark:text-emerald-300 text-[11px] font-medium">Completed:</span>
          <span class="font-bold text-emerald-800 dark:text-emerald-200 ml-auto tabular-nums">{{ itemStatusCounts.completed }}</span>
        </div>
      </div>
    </div>

    <!-- Unified Workforce & Batch Allocations Section -->
    <div class="space-y-4">
      <!-- Section Header with Title on Left & Quick Controls on Right -->
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div class="flex items-center gap-2">
            <h2 class="text-sm font-bold text-foreground tracking-tight">Workforce & Batch Allocations</h2>
            <span
              v-if="allBatches.length > 0"
              class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20 tabular-nums"
            >
              {{ allBatches.length }} {{ allBatches.length === 1 ? 'Batch' : 'Batches' }}
            </span>
          </div>
          <p class="text-xs text-muted-foreground mt-0.5">
            Partition batch workloads across annotator teams, review stages, and quality assurance
          </p>
        </div>

        <div class="flex items-center gap-2">
          <!-- Quick Batch Jump Dropdown if more than 3 batches -->
          <div v-if="allBatches.length > 3" class="flex items-center gap-1.5 w-44 sm:w-56">
            <Layers class="size-3.5 text-muted-foreground shrink-0" :stroke-width="1.8" />
            <Select
              :model-value="activeBatchId || (allBatches[0]?.batch.id)"
              :options="quickBatchOptions"
              class-name="w-full text-xs shadow-2xs"
              @change="selectActiveBatch(Number($event))"
            />
          </div>

          <Button
            v-if="canManageWorkforce"
            variant="outline"
            class="gap-1.5 text-xs py-2 px-3.5 rounded-xl font-medium cursor-pointer shadow-2xs shrink-0"
            @click="openCreateBatchModal"
          >
            <Plus class="size-3.5" :stroke-width="1.8" />
            <span>New Batch</span>
          </Button>
        </div>
      </div>

      <!-- Batch Navigation Strip (Label Studio / Berry Horizontal Scroll Track) -->
      <div v-if="allBatches.length > 1" class="w-full min-w-0 relative flex items-center gap-1.5">
        <!-- Scroll Left Button -->
        <button
          type="button"
          class="shrink-0 size-8 rounded-xl border border-border/70 bg-card hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center shadow-2xs transition-colors cursor-pointer"
          aria-label="Scroll batches left"
          title="Scroll left"
          @click="scrollBatches('left')"
        >
          <ChevronLeft class="size-4" :stroke-width="1.8" />
        </button>

        <!-- Horizontal scrollable tab track -->
        <div
          ref="batchScrollContainer"
          class="flex-1 flex items-center gap-1.5 overflow-x-auto scroll-smooth py-1 px-1.5 bg-muted/40 rounded-2xl border border-border/70 shadow-2xs scrollbar-none"
        >
          <button
            v-for="b in allBatches"
            :key="b.batch.id"
            type="button"
            :class="[
              'px-3 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap cursor-pointer shrink-0 flex items-center gap-1.5 select-none',
              activeBatchId === b.batch.id
                ? 'bg-card text-foreground shadow-xs font-bold border border-border/80 ring-1 ring-primary/20'
                : 'text-muted-foreground hover:text-foreground hover:bg-card/50',
            ]"
            @click="selectActiveBatch(b.batch.id)"
          >
            <span
              class="size-1.5 rounded-full"
              :class="activeBatchId === b.batch.id ? 'bg-primary' : 'bg-muted-foreground/40'"
            />
            <span class="max-w-[160px] truncate">{{ b.batch.name }}</span>
            <span class="text-[10px] opacity-70 tabular-nums font-mono">
              ({{ b.batch.total_items || 0 }})
            </span>
          </button>
        </div>

        <!-- Scroll Right Button -->
        <button
          type="button"
          class="shrink-0 size-8 rounded-xl border border-border/70 bg-card hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center shadow-2xs transition-colors cursor-pointer"
          aria-label="Scroll batches right"
          title="Scroll right"
          @click="scrollBatches('right')"
        >
          <ChevronRight class="size-4" :stroke-width="1.8" />
        </button>
      </div>

      <!-- If No Batches Exist -->
      <div
        v-if="allBatches.length === 0"
        class="rounded-2xl border border-dashed border-border/80 bg-muted/10 p-12 text-center"
      >
        <Layers class="mx-auto size-10 text-muted-foreground/60" :stroke-width="1.4" />
        <h4 class="mt-3 text-sm font-semibold text-foreground">No batches created yet</h4>
        <p class="text-xs text-muted-foreground max-w-sm mx-auto mt-1">
          Batches divide datasets into structured workloads assigned to annotator teams.
        </p>
        <Button
          v-if="canManageWorkforce"
          size="sm"
          class="mt-4 gap-1.5 text-xs h-9 px-4 rounded-xl font-medium"
          @click="openCreateBatchModal"
        >
          <Plus class="size-3.5" :stroke-width="1.8" />
          <span>Create First Batch</span>
        </Button>
      </div>

      <!-- Active Batch Content -->
      <template v-else-if="activeBatch">
        <!-- Active Batch Summary Card (Berry Card with Avatar Rounded-xl & Actions) -->
        <div class="relative rounded-2xl border border-border/80 bg-card p-5 shadow-xs flex flex-wrap items-center justify-between gap-4 overflow-hidden before:absolute before:size-40 before:rounded-full before:bg-primary/5 before:-top-14 before:-right-14 before:pointer-events-none">
          <div class="flex items-center gap-3.5 min-w-0 relative z-10">
            <div class="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0 shadow-2xs">
              <Layers class="size-5" :stroke-width="1.8" />
            </div>
            <div class="min-w-0">
              <div class="flex items-center gap-2">
                <h3 class="text-sm font-bold text-foreground truncate">{{ activeBatch.name }}</h3>
                <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide uppercase bg-secondary text-secondary-foreground border border-border">
                  {{ activeBatch.status || 'OPEN' }}
                </span>
              </div>
              <div class="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
                <span v-if="activeDatasetName" class="flex items-center gap-1 font-medium text-foreground/80">
                  <Database class="size-3 text-muted-foreground" :stroke-width="1.6" />
                  {{ activeDatasetName }}
                </span>
                <span class="tabular-nums">
                  {{ (activeBatch.total_items || itemStatusCounts.total || totalDataItems).toLocaleString() }} items
                </span>
                <span class="flex items-center gap-1">
                  <Users class="size-3 text-muted-foreground" :stroke-width="1.6" />
                  <span v-if="activeBatch.assignees && activeBatch.assignees.length > 0">
                    {{ activeBatch.assignees.length }} annotator(s) assigned
                  </span>
                  <span v-else class="italic text-muted-foreground/80">No annotators assigned</span>
                </span>
              </div>
            </div>
          </div>

          <div class="flex items-center gap-2.5 shrink-0 relative z-10">
            <Button
              v-if="canUploadDataset"
              variant="outline"
              class="py-2.5 px-4 rounded-xl text-xs font-semibold gap-1.5 cursor-pointer shadow-2xs"
              @click="openUploadModalForBatch(activeBatch.id)"
            >
              <UploadCloud class="size-3.5" :stroke-width="1.6" />
              <span>Add Data</span>
            </Button>
            <Button
              v-if="canManageWorkforce"
              variant="outline"
              class="py-2.5 px-4 rounded-xl text-xs font-semibold gap-1.5 cursor-pointer shadow-2xs"
              @click="openBatchAssignModal(activeBatch)"
            >
              <Users class="size-3.5" :stroke-width="1.6" />
              <span>Assign Annotators</span>
            </Button>
          </div>
        </div>

        <!-- Data Items Table -->
        <ProjectDataItemsTable
          :data-items="dataItems"
          :batches="allBatches.map(b => b.batch)"
          :selected-batch-filter="selectedBatchFilter"
          :selected-status-filter="selectedStatusFilter"
          :my-in-progress-task="myInProgressTask"
          :current-page="currentPage"
          :page-limit="pageLimit"
          :total-data-items="totalDataItems"
          :total-pages="totalPages"
          :is-loading="isLoading"
          @update:selected-batch-filter="selectedBatchFilter = $event"
          @update:selected-status-filter="selectedStatusFilter = $event"
          @batch-filter-change="handleBatchFilterChange"
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
