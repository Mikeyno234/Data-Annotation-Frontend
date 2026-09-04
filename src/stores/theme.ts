import { computed, ref } from 'vue'

const theme = ref<'light' | 'dark'>('dark')

function applyTheme(value: 'light' | 'dark') {
  theme.value = value
  document.documentElement.classList.toggle('dark', value === 'dark')
  localStorage.setItem('annotation-theme', value)
}

export function useTheme() {
  if (typeof window !== 'undefined' && !localStorage.getItem('annotation-theme')) {
    applyTheme(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
  } else if (typeof window !== 'undefined') {
    applyTheme(localStorage.getItem('annotation-theme') === 'light' ? 'light' : 'dark')
  }

  return {
    theme: computed(() => theme.value),
    toggleTheme: () => applyTheme(theme.value === 'dark' ? 'light' : 'dark'),
  }
}
