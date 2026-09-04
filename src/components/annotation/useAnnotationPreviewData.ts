import { computed, type Ref } from 'vue'
import type { MetadataOption } from '@/api/metadata'
import type { AnnotationType } from '@/types'
import type {
  BoundingBoxItem,
  PolygonMaskItem,
  KeypointItem,
  ImageTagItem,
} from './preview/ImageTypePreview.vue'
import type { AudioSegmentItem } from './preview/AudioTypePreview.vue'
import type { VideoActionItem } from './preview/VideoTypePreview.vue'

export function useAnnotationPreviewData(
  task: Ref<MetadataOption | AnnotationType | null | undefined>,
  modality: Ref<string | undefined>,
  customTextContent: Ref<string | null>,
  fallbackTitle?: Ref<string | undefined>
) {
  const itemTitle = computed(() => {
    if (!task.value) return fallbackTitle?.value || 'Interactive Workspace Preview'
    return (
      ('name' in task.value ? task.value.name : (task.value as MetadataOption).label) ||
      fallbackTitle?.value ||
      'Interactive Workspace Preview'
    )
  })

  const itemCode = computed(() => {
    if (!task.value) return ''
    return ('code' in task.value ? task.value.code : (task.value as MetadataOption).value) || ''
  })

  const itemModality = computed(() => {
    if (task.value && 'modality' in task.value && task.value.modality) {
      return String(task.value.modality).toUpperCase()
    }
    return (modality.value || 'IMAGE').toUpperCase()
  })

  const parsedPreviewData = computed<any>(() => {
    const d = task.value?.preview_data
    if (!d) return null
    if (typeof d === 'object') return d
    try {
      return JSON.parse(d)
    } catch {
      return null
    }
  })

  const previewKind = computed(() => {
    const t = task.value
    if (!t) {
      const mod = itemModality.value
      if (mod === 'IMAGE') return 'BBOX'
      if (mod === 'TEXT') return 'NER'
      if (mod === 'AUDIO') return 'AUDIO_WAVEFORM'
      if (mod === 'VIDEO') return 'VIDEO_TIMELINE'
      return 'BBOX'
    }

    if (parsedPreviewData.value?.type) {
      const pType = String(parsedPreviewData.value.type).toUpperCase()
      if (['BBOX', 'OBB', 'POLYGON', 'KEYPOINT', 'IMAGE_TAG'].includes(pType))
        return pType === 'IMAGE_TAG' ? 'IMAGE_CLS' : pType
      if (pType === 'NER_SPAN') return 'NER'
      if (pType === 'TEXT_CLASSIFICATION') return 'TEXT_CLS'
      if (pType === 'AUDIO_DIARIZATION') return 'AUDIO_WAVEFORM'
      if (pType === 'VIDEO_TIMELINE') return 'VIDEO_TIMELINE'
    }

    const code = itemCode.value.toUpperCase()
    const tool = (t.tool_type || '').toUpperCase()
    const mod = itemModality.value

    if (tool === 'POLYGON' || code.includes('SEGMENT') || code.includes('POLYGON')) return 'POLYGON'
    if (tool === 'KEYPOINT' || code.includes('KEYPOINT') || code.includes('POSE')) return 'KEYPOINT'
    if (tool === 'OBB' || code.includes('OBB') || code.includes('ROTATED')) return 'OBB'
    if (tool === 'RADIO' && (mod === 'IMAGE' || code.includes('IMAGE'))) return 'IMAGE_CLS'
    if (mod === 'TEXT' || code.includes('TEXT') || code.includes('NER')) {
      return tool === 'RADIO' || tool === 'CHOICE' || code.includes('CLASSIFICATION')
        ? 'TEXT_CLS'
        : 'NER'
    }
    if (mod === 'AUDIO' || code.includes('AUDIO') || code.includes('SPEECH') || tool === 'TRANSCRIPT')
      return 'AUDIO_WAVEFORM'
    if (mod === 'VIDEO' || code.includes('VIDEO')) return 'VIDEO_TIMELINE'
    return 'BBOX'
  })

  const dynamicBoxes = computed<BoundingBoxItem[]>(() => {
    if (parsedPreviewData.value?.boxes && Array.isArray(parsedPreviewData.value.boxes))
      return parsedPreviewData.value.boxes
    return [
      { id: '#1', label: 'target_1', x: 25, y: 30, w: 25, h: 30, color: '#38bdf8' },
      { id: '#2', label: 'target_2', x: 55, y: 40, w: 22, h: 26, color: '#10b981' },
    ]
  })

  const dynamicMasks = computed<PolygonMaskItem[]>(() => {
    if (parsedPreviewData.value?.masks && Array.isArray(parsedPreviewData.value.masks))
      return parsedPreviewData.value.masks
    return [
      { id: 'Segment 1', label: 'Region A', color: '#10b981', points: [[20, 25], [50, 22], [54, 75], [21, 80]] },
    ]
  })

  const dynamicKeypoints = computed<KeypointItem[]>(() => {
    if (parsedPreviewData.value?.points && Array.isArray(parsedPreviewData.value.points))
      return parsedPreviewData.value.points
    return [
      { name: 'Point 1', x: 50, y: 25, color: '#ef4444' },
      { name: 'Point 2', x: 50, y: 55, color: '#38bdf8' },
    ]
  })

  const dynamicNerData = computed(() => ({
    sampleText: customTextContent.value || parsedPreviewData.value?.sample_text || '',
    spans: parsedPreviewData.value?.spans || [],
  }))

  const dynamicTextClsData = computed(() => ({
    sampleText: customTextContent.value || parsedPreviewData.value?.sample_text || '',
    category: parsedPreviewData.value?.category || 'Sample Category',
    score: parsedPreviewData.value?.score || '98%',
    labels: parsedPreviewData.value?.labels || ['Class A', 'Class B'],
  }))

  const dynamicAudioSegments = computed<AudioSegmentItem[]>(() => {
    if (parsedPreviewData.value?.segments && Array.isArray(parsedPreviewData.value.segments))
      return parsedPreviewData.value.segments
    return [
      { speaker: 'Speaker 1', start: '00:00', end: '00:05', text: 'Sample audio track segment.', color: '#38bdf8' },
    ]
  })

  const dynamicVideoActions = computed<VideoActionItem[]>(() => {
    if (parsedPreviewData.value?.actions && Array.isArray(parsedPreviewData.value.actions))
      return parsedPreviewData.value.actions
    return [{ label: 'Action 1', start: '00:02', end: '00:07', color: '#38bdf8' }]
  })

  const dynamicImageTags = computed<ImageTagItem[]>(() => {
    if (parsedPreviewData.value?.tags && Array.isArray(parsedPreviewData.value.tags))
      return parsedPreviewData.value.tags
    return [{ label: 'Classified Object', color: '#8b5cf6', confidence: '95%' }]
  })

  return {
    itemTitle,
    itemCode,
    itemModality,
    parsedPreviewData,
    previewKind,
    dynamicBoxes,
    dynamicMasks,
    dynamicKeypoints,
    dynamicNerData,
    dynamicTextClsData,
    dynamicAudioSegments,
    dynamicVideoActions,
    dynamicImageTags,
  }
}
