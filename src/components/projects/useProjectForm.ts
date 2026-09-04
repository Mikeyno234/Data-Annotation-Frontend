import { ref, computed } from 'vue'
import { projectsApi } from '@/api/projects'
import { metadataApi, type MetadataOption } from '@/api/metadata'
import type { Project, LabelOption } from '@/types'
import { toast } from '@/utils/toast'

export function useProjectForm(onSuccess: () => void) {
  const showCreateModal = ref(false)
  const editingProjectId = ref<number | null>(null)
  const newProject = ref({
    name: '',
    code: '',
    description: '',
    modality: '',
    annotation_type: '',
    label_config: '',
  })

  const projectLabels = ref<LabelOption[]>([])
  const modalityOptions = ref<{ value: string; label: string }[]>([])
  const annotationTypeOptions = ref<MetadataOption[]>([])
  const isMetadataLoading = ref(true)

  const selectedTaskObject = computed(() => {
    return annotationTypeOptions.value.find((o) => o.value === newProject.value.annotation_type) || null
  })

  function escapeXml(value: string) {
    return value.replace(/[<>&'"]/g, (c) => ({
      '<': '&lt;',
      '>': '&gt;',
      '&': '&amp;',
      "'": '&apos;',
      '"': '&quot;',
    })[c] || c)
  }

  function buildLabelConfig() {
    const labels = projectLabels.value
      .filter((l) => l.name && l.name.trim())
      .map((l) => `<Label value="${escapeXml(l.name.trim())}" background="${l.color || '#38bdf8'}"/>`)
      .join('')
    const modality = (newProject.value.modality || 'AUDIO').toUpperCase()
    const target = modality === 'AUDIO' ? 'audio' : modality.toLowerCase()
    const control = modality === 'TEXT' ? 'Labels name="label" toName="text"' : `Labels name="label" toName="${target}"`
    return `<View><${control}>${labels}</Labels></View>`
  }

  function parseProjectLabels(config?: string): LabelOption[] {
    if (!config || !config.trim()) return []
    const colors = ['#38bdf8', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#f97316', '#14b8a6']
    try {
      const doc = new DOMParser().parseFromString(config, 'application/xml')
      const nodes = Array.from(doc.querySelectorAll('Label, Choice'))
      if (nodes.length > 0) {
        return nodes.map((l, index) => ({
          name: l.getAttribute('value')?.trim() || l.getAttribute('alias')?.trim() || '',
          color: l.getAttribute('background') || l.getAttribute('predicted_values') || colors[index % colors.length],
        })).filter((l) => l.name)
      }
    } catch {
      // Regex fallback
    }

    const matches = [...config.matchAll(/<(?:Label|Choice)[^>]*?(?:value|alias)=["']([^"']+)["'][^>]*?>/gi)]
    return matches.map((m, idx) => {
      const name = m[1] || ''
      const bgMatch = m[0].match(/background=["']([^"']+)["']/i)
      const color = bgMatch ? bgMatch[1] : colors[idx % colors.length]
      return { name: name.trim(), color }
    }).filter((l) => l.name)
  }

  function applyTemplateLabels(taskVal?: string) {
    const currentVal = taskVal || newProject.value.annotation_type
    const opt = annotationTypeOptions.value.find((o) => o.value === currentVal || o.label === currentVal)
    if (opt && opt.label_config) {
      newProject.value.label_config = opt.label_config
      projectLabels.value = parseProjectLabels(opt.label_config)
    } else if (!newProject.value.label_config) {
      newProject.value.label_config = buildLabelConfig()
      projectLabels.value = parseProjectLabels(newProject.value.label_config)
    } else {
      projectLabels.value = parseProjectLabels(newProject.value.label_config)
    }
  }

  async function onModalityChange(modality: string) {
    newProject.value.modality = modality
    await refreshAnnotationTypes()
    if (annotationTypeOptions.value.length > 0) {
      newProject.value.annotation_type = annotationTypeOptions.value[0].value
      applyTemplateLabels(newProject.value.annotation_type)
    } else {
      newProject.value.annotation_type = ''
      projectLabels.value = []
      newProject.value.label_config = ''
    }
  }

  function handleSelectTask(opt: MetadataOption) {
    newProject.value.annotation_type = opt.value
    applyTemplateLabels(opt.value)
  }

  function handleAiPromptSubmit(prompt: string) {
    const query = prompt.toLowerCase().trim()
    let targetModality = ''
    let targetPattern = ''

    if (/pose|skeleton|athlete|keypoint|joint/.test(query)) {
      targetModality = 'IMAGE'
      targetPattern = 'KEYPOINT'
    } else if (/car|traffic|vehicle|bounding|box|detect|count|track/.test(query)) {
      targetModality = 'IMAGE'
      targetPattern = 'BBOX'
    } else if (/polygon|segment|mask|circuit|boundary|tumor|organ/.test(query)) {
      targetModality = 'IMAGE'
      targetPattern = 'POLYGON'
    } else if (/sentiment|review|intent|classify|topic|document/.test(query)) {
      targetModality = 'TEXT'
      targetPattern = 'CLASSIFICATION'
    } else if (/ner|entity|name|person|token|extraction|tagging/.test(query)) {
      targetModality = 'TEXT'
      targetPattern = 'NER'
    } else if (/speech|audio|voice|diariz|transcript|listen|sound/.test(query)) {
      targetModality = 'AUDIO'
      targetPattern = 'TRANSCRIPT'
    } else if (/video|action|timeline|second|frame|scene|movie/.test(query)) {
      targetModality = 'VIDEO'
      targetPattern = 'TIMELINE'
    }

    if (targetModality && targetModality !== newProject.value.modality) {
      onModalityChange(targetModality).then(() => {
        const match = annotationTypeOptions.value.find((o) => o.value.includes(targetPattern) || o.label.includes(targetPattern))
        if (match) handleSelectTask(match)
      })
    } else if (targetPattern) {
      const match = annotationTypeOptions.value.find((o) => o.value.includes(targetPattern) || o.label.includes(targetPattern))
      if (match) handleSelectTask(match)
    }
  }

  function handleAddProjectLabel(name: string, color: string) {
    if (projectLabels.value.some((l) => l.name.toLowerCase() === name.toLowerCase())) return
    projectLabels.value.push({ name, color })
    newProject.value.label_config = buildLabelConfig()
  }

  function handleRemoveProjectLabel(index: number) {
    projectLabels.value.splice(index, 1)
    newProject.value.label_config = buildLabelConfig()
  }

  async function fetchMetadata() {
    isMetadataLoading.value = true
    try {
      const res: any = await metadataApi.getAnnotationOptions(newProject.value.modality)
      const data = res.data || res
      modalityOptions.value = data.modalities || []
      annotationTypeOptions.value = data.annotation_types || []
      if (!newProject.value.modality && modalityOptions.value[0]) newProject.value.modality = modalityOptions.value[0].value
    } catch (err: any) {
      toast.error('Failed to load project options', err?.message)
    } finally {
      isMetadataLoading.value = false
    }
  }

  async function refreshAnnotationTypes() {
    if (!newProject.value.modality) return
    try {
      const res: any = await metadataApi.getAnnotationOptions(newProject.value.modality)
      const data = res.data || res
      annotationTypeOptions.value = data.annotation_types || []
    } catch {
      annotationTypeOptions.value = []
    }
  }

  async function openCreateModal(initialTemplateCode?: string) {
    editingProjectId.value = null
    const defaultModality = modalityOptions.value[0]?.value || 'IMAGE'
    newProject.value = {
      name: '',
      code: `PRJ-${Date.now().toString().slice(-6)}`,
      description: '',
      modality: defaultModality,
      annotation_type: '',
      label_config: '',
    }
    projectLabels.value = []
    await refreshAnnotationTypes()

    if (initialTemplateCode) {
      const match = annotationTypeOptions.value.find(
        (o) => o.value === initialTemplateCode || o.label.toLowerCase() === initialTemplateCode.toLowerCase()
      )
      if (match) {
        newProject.value.annotation_type = match.value
        if ((match as any).modality) newProject.value.modality = (match as any).modality
        applyTemplateLabels(match.value)
        newProject.value.name = `${match.label} Project`
      }
    } else if (!newProject.value.annotation_type && annotationTypeOptions.value[0]) {
      newProject.value.annotation_type = annotationTypeOptions.value[0].value
      applyTemplateLabels(newProject.value.annotation_type)
    }

    showCreateModal.value = true
  }

  async function openEditModal(project: Project) {
    editingProjectId.value = project.id
    newProject.value = {
      name: project.name,
      code: project.code,
      description: project.description || '',
      modality: project.modality,
      annotation_type: project.annotation_type,
      label_config: project.label_config || '',
    }
    projectLabels.value = parseProjectLabels(project.label_config)
    await refreshAnnotationTypes()
    showCreateModal.value = true
  }

  async function handleCreateProject() {
    if (!newProject.value.name || !newProject.value.code) {
      toast.error('Validation Error', 'Project name and code are required')
      return
    }
    if (!newProject.value.label_config) {
      applyTemplateLabels(newProject.value.annotation_type)
    }

    try {
      if (editingProjectId.value) {
        await projectsApi.updateProject(editingProjectId.value, newProject.value)
        toast.success('Project Updated', `${newProject.value.name} configuration was saved`)
      } else {
        await projectsApi.createProject(newProject.value)
        toast.success('Project Created', `Project ${newProject.value.name} is ready`)
      }
      showCreateModal.value = false
      onSuccess()
    } catch (err: any) {
      toast.error(editingProjectId.value ? 'Update Failed' : 'Create Failed', err?.message)
    }
  }

  return {
    showCreateModal,
    editingProjectId,
    newProject,
    projectLabels,
    modalityOptions,
    annotationTypeOptions,
    isMetadataLoading,
    selectedTaskObject,
    onModalityChange,
    handleSelectTask,
    handleAiPromptSubmit,
    handleAddProjectLabel,
    handleRemoveProjectLabel,
    fetchMetadata,
    openCreateModal,
    openEditModal,
    handleCreateProject,
  }
}
