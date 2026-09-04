import { ref, type Ref } from 'vue'
import { useWorkspaceStore } from '@/stores/workspace'

export interface UseLeaseLockReturn {
  elapsedTimeSeconds: Ref<number>
  startTime: Ref<number>
  startTimer: () => void
  stopTimer: () => void
  resetTimer: () => void
}

/**
 * Composable for tracking active annotator lead time and lease duration.
 */
export function useLeaseLock(): UseLeaseLockReturn {
  const workspaceStore = useWorkspaceStore()
  const elapsedTimeSeconds = ref(0)
  const startTime = ref(Date.now())
  let timerInterval: ReturnType<typeof setInterval> | null = null

  function startTimer() {
    stopTimer()
    startTime.value = Date.now()
    elapsedTimeSeconds.value = 0
    workspaceStore.startTimer()
    timerInterval = setInterval(() => {
      elapsedTimeSeconds.value = Math.floor((Date.now() - startTime.value) / 1000)
    }, 1000)
  }

  function stopTimer() {
    if (timerInterval !== null) {
      clearInterval(timerInterval)
      timerInterval = null
    }
    workspaceStore.stopTimer()
  }

  function resetTimer() {
    startTime.value = Date.now()
    elapsedTimeSeconds.value = 0
  }

  return {
    elapsedTimeSeconds,
    startTime,
    startTimer,
    stopTimer,
    resetTimer,
  }
}
