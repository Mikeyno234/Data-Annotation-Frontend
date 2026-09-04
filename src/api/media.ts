import apiClient from './client'

export async function createDataItemMediaUrl(dataItemId: number | string): Promise<string> {
  const response = await apiClient.get<Blob>(`/data/${dataItemId}/media`, {
    responseType: 'blob',
  })
  const blob = response instanceof Blob ? response : response.data
  if (blob.type.includes('application/json')) {
    let message = 'Media file is not available'
    try {
      const body = JSON.parse(await blob.text())
      message = body.error?.message || body.message || message
    } catch {
      // Keep the generic message when the error response is not JSON.
    }
    throw new Error(message)
  }
  return URL.createObjectURL(blob)
}
