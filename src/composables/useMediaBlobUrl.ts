import { ref, watch, onScopeDispose, getCurrentScope, toValue, type Ref, type MaybeRefOrGetter } from 'vue'
import { createDataItemMediaUrl } from '@/api/media'

export interface UseMediaBlobUrlOptions {
  /**
   * Automatically load the media URL on initialization or when id changes.
   * Defaults to true.
   */
  immediate?: boolean
  /**
   * Callback invoked when a new media URL is successfully created.
   */
  onSuccess?: (url: string) => void
  /**
   * Callback invoked when loading the media URL encounters an error.
   */
  onError?: (err: unknown) => void
}

export interface UseMediaBlobUrlReturn {
  mediaUrl: Ref<string>
  isLoading: Ref<boolean>
  error: Ref<unknown | null>
  load: () => Promise<string | null>
  cleanup: () => void
}

/**
 * Manages the lifecycle of a DataItem's Blob Object URL.
 * Automatically calls `URL.revokeObjectURL()` whenever:
 * 1. The itemId changes
 * 2. The active component/effect scope unmounts
 * 3. `cleanup()` is explicitly called
 *
 * Also safely guards against race conditions where an asynchronous request
 * resolves after the target ID has already changed.
 */
export function useMediaBlobUrl(
  itemIdSource: MaybeRefOrGetter<number | string | null | undefined>,
  options: UseMediaBlobUrlOptions = {}
): UseMediaBlobUrlReturn {
  const { immediate = true, onSuccess, onError } = options

  const mediaUrl = ref<string>('')
  const isLoading = ref<boolean>(false)
  const error = ref<unknown | null>(null)

  let activeRequestId = 0

  function cleanup() {
    if (mediaUrl.value) {
      try {
        URL.revokeObjectURL(mediaUrl.value)
      } catch {
        // Fallback or test environment safety
      }
      mediaUrl.value = ''
    }
  }

  async function load(): Promise<string | null> {
    const rawId = toValue(itemIdSource)
    if (rawId === null || rawId === undefined || rawId === '') {
      cleanup()
      isLoading.value = false
      error.value = null
      return null
    }

    const currentReq = ++activeRequestId
    cleanup()
    isLoading.value = true
    error.value = null

    try {
      const url = await createDataItemMediaUrl(rawId)

      // Guard against race conditions where the item ID changed while fetching
      if (currentReq !== activeRequestId) {
        try {
          URL.revokeObjectURL(url)
        } catch {
          // ignore
        }
        return null
      }

      mediaUrl.value = url
      isLoading.value = false
      onSuccess?.(url)
      return url
    } catch (err) {
      if (currentReq === activeRequestId) {
        isLoading.value = false
        error.value = err
        onError?.(err)
      }
      return null
    }
  }

  // Watch for ID changes
  watch(
    () => toValue(itemIdSource),
    () => {
      load()
    },
    { immediate }
  )

  // Clean up when the component / effect scope is destroyed
  if (getCurrentScope()) {
    onScopeDispose(() => {
      activeRequestId++
      cleanup()
    })
  }

  return {
    mediaUrl,
    isLoading,
    error,
    load,
    cleanup,
  }
}
