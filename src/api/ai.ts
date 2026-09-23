import client from './client'

export interface PointPrompt {
  x: number
  y: number
  label: number
}

export interface AISegmentPointPayload {
  data_item_id?: number
  image_url?: string
  image_base64?: string
  points: PointPrompt[]
  label_name?: string
  canvas_width?: number
  canvas_height?: number
}

export interface AISegmentConceptPayload {
  data_item_id?: number
  image_url?: string
  image_base64?: string
  concept: string
}

export interface AIPolygonResult {
  points: [number, number][]
  label: string
  score: number
  image_width?: number
  image_height?: number
}

export interface AISegmentResponse {
  status: string
  model: string
  polygons: AIPolygonResult[]
  count: number
}

export interface AISegmentApiResponse {
  status: string
  message?: string
  data: AISegmentResponse
}

export const aiApi = {
  getStatus() {
    return client.get<any, any>('/ai/status')
  },

  segmentPoint(projectId: number | string, payload: AISegmentPointPayload) {
    return client.post<any, AISegmentApiResponse>(
      `/projects/${projectId}/ai/segment/point`,
      payload
    )
  },

  segmentConcept(projectId: number | string, payload: AISegmentConceptPayload) {
    return client.post<any, AISegmentApiResponse>(
      `/projects/${projectId}/ai/segment/concept`,
      payload
    )
  },
}
