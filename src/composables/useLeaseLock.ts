import { ref, type Ref } from 'vue'

export interface UseLeaseLockReturn {
  elapsedTimeSeconds: Ref<number>
  startTime: Ref<number>
  startTimer: () => void
  stopTimer: () => void
  resetTimer: () => void
}

/**
 * Composable for tracking active annotator lead time and lock checkout duration.
 */
export function useLeaseLock(): UseLeaseLockReturn {
  const elapsedTimeSeconds = ref(0)
  const startTime = ref(Date.now())
  let timerInterval: ReturnType<typeof setInterval> | null = null

  function startTimer() {
    stopTimer()
    startTime.value = Date.now()
    elapsedTimeSeconds.value = 0
    timerInterval = setInterval(() => {
      elapsedTimeSeconds.value = Math.floor((Date.now() - startTime.value) / 1000)
    }, 1000)
  }

  function stopTimer() {
    if (timerInterval !== null) {
      clearInterval(timerInterval)
      timerInterval = null
    }
  }

  function resetTimer() {
    stopTimer()
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
