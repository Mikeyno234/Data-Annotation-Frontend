import { ref } from 'vue'

export interface ToastItem {
  id: string
  title: string
  description?: string
  type: 'success' | 'error' | 'info' | 'warning'
  duration?: number
}

export const toasts = ref<ToastItem[]>([])

export function showToast(toast: Omit<ToastItem, 'id'>) {
  const id = Math.random().toString(36).substring(2, 9)
  const newItem: ToastItem = { ...toast, id, duration: toast.duration || 3500 }

  // Cap active toasts so memory and display stay bounded and compact
  if (toasts.value.length >= 5) {
    toasts.value = toasts.value.slice(toasts.value.length - 4)
  }
  toasts.value.push(newItem)

  setTimeout(() => {
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }, newItem.duration)
}

export const toast = {
  success: (title: string, description?: string) => showToast({ title, description, type: 'success' }),
  error: (title: string, description?: string) => showToast({ title, description, type: 'error' }),
  info: (title: string, description?: string) => showToast({ title, description, type: 'info' }),
  warning: (title: string, description?: string) => showToast({ title, description, type: 'warning' }),
}
