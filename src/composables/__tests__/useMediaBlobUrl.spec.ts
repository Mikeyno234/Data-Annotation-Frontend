import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { ref, effectScope } from 'vue'
import { useMediaBlobUrl } from '../useMediaBlobUrl'

let mockUrlCounter = 0
const activeCreatedUrls = new Set<string>()

vi.mock('@/api/media', () => ({
  createDataItemMediaUrl: vi.fn(async (id: number | string) => {
    mockUrlCounter++
    const url = `blob:http://localhost/mock-blob-${id}-${mockUrlCounter}`
    activeCreatedUrls.add(url)
    return url
  }),
}))

describe('useMediaBlobUrl', () => {
  const originalRevoke = URL.revokeObjectURL
  const revokeMock = vi.fn((url: string) => {
    activeCreatedUrls.delete(url)
  })

  beforeEach(() => {
    mockUrlCounter = 0
    activeCreatedUrls.clear()
    revokeMock.mockClear()
    URL.revokeObjectURL = revokeMock
  })

  afterEach(() => {
    URL.revokeObjectURL = originalRevoke
  })

  it('creates and loads object URL immediately for initial itemId', async () => {
    const itemId = ref<number | string>(101)
    const { mediaUrl, isLoading } = useMediaBlobUrl(itemId)

    expect(isLoading.value).toBe(true)

    // Wait for microtask/promise resolution
    await vi.waitFor(() => {
      expect(isLoading.value).toBe(false)
    })

    expect(mediaUrl.value).toBe('blob:http://localhost/mock-blob-101-1')
    expect(activeCreatedUrls.has('blob:http://localhost/mock-blob-101-1')).toBe(true)
    expect(revokeMock).not.toHaveBeenCalled()
  })

  it('revokes previous object URL when switching task IDs', async () => {
    const itemId = ref<number | string>(101)
    const { mediaUrl } = useMediaBlobUrl(itemId)

    await vi.waitFor(() => {
      expect(mediaUrl.value).toBe('blob:http://localhost/mock-blob-101-1')
    })

    // Switch to task 102
    itemId.value = 102

    await vi.waitFor(() => {
      expect(mediaUrl.value).toBe('blob:http://localhost/mock-blob-102-2')
    })

    // The first URL must have been revoked
    expect(revokeMock).toHaveBeenCalledWith('blob:http://localhost/mock-blob-101-1')
    expect(activeCreatedUrls.has('blob:http://localhost/mock-blob-101-1')).toBe(false)
    expect(activeCreatedUrls.has('blob:http://localhost/mock-blob-102-2')).toBe(true)
  })

  it('revokes object URL when scope is disposed / unmounted', async () => {
    const scope = effectScope()
    let result: ReturnType<typeof useMediaBlobUrl> | null = null

    scope.run(() => {
      result = useMediaBlobUrl(ref(202))
    })

    await vi.waitFor(() => {
      expect(result?.mediaUrl.value).toBe('blob:http://localhost/mock-blob-202-1')
    })

    const allocatedUrl = result!.mediaUrl.value

    // Disposing the effect scope simulates Vue component unmount
    scope.stop()

    expect(revokeMock).toHaveBeenCalledWith(allocatedUrl)
    expect(activeCreatedUrls.has(allocatedUrl)).toBe(false)
    expect(result!.mediaUrl.value).toBe('')
  })

  it('prevents race conditions by discarding and immediately revoking stale responses', async () => {
    const { createDataItemMediaUrl } = await import('@/api/media')

    let resolveFirst!: (url: string) => void
    let resolveSecond!: (url: string) => void

    vi.mocked(createDataItemMediaUrl)
      .mockImplementationOnce(
        () =>
          new Promise((res) => {
            resolveFirst = res
          })
      )
      .mockImplementationOnce(
        () =>
          new Promise((res) => {
            resolveSecond = res
          })
      )

    const itemId = ref<number | string>(1)
    const { mediaUrl } = useMediaBlobUrl(itemId)

    // Wait for the first call to createDataItemMediaUrl
    await vi.waitFor(() => {
      expect(createDataItemMediaUrl).toHaveBeenCalledWith(1)
    })

    // Rapidly change itemId before request 1 finishes
    itemId.value = 2

    // Wait for the second call
    await vi.waitFor(() => {
      expect(createDataItemMediaUrl).toHaveBeenCalledWith(2)
    })

    // Resolve second request first
    const url2 = 'blob:http://localhost/latest-url-2'
    activeCreatedUrls.add(url2)
    resolveSecond(url2)

    await vi.waitFor(() => {
      expect(mediaUrl.value).toBe(url2)
    })

    // Now resolve the stale first request
    const url1 = 'blob:http://localhost/stale-url-1'
    activeCreatedUrls.add(url1)
    resolveFirst(url1)

    await vi.waitFor(() => {
      // Stale URL should immediately be revoked
      expect(revokeMock).toHaveBeenCalledWith(url1)
    })

    // Active mediaUrl remains the latest
    expect(mediaUrl.value).toBe(url2)
  })
})
