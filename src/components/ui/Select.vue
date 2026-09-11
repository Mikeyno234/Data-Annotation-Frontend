<script setup lang="ts" generic="T = string | number | null">
import { computed, onMounted, onUnmounted, ref, nextTick, watch } from 'vue'
import { Check, ChevronDown, LoaderCircle } from 'lucide-vue-next'
import { cn } from '@/lib/utils'

export interface SelectOption<V = any> {
  value: V
  label: string
  description?: string
  icon?: any
  disabled?: boolean
  badge?: string
}

interface Props {
  modelValue?: T
  options: SelectOption<T>[]
  placeholder?: string
  disabled?: boolean
  loading?: boolean
  size?: 'sm' | 'default' | 'lg'
  className?: string
  menuClassName?: string
  error?: boolean
  align?: 'left' | 'right'
  direction?: 'down' | 'up' | 'auto'
  teleport?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Select an option',
  disabled: false,
  loading: false,
  size: 'default',
  className: '',
  menuClassName: '',
  error: false,
  align: 'left',
  direction: 'auto',
  teleport: true,
})

const emit = defineEmits<{
  'update:modelValue': [value: T]
  change: [value: T]
}>()

const isOpen = ref(false)
const root = ref<HTMLElement | null>(null)
const listbox = ref<HTMLElement | null>(null)
const highlightedIndex = ref(-1)

const selectedOption = computed(() =>
  props.options.find((option) => option.value === props.modelValue)
)

const sizeClasses = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'h-8 px-2.5 py-1 text-xs rounded-md'
    case 'lg':
      return 'h-10 px-3.5 py-2 text-sm rounded-xl'
    case 'default':
    default:
      return 'h-9 px-3 py-1.5 text-xs rounded-lg'
  }
})

const floatingStyles = ref<{
  position: 'fixed'
  top?: string
  bottom?: string
  left?: string
  right?: string
  width?: string
  minWidth?: string
  maxWidth?: string
  zIndex: number
}>({
  position: 'fixed',
  zIndex: 9999,
})

const resolvedDirection = ref<'up' | 'down'>('down')

function updatePosition() {
  if (!root.value) return
  const rect = root.value.getBoundingClientRect()
  const margin = 6
  const menuEstimatedHeight = 220

  const spaceBelow = window.innerHeight - rect.bottom
  const spaceAbove = rect.top

  let openUp = false
  if (props.direction === 'up') {
    openUp = true
  } else if (props.direction === 'auto') {
    if (spaceBelow < menuEstimatedHeight && spaceAbove > spaceBelow) {
      openUp = true
    }
  }

  resolvedDirection.value = openUp ? 'up' : 'down'

  if (props.teleport) {
    const triggerWidth = Math.round(rect.width)

    if (props.align === 'right') {
      floatingStyles.value = {
        position: 'fixed',
        ...(openUp
          ? { bottom: `${Math.round(window.innerHeight - rect.top + margin)}px` }
          : { top: `${Math.round(rect.bottom + margin)}px` }),
        right: `${Math.round(window.innerWidth - rect.right)}px`,
        minWidth: `${triggerWidth}px`,
        maxWidth: 'calc(100vw - 16px)',
        zIndex: 9999,
      }
    } else {
      floatingStyles.value = {
        position: 'fixed',
        ...(openUp
          ? { bottom: `${Math.round(window.innerHeight - rect.top + margin)}px` }
          : { top: `${Math.round(rect.bottom + margin)}px` }),
        left: `${Math.round(Math.max(8, rect.left))}px`,
        minWidth: `${triggerWidth}px`,
        maxWidth: 'calc(100vw - 16px)',
        zIndex: 9999,
      }
    }
  }
}

function toggle() {
  if (!props.disabled && !props.loading) {
    isOpen.value = !isOpen.value
    if (isOpen.value) {
      updatePosition()
      const idx = props.options.findIndex((opt) => opt.value === props.modelValue)
      highlightedIndex.value = idx >= 0 ? idx : 0
      scrollToHighlighted()
    }
  }
}

function choose(option: SelectOption<T>) {
  if (option.disabled) return
  emit('update:modelValue', option.value)
  emit('change', option.value)
  isOpen.value = false
}

function scrollToHighlighted() {
  nextTick(() => {
    if (!listbox.value) return
    const items = listbox.value.querySelectorAll('[role="option"]')
    const current = items[highlightedIndex.value] as HTMLElement | undefined
    if (current && typeof current.scrollIntoView === 'function') {
      current.scrollIntoView({ block: 'nearest' })
    }
  })
}

function handleKeydown(event: KeyboardEvent) {
  if (props.disabled || props.loading) return

  if (event.key === 'Escape') {
    isOpen.value = false
    return
  }

  if (event.key === 'Tab') {
    isOpen.value = false
    return
  }

  if (!isOpen.value) {
    if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown') {
      event.preventDefault()
      toggle()
    }
    return
  }

  if (event.key === 'ArrowDown') {
    event.preventDefault()
    let next = highlightedIndex.value + 1
    while (next < props.options.length && props.options[next].disabled) {
      next++
    }
    if (next < props.options.length) {
      highlightedIndex.value = next
      scrollToHighlighted()
    }
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    let prev = highlightedIndex.value - 1
    while (prev >= 0 && props.options[prev].disabled) {
      prev--
    }
    if (prev >= 0) {
      highlightedIndex.value = prev
      scrollToHighlighted()
    }
  } else if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    if (highlightedIndex.value >= 0 && highlightedIndex.value < props.options.length) {
      choose(props.options[highlightedIndex.value])
    }
  }
}

function closeOnOutsideClick(event: MouseEvent | TouchEvent) {
  const target = event.target as Node
  const inTrigger = root.value?.contains(target)
  const inListbox = listbox.value?.contains(target)
  if (!inTrigger && !inListbox) {
    isOpen.value = false
  }
}

function onScrollOrResize(event: Event) {
  if (!isOpen.value) return
  if (listbox.value && (event.target === listbox.value || listbox.value.contains(event.target as Node))) return
  if (!root.value) return
  const rect = root.value.getBoundingClientRect()
  if (rect.bottom < 0 || rect.top > window.innerHeight) {
    isOpen.value = false
    return
  }
  updatePosition()
}

watch(
  () => props.disabled,
  (isDisabled) => {
    if (isDisabled) isOpen.value = false
  }
)

onMounted(() => {
  document.addEventListener('mousedown', closeOnOutsideClick)
  document.addEventListener('touchstart', closeOnOutsideClick)
  window.addEventListener('resize', onScrollOrResize)
  window.addEventListener('scroll', onScrollOrResize, true)
})

onUnmounted(() => {
  document.removeEventListener('mousedown', closeOnOutsideClick)
  document.removeEventListener('touchstart', closeOnOutsideClick)
  window.removeEventListener('resize', onScrollOrResize)
  window.removeEventListener('scroll', onScrollOrResize, true)
})
</script>

<template>
  <div ref="root" :class="cn('relative inline-block w-full', className)">
    <!-- Trigger Button -->
    <button
      type="button"
      :class="
        cn(
          'flex w-full items-center justify-between gap-2 border bg-card text-left transition-all duration-150 select-none cursor-pointer',
          sizeClasses,
          error ? 'border-destructive focus-visible:ring-destructive/30' : 'border-border hover:border-foreground/30 focus-visible:border-foreground/40',
          isOpen ? 'ring-1 ring-foreground/20 border-foreground/40 shadow-xs' : 'shadow-2xs',
          'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-foreground/20',
          'disabled:cursor-not-allowed disabled:opacity-50'
        )
      "
      :disabled="disabled || loading"
      :aria-expanded="isOpen"
      aria-haspopup="listbox"
      role="combobox"
      @click="toggle"
      @keydown="handleKeydown"
    >
      <div class="flex items-center gap-2 min-w-0 truncate">
        <component
          :is="selectedOption.icon"
          v-if="selectedOption?.icon"
          class="size-3.5 shrink-0 text-muted-foreground"
        />
        <span
          :class="
            cn(
              'truncate',
              selectedOption ? 'text-foreground font-medium' : 'text-muted-foreground/60'
            )
          "
        >
          {{ loading ? 'Loading...' : selectedOption?.label || placeholder }}
        </span>
      </div>

      <div class="flex items-center gap-1.5 shrink-0 ml-1">
        <LoaderCircle v-if="loading" class="size-3.5 animate-spin text-muted-foreground" />
        <ChevronDown
          v-else
          class="size-3.5 text-muted-foreground transition-transform duration-200"
          :class="isOpen && 'rotate-180 text-primary'"
        />
      </div>
    </button>

    <!-- Dropdown Menu Popover -->
    <Teleport to="body" :disabled="!teleport">
      <Transition name="select-dropdown">
        <div
          v-if="isOpen"
          ref="listbox"
          :style="teleport ? floatingStyles : undefined"
          :class="
            cn(
              teleport ? 'fixed' : 'absolute',
              'z-50 max-h-60 overflow-y-auto rounded-xl border border-border bg-popover/95 p-1 shadow-lg backdrop-blur-md ring-1 ring-black/5 dark:ring-white/10 transition-all',
              !teleport && 'w-full min-w-[12rem]',
              !teleport && (resolvedDirection === 'up' ? 'bottom-full mb-1.5 origin-bottom' : 'top-full mt-1.5 origin-top'),
              !teleport && (align === 'right' ? 'right-0' : 'left-0'),
              menuClassName
            )
          "
          role="listbox"
        >
          <div
            v-for="(option, idx) in options"
            :key="String(option.value)"
            :class="
              cn(
                'flex w-full items-start justify-between gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs transition-colors select-none cursor-pointer',
                option.disabled
                  ? 'opacity-40 cursor-not-allowed'
                  : highlightedIndex === idx
                  ? 'bg-muted/80 text-foreground'
                  : 'text-foreground hover:bg-muted/60',
                option.value === modelValue && 'bg-primary/10 text-primary font-medium hover:bg-primary/15'
              )
            "
            role="option"
            :aria-selected="option.value === modelValue"
            :aria-disabled="option.disabled"
            @click="choose(option)"
            @mouseenter="highlightedIndex = idx"
          >
            <!-- Left: Optional Icon & Label / Description stack -->
            <div class="flex items-start gap-2.5 min-w-0 flex-1">
              <component
                :is="option.icon"
                v-if="option.icon"
                class="size-3.5 mt-0.5 shrink-0 text-muted-foreground"
              />
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-1.5">
                  <span class="truncate" :class="option.value === modelValue ? 'font-semibold text-primary' : 'font-medium text-foreground'">
                    {{ option.label }}
                  </span>
                  <span
                    v-if="option.badge"
                    class="rounded bg-muted px-1 py-0.2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider"
                  >
                    {{ option.badge }}
                  </span>
                </div>
                <p
                  v-if="option.description"
                  class="text-[11px] text-muted-foreground/80 mt-0.5 line-clamp-2 leading-relaxed font-normal"
                >
                  {{ option.description }}
                </p>
              </div>
            </div>

            <!-- Right: Check Icon -->
            <Check
              v-if="option.value === modelValue"
              class="size-3.5 text-primary shrink-0 mt-0.5"
              :stroke-width="2.2"
            />
          </div>

          <div v-if="!options.length" class="px-3 py-3 text-center text-xs text-muted-foreground">
            No options available
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.select-dropdown-enter-active,
.select-dropdown-leave-active {
  transition: opacity 160ms cubic-bezier(0.16, 1, 0.3, 1), transform 160ms cubic-bezier(0.16, 1, 0.3, 1);
}

.select-dropdown-enter-from,
.select-dropdown-leave-to {
  opacity: 0;
  transform: translateY(-5px) scale(0.98);
}
</style>
