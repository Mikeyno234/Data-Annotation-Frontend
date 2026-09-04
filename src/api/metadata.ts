import apiClient from './client'

export interface MetadataOption {
  value: string
  label: string
  parent_id?: number
  level?: 'CATEGORY' | 'SUB_TYPE'
  tool_type?: string
  label_config?: string
  description?: string
  instructions?: string
  badges?: string[] | string
  preview_image_url?: string
  preview_data?: any
  sub_options?: any
}

export interface AnnotationOptions {
  modalities: MetadataOption[]
  annotation_types: MetadataOption[]
}

export const metadataApi = {
  getAnnotationOptions(modality?: string) {
    return apiClient.get<{ success: boolean; data: AnnotationOptions }>('/metadata/annotation-options', {
      params: modality ? { modality } : undefined,
    })
  },
}
