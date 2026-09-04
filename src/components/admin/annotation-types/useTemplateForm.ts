import { ref, reactive, computed } from 'vue'
import type { AnnotationType, ModalityType } from '@/types'
import { annotationTypesApi, type CreateAnnotationTypePayload } from '@/api/annotationTypes'
import { toast } from '@/utils/toast'
import { toolsByModality, labelPresetsByModality, type ToolOption } from './templateConstants'

export function useTemplateForm(onSuccess: () => void) {
  const showModal = ref(false)
  const editingId = ref<number | null>(null)
  const isSaving = ref(false)
  const isCodeManual = ref(false)
  const isXmlMode = ref(false)

  const form = reactive<{
    code: string
    name: string
    modality: ModalityType
    level: 'CATEGORY' | 'SUB_TYPE'
    parent_id: number | null
    tool_type: string
    description: string
    instructions: string
    badgesText: string
    preview_image_url: string
    previewDataJson: string
    label_config: string
    status: 'ACTIVE' | 'INACTIVE'
  }>({
    code: '',
    name: '',
    modality: 'IMAGE',
    level: 'SUB_TYPE',
    parent_id: null,
    tool_type: 'BBOX',
    description: '',
    instructions: '',
    badgesText: '',
    preview_image_url: '',
    previewDataJson: '',
    label_config: '',
    status: 'ACTIVE',
  })

  const visualLabels = ref<Array<{ name: string; color: string }>>([])
  const newLabelName = ref('')
  const newLabelColor = ref('#38bdf8')

  const activeLabelPresets = computed(() => labelPresetsByModality[form.modality] || [])

  function buildXmlFromVisualLabels(): string {
    const currentTools = toolsByModality[form.modality] || []
    const currentTool = currentTools.find((t) => t.code === form.tool_type) || currentTools[0]
    if (currentTool) {
      return currentTool.defaultXml(visualLabels.value)
    }
    return `<View><Text name="text" value="$text"/></View>`
  }

  function onNameInput() {
    if (isCodeManual.value || editingId.value) return
    const prefix = form.modality ? form.modality.toUpperCase() : 'TASK'
    const cleanName = form.name.trim().toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_+|_+$/g, '')
    form.code = cleanName ? `${prefix}_${cleanName}` : ''
  }

  function onModalityChange() {
    if (!isCodeManual.value && !editingId.value && form.name) onNameInput()
    const currentTools = toolsByModality[form.modality] || []
    if (currentTools.length > 0 && !currentTools.some((t) => t.code === form.tool_type)) {
      selectTool(currentTools[0])
    }
  }

  function selectTool(tool: ToolOption) {
    form.tool_type = tool.code
    if (!form.instructions.trim()) form.instructions = tool.defaultInstructions
    if (!form.badgesText.trim()) form.badgesText = tool.defaultBadges.join(', ')
    if (!form.preview_image_url.trim() && tool.defaultPreviewUrl) form.preview_image_url = tool.defaultPreviewUrl
    if (!form.previewDataJson.trim() && tool.defaultPreviewData) {
      form.previewDataJson = JSON.stringify(tool.defaultPreviewData, null, 2)
    }
    if (!isXmlMode.value) {
      form.label_config = tool.defaultXml(visualLabels.value)
    }
  }

  function insertRecommendedGuidelines() {
    const currentTools = toolsByModality[form.modality] || []
    const currentTool = currentTools.find((t) => t.code === form.tool_type) || currentTools[0]
    if (currentTool) {
      form.instructions = currentTool.defaultInstructions
      toast.success('Template Applied', 'Recommended annotator guidelines inserted.')
    }
  }

  function handleAddLabel(label: { name: string; color: string }) {
    visualLabels.value.push(label)
    if (!isXmlMode.value) form.label_config = buildXmlFromVisualLabels()
  }

  function handleRemoveLabel(index: number) {
    visualLabels.value.splice(index, 1)
    if (!isXmlMode.value) form.label_config = buildXmlFromVisualLabels()
  }

  function handleApplyPreset(items: Array<{ name: string; color: string }>) {
    visualLabels.value = [...items]
    if (!isXmlMode.value) form.label_config = buildXmlFromVisualLabels()
  }

  function openCreateModal() {
    editingId.value = null
    isCodeManual.value = false
    form.code = ''
    form.name = ''
    form.modality = 'IMAGE'
    form.level = 'SUB_TYPE'
    form.parent_id = null
    form.tool_type = 'BBOX'
    form.description = ''
    form.instructions = ''
    form.badgesText = ''
    form.preview_image_url = ''
    form.previewDataJson = ''
    form.label_config = ''
    form.status = 'ACTIVE'

    visualLabels.value = [
      { name: 'car', color: '#ef4444' },
      { name: 'bus', color: '#3b82f6' },
      { name: 'truck', color: '#10b981' },
    ]
    const tool = toolsByModality.IMAGE[0]
    if (tool) selectTool(tool)
    showModal.value = true
  }

  function openEditModal(item: AnnotationType) {
    editingId.value = item.id
    isCodeManual.value = true
    form.code = item.code
    form.name = item.name
    form.modality = item.modality
    form.level = item.level || 'SUB_TYPE'
    form.parent_id = item.parent_id || null
    form.tool_type = item.tool_type || 'BBOX'
    form.description = item.description || ''
    form.instructions = item.instructions || ''
    form.badgesText = Array.isArray(item.badges) ? item.badges.join(', ') : item.badges || ''
    form.preview_image_url = item.preview_image_url || ''
    form.previewDataJson = item.preview_data ? JSON.stringify(item.preview_data, null, 2) : ''
    form.label_config = item.label_config || ''
    form.status = item.status

    visualLabels.value = [
      { name: 'object_1', color: '#38bdf8' },
      { name: 'object_2', color: '#10b981' },
    ]
    showModal.value = true
  }

  async function saveItem() {
    if (!form.name.trim()) {
      toast.warning('Validation Error', 'Schema name is required.')
      return
    }

    isSaving.value = true
    try {
      let parsedPreview = undefined
      if (form.previewDataJson.trim()) {
        try {
          parsedPreview = JSON.parse(form.previewDataJson.trim())
        } catch {
          toast.warning('Invalid JSON', 'Mock Visualizer Data is not valid JSON.')
          isSaving.value = false
          return
        }
      }

      const badges = form.badgesText ? form.badgesText.split(',').map((s) => s.trim()).filter(Boolean) : []
      const payload: CreateAnnotationTypePayload = {
        code: form.code,
        name: form.name,
        modality: form.modality,
        level: form.level,
        parent_id: form.parent_id || undefined,
        tool_type: form.tool_type,
        description: form.description,
        instructions: form.instructions,
        badges,
        preview_image_url: form.preview_image_url || undefined,
        preview_data: parsedPreview,
        label_config: form.label_config,
        status: form.status,
      }

      if (editingId.value) {
        await annotationTypesApi.updateAnnotationType(editingId.value, payload)
        toast.success('Schema Updated', `${form.name} updated successfully.`)
      } else {
        await annotationTypesApi.createAnnotationType(payload)
        toast.success('Schema Created', `${form.name} created successfully.`)
      }

      showModal.value = false
      onSuccess()
    } catch (err: any) {
      toast.error('Save Failed', err?.message || 'Could not save schema.')
    } finally {
      isSaving.value = false
    }
  }

  return {
    showModal,
    editingId,
    isSaving,
    isCodeManual,
    isXmlMode,
    form,
    visualLabels,
    newLabelName,
    newLabelColor,
    activeLabelPresets,
    onNameInput,
    onModalityChange,
    selectTool,
    insertRecommendedGuidelines,
    handleAddLabel,
    handleRemoveLabel,
    handleApplyPreset,
    openCreateModal,
    openEditModal,
    saveItem,
  }
}
