<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { annotationTypesApi } from '@/api/annotationTypes'
import { toast } from '@/utils/toast'
import type { AnnotationType } from '@/types'
import Pagination from '@/components/ui/Pagination.vue'
import TemplateCard from '@/components/admin/annotation-types/TemplateCard.vue'
import TemplateFilterBar from '@/components/admin/annotation-types/TemplateFilterBar.vue'
import TemplateEditorModal from '@/components/admin/annotation-types/TemplateEditorModal.vue'
import { useTemplateForm } from '@/components/admin/annotation-types/useTemplateForm'
import {
  modalityList,
  toolsByModality,
} from '@/components/admin/annotation-types/templateConstants'

const authStore = useAuthStore()

// Permissions
const canCreate = computed(() => authStore.isSuperAdmin || authStore.hasPermission('project.create'))
const canUpdate = computed(() => authStore.isSuperAdmin || authStore.hasPermission('project.update'))
const canDelete = computed(() => authStore.isSuperAdmin || authStore.hasPermission('project.delete'))

// Filter & Pagination State
const items = ref<AnnotationType[]>([])
const isLoading = ref(true)
const searchQuery = ref('')
const selectedModality = ref<string>('ALL')
const currentPage = ref(1)
const pageLimit = ref(12)
const totalItems = ref(0)
const totalPages = ref(1)

let searchTimeout: any = null

async function loadItems() {
  isLoading.value = true
  try {
    const res: any = await annotationTypesApi.getAnnotationTypes({
      page: currentPage.value,
      limit: pageLimit.value,
      search: searchQuery.value,
      modality: selectedModality.value === 'ALL' ? undefined : selectedModality.value,
    })
    const payload = res?.data !== undefined ? res.data : res
    items.value = Array.isArray(payload) ? payload : (payload?.data || [])
    const pagination = res?.pagination || payload?.pagination
    totalItems.value = pagination?.total ?? (pagination?.total_items ?? items.value.length)
    totalPages.value = pagination?.total_pages ?? 1
  } catch (err: any) {
    toast.error('Failed to load schemas', err?.message || 'Network error')
  } finally {
    isLoading.value = false
  }
}

const templateForm = useTemplateForm(() => loadItems())

function handleSearch(val: string) {
  searchQuery.value = val
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    currentPage.value = 1
    loadItems()
  }, 300)
}

function handleModalitySelect(val: string) {
  selectedModality.value = val
  currentPage.value = 1
  loadItems()
}

async function deleteItem(item: AnnotationType) {
  if (!confirm(`Are you sure you want to delete "${item.name}"?`)) return
  try {
    await annotationTypesApi.deleteAnnotationType(item.id)
    toast.success('Schema Deleted', `${item.name} removed.`)
    loadItems()
  } catch (err: any) {
    toast.error('Delete Failed', err?.message || 'Could not delete schema.')
  }
}

import { useRouter } from 'vue-router'
const router = useRouter()

function handleCreateProjectWithTemplate(item: AnnotationType) {
  router.push({ path: '/projects', query: { new: 'true', template: item.code } })
}

onMounted(() => loadItems())
</script>

<template>
  <div class="space-y-6">
    <TemplateFilterBar
      :search-query="searchQuery"
      :selected-modality="selectedModality"
      :total-items="totalItems"
      :can-create="canCreate"
      :modality-list="modalityList"
      @update:search-query="handleSearch"
      @update:selected-modality="handleModalitySelect"
      @open-create-modal="templateForm.openCreateModal"
    />

    <!-- Templates Grid -->
    <div v-if="isLoading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      <div v-for="i in 8" :key="i" class="h-64 rounded-3xl bg-muted/40 animate-pulse"></div>
    </div>

    <div v-else-if="items.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      <TemplateCard
        v-for="item in items"
        :key="item.id"
        :item="item"
        :can-update="canUpdate"
        :can-delete="canDelete"
        @edit="templateForm.openEditModal"
        @delete="deleteItem"
        @create-project="handleCreateProjectWithTemplate"
      />
    </div>

    <div v-else class="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border/60 p-12 text-center bg-card/40">
      <p class="text-sm font-bold text-foreground">No schema templates found</p>
      <p class="mt-1 text-xs text-muted-foreground">Try clearing your filters or create a new template.</p>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="flex justify-center pt-4">
      <Pagination
        :page="currentPage"
        :limit="pageLimit"
        :total="totalItems"
        @change="currentPage = $event.page; loadItems()"
      />
    </div>

    <!-- Create/Edit Modal -->
    <TemplateEditorModal
      :show-modal="templateForm.showModal.value"
      :editing-id="templateForm.editingId.value"
      :is-saving="templateForm.isSaving.value"
      :is-code-manual="templateForm.isCodeManual.value"
      :form="templateForm.form"
      :is-xml-mode="templateForm.isXmlMode.value"
      :visual-labels="templateForm.visualLabels.value"
      :new-label-name="templateForm.newLabelName.value"
      :new-label-color="templateForm.newLabelColor.value"
      :modality-list="modalityList"
      :tools-by-modality="toolsByModality"
      :active-label-presets="templateForm.activeLabelPresets.value"
      @update:show-modal="templateForm.showModal.value = $event"
      @update:is-xml-mode="templateForm.isXmlMode.value = $event"
      @name-input="templateForm.onNameInput"
      @modality-change="templateForm.onModalityChange"
      @select-tool="templateForm.selectTool"
      @insert-guidelines="templateForm.insertRecommendedGuidelines"
      @add-label="templateForm.handleAddLabel"
      @remove-label="templateForm.handleRemoveLabel"
      @apply-preset="templateForm.handleApplyPreset"
      @save="templateForm.saveItem"
    />
  </div>
</template>
