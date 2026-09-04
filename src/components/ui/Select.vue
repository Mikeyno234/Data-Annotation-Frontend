<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { Check, ChevronDown } from 'lucide-vue-next'
import { cn } from '@/utils/cn'

export interface SelectOption {
  value: string
  label: string
}

interface Props {
  modelValue?: string
  options: SelectOption[]
  placeholder?: string
  disabled?: boolean
  loading?: boolean
  className?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  placeholder: 'Select an option',
  disabled: false,
  loading: false,
  className: '',
})

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()
const isOpen = ref(false)
const root = ref<HTMLElement | null>(null)

const selectedOption = computed(() => props.options.find((option) => option.value === props.modelValue))

function toggle() {
  if (!props.disabled && !props.loading) isOpen.value = !isOpen.value
}

function choose(option: SelectOption) {
  emit('update:modelValue', option.value)
  isOpen.value = false
}

function handleKeydown(event: KeyboardEvent) {
  if (props.disabled || props.loading) return
  if (event.key === 'Escape') isOpen.value = false
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    toggle()
  }
  if (event.key === 'ArrowDown' && !isOpen.value) {
    event.preventDefault()
    isOpen.value = true
  }
}

function closeOnOutsideClick(event: MouseEvent) {
  if (root.value && !root.value.contains(event.target as Node)) isOpen.value = false
}

onMounted(() => document.addEventListener('mousedown', closeOnOutsideClick))
onUnmounted(() => document.removeEventListener('mousedown', closeOnOutsideClick))
</script>

<template>
  <div ref="root" :class="cn('relative', className)">
    <button
      type="button"
      class="flex h-10 w-full items-center justify-between rounded-xl border-0 bg-muted/60 px-3.5 text-left text-sm text-foreground shadow-inner transition-all duration-200 hover:bg-muted/80 focus-visible:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
      :disabled="disabled || loading"
      :aria-expanded="isOpen"
      aria-haspopup="listbox"
      @click="toggle"
      @keydown="handleKeydown"
    >
      <span :class="selectedOption ? 'text-foreground font-medium' : 'text-muted-foreground/70'">
        {{ loading ? 'Loading options...' : selectedOption?.label || placeholder }}
      </span>
      <ChevronDown class="size-4 text-muted-foreground transition-transform duration-200" :class="isOpen && 'rotate-180 text-primary'" />
    </button>

    <Transition name="select-menu">
      <div v-if="isOpen" class="absolute z-30 mt-2 max-h-56 w-full origin-top overflow-y-auto rounded-2xl border-0 bg-popover p-1.5 shadow-2xl ring-1 ring-black/5 dark:ring-white/10" role="listbox">
        <button
          v-for="option in options"
          :key="option.value"
          type="button"
          class="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm text-popover-foreground transition-colors duration-150 hover:bg-muted/80 cursor-pointer"
          :class="option.value === modelValue && 'bg-primary/10 text-primary font-semibold'"
          role="option"
          :aria-selected="option.value === modelValue"
          @click="choose(option)"
        >
          <span>{{ option.label }}</span>
          <Check v-if="option.value === modelValue" class="size-4" />
        </button>
        <p v-if="!options.length" class="px-3 py-2.5 text-xs text-muted-foreground">No options available</p>
      </div>
    </Transition>
  </div>
</template>
