<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-vue-next'

const props = withDefaults(
  defineProps<{
    page: number
    limit?: number
    total: number
    totalPages?: number
    showPageSize?: boolean
    pageSizeOptions?: number[]
    disabled?: boolean
  }>(),
  {
    limit: 20,
    totalPages: 1,
    showPageSize: true,
    pageSizeOptions: () => [10, 20, 50, 100],
    disabled: false,
  }
)

const emit = defineEmits<{
  'update:page': [page: number]
  'update:limit': [limit: number]
  'change': [payload: { page: number; limit: number }]
}>()

const jumpPage = ref<number | string>(props.page)

watch(
  () => props.page,
  (newPage) => {
    jumpPage.value = newPage
  }
)

const computedTotalPages = computed(() => {
  if (props.totalPages && props.totalPages > 0) return props.totalPages
  if (props.total && props.limit) {
    return Math.max(1, Math.ceil(props.total / props.limit))
  }
  return 1
})

const fromItem = computed(() => {
  if (props.total === 0) return 0
  return (props.page - 1) * (props.limit || 20) + 1
})

const toItem = computed(() => {
  if (props.total === 0) return 0
  return Math.min(props.page * (props.limit || 20), props.total)
})

const visiblePages = computed(() => {
  const current = props.page
  const total = computedTotalPages.value
  const delta = 2
  const range: (number | string)[] = []

  for (
    let i = Math.max(2, current - delta);
    i <= Math.min(total - 1, current + delta);
    i++
  ) {
    range.push(i)
  }

  if (current - delta > 2) {
    range.unshift('...')
  }
  if (current + delta < total - 1) {
    range.push('...')
  }

  range.unshift(1)
  if (total > 1) {
    range.push(total)
  }

  return range
})

function setPage(p: number) {
  if (p < 1 || p > computedTotalPages.value || p === props.page || props.disabled) return
  emit('update:page', p)
  emit('change', { page: p, limit: props.limit || 20 })
}

function handleJumpPage() {
  const target = Number(jumpPage.value)
  if (!target || isNaN(target)) {
    jumpPage.value = props.page
    return
  }
  const validPage = Math.max(1, Math.min(target, computedTotalPages.value))
  jumpPage.value = validPage
  if (validPage !== props.page) {
    setPage(validPage)
  }
}

function handleLimitChange(e: Event) {
  const newLimit = Number((e.target as HTMLSelectElement).value)
  emit('update:limit', newLimit)
  emit('update:page', 1)
  emit('change', { page: 1, limit: newLimit })
}
</script>

<template>
  <div class="flex flex-wrap items-center justify-between gap-4 py-2 px-1 text-xs select-none">
    <!-- Left: Entry count & borderless per-page selector -->
    <div class="flex flex-wrap items-center gap-3">
      <span v-if="total > 0" class="text-xs text-muted-foreground font-medium">
        Total <span class="font-bold text-foreground font-mono">{{ total }}</span>
      </span>
      <span v-else class="text-xs text-muted-foreground">
        No records
      </span>

      <!-- Page Size Dropdown: Borderless with smooth micro-animation -->
      <div v-if="showPageSize && total > 0" class="group relative flex items-center">
        <select
          :value="limit"
          :disabled="disabled"
          class="h-8 appearance-none rounded-xl border-0 bg-muted/40 hover:bg-muted/70 pl-3 pr-7 text-xs font-semibold text-foreground focus:bg-card focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer transition-all duration-200 shadow-xs hover:shadow-sm"
          @change="handleLimitChange"
        >
          <option v-for="opt in pageSizeOptions" :key="opt" :value="opt">
            {{ opt }}
          </option>
        </select>
        <ChevronDown class="pointer-events-none absolute right-2 size-3.5 text-muted-foreground transition-transform duration-200 group-hover:translate-y-0.5" />
      </div>
    </div>

    <!-- Right: Borderless Minimalist Navigation: < 1 2 3 > Go to [ 1 ] -->
    <div class="flex items-center gap-1.5">
      <!-- Prev Button with Left Slide Micro-animation -->
      <button
        type="button"
        :disabled="page <= 1 || disabled"
        class="group/prev flex size-8 items-center justify-center rounded-xl border-0 bg-muted/30 text-muted-foreground hover:bg-muted hover:text-foreground active:scale-90 disabled:opacity-25 disabled:pointer-events-none transition-all duration-200 cursor-pointer shadow-xs"
        title="Previous page"
        @click="setPage(page - 1)"
      >
        <ChevronLeft class="size-4 transition-transform duration-200 group-hover/prev:-translate-x-0.5" />
      </button>

      <!-- Numbered Page Links with Smooth Scale & Glow -->
      <div class="flex items-center gap-1">
        <template v-for="(p, idx) in visiblePages" :key="idx">
          <span
            v-if="p === '...'"
            class="flex size-8 items-center justify-center text-xs text-muted-foreground/60 font-mono font-bold"
          >
            …
          </span>
          <button
            v-else
            type="button"
            :disabled="disabled"
            class="flex min-w-[32px] h-8 px-2.5 items-center justify-center rounded-xl border-0 text-xs font-semibold transition-all duration-200 cursor-pointer select-none"
            :class="
              p === page
                ? 'bg-primary text-primary-foreground font-bold shadow-sm shadow-primary/30 scale-105'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/60 hover:scale-105 active:scale-95'
            "
            @click="setPage(Number(p))"
          >
            {{ p }}
          </button>
        </template>
      </div>

      <!-- Next Button with Right Slide Micro-animation -->
      <button
        type="button"
        :disabled="page >= computedTotalPages || disabled"
        class="group/next flex size-8 items-center justify-center rounded-xl border-0 bg-muted/30 text-muted-foreground hover:bg-muted hover:text-foreground active:scale-90 disabled:opacity-25 disabled:pointer-events-none transition-all duration-200 cursor-pointer shadow-xs"
        title="Next page"
        @click="setPage(page + 1)"
      >
        <ChevronRight class="size-4 transition-transform duration-200 group-hover/next:translate-x-0.5" />
      </button>

      <!-- Go To Input Box: Borderless with Focus Ring -->
      <div class="flex items-center gap-2 ml-2">
        <span class="text-xs text-muted-foreground font-medium">Go to</span>
        <input
          v-model="jumpPage"
          type="number"
          min="1"
          :max="computedTotalPages"
          :disabled="disabled"
          class="h-8 w-12 rounded-xl border-0 bg-muted/40 hover:bg-muted/60 focus:bg-card text-center text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 shadow-xs transition-all duration-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          @keydown.enter.prevent="handleJumpPage"
          @blur="handleJumpPage"
        />
      </div>
    </div>
  </div>
</template>
