import { ref, computed, type Ref, type ComputedRef } from 'vue'

export interface UseHistoryStackReturn<T> {
  history: Ref<string[]>
  historyIndex: Ref<number>
  canUndo: ComputedRef<boolean>
  canRedo: ComputedRef<boolean>
  pushState: (newState?: T) => void
  undo: () => T | null
  redo: () => T | null
  resetHistory: (initialState: T) => void
}

/**
 * Composable for managing a linear undo/redo history stack for immutable states.
 */
export function useHistoryStack<T>(
  payload: Ref<T>,
  onStateChanged?: (state: T) => void
): UseHistoryStackReturn<T> {
  const history = ref<string[]>([JSON.stringify(payload.value)]) as Ref<string[]>
  const historyIndex = ref(0)

  const canUndo = computed(() => historyIndex.value > 0)
  const canRedo = computed(() => historyIndex.value < history.value.length - 1)

  function pushState(newState?: T): void {
    const target = newState !== undefined ? newState : payload.value
    const serialized = JSON.stringify(target)

    // Deduplicate consecutive identical states
    if (history.value[historyIndex.value] === serialized) return

    // Slice off any redo branch
    history.value = history.value.slice(0, historyIndex.value + 1)
    history.value.push(serialized)
    historyIndex.value = history.value.length - 1

    if (onStateChanged) {
      onStateChanged(target)
    }
  }

  function undo(): T | null {
    if (!canUndo.value) return null
    historyIndex.value--
    const restored = JSON.parse(history.value[historyIndex.value]) as T
    payload.value = restored
    if (onStateChanged) {
      onStateChanged(restored)
    }
    return restored
  }

  function redo(): T | null {
    if (!canRedo.value) return null
    historyIndex.value++
    const restored = JSON.parse(history.value[historyIndex.value]) as T
    payload.value = restored
    if (onStateChanged) {
      onStateChanged(restored)
    }
    return restored
  }

  function resetHistory(initialState: T): void {
    payload.value = initialState
    history.value = [JSON.stringify(initialState)]
    historyIndex.value = 0
  }

  return {
    history,
    historyIndex,
    canUndo,
    canRedo,
    pushState,
    undo,
    redo,
    resetHistory,
  }
}
