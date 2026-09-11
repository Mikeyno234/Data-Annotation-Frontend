<script setup lang="ts">
import { computed } from 'vue'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'
import Select, { type SelectOption } from '@/components/ui/Select.vue'

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
    pageSizeOptions: () => [10, 20, 50, 70, 100],
    disabled: false,
  }
)

const emit = defineEmits<{
  'update:page': [page: number]
  'update:limit': [limit: number]
  'change': [payload: { page: number; limit: number }]
}>()

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

const pageSizeSelectOptions = computed<SelectOption<number>[]>(() =>
  props.pageSizeOptions.map((opt) => ({
    value: opt,
    label: `${opt}`,
  }))
)

function onLimitSelect(newLimit: number) {
  emit('update:limit', newLimit)
  emit('update:page', 1)
  emit('change', { page: 1, limit: newLimit })
}
</script>

<template>
  <div class="flex flex-wrap items-center justify-between gap-4 py-2 px-1 text-xs select-none">
    <!-- Left: Natural results count statement -->
    <div class="text-xs text-muted-foreground font-medium">
      <template v-if="total > 0">
        Showing
        <span class="font-semibold text-foreground tabular-nums">{{ fromItem }}</span>
        to
        <span class="font-semibold text-foreground tabular-nums">{{ toItem }}</span>
        of
        <span class="font-semibold text-foreground tabular-nums">{{ total }}</span>
        results
      </template>
      <template v-else>
        No results found
      </template>
    </div>

    <!-- Right: Page size selector, Page info, and Navigation controls -->
    <div class="flex flex-wrap items-center gap-3 sm:gap-5">
      <!-- Rows per page selector -->
      <div v-if="showPageSize && total > 0" class="flex items-center gap-2">
        <span class="text-xs text-muted-foreground font-medium whitespace-nowrap">Rows per page</span>
        <Select
          :model-value="limit"
          :options="pageSizeSelectOptions"
          :disabled="disabled"
          size="sm"
          direction="up"
          class-name="w-[72px]"
          menu-class-name="min-w-[72px] w-[72px]"
          @change="onLimitSelect(Number($event))"
        />
      </div>

      <!-- Page info -->
      <div class="flex items-center text-xs text-muted-foreground font-medium whitespace-nowrap">
        Page
        <span class="font-semibold text-foreground tabular-nums mx-1">{{ total > 0 ? page : 0 }}</span>
        of
        <span class="font-semibold text-foreground tabular-nums ml-1">{{ computedTotalPages }}</span>
      </div>

      <!-- Navigation buttons -->
      <div class="flex items-center gap-1">
        <!-- Prev Button -->
        <button
          type="button"
          :disabled="page <= 1 || disabled"
          class="flex size-7 items-center justify-center rounded-md border border-border bg-card text-foreground hover:bg-muted active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer shadow-2xs"
          title="Previous page"
          @click="setPage(page - 1)"
        >
          <ChevronLeft class="size-3.5" :stroke-width="1.8" />
        </button>

        <!-- Numbered Page Links -->
        <template v-for="(p, idx) in visiblePages" :key="idx">
          <span
            v-if="p === '...'"
            class="flex size-7 items-center justify-center text-xs text-muted-foreground tabular-nums"
          >
            …
          </span>
          <button
            v-else
            type="button"
            :disabled="disabled"
            class="flex min-w-[28px] h-7 px-2 items-center justify-center rounded-md border text-xs font-medium tabular-nums transition-all cursor-pointer select-none shadow-2xs"
            :class="
              p === page
                ? 'bg-foreground text-background border-foreground font-semibold shadow-xs'
                : 'bg-card text-muted-foreground border-border hover:text-foreground hover:bg-muted'
            "
            @click="setPage(Number(p))"
          >
            {{ p }}
          </button>
        </template>

        <!-- Next Button -->
        <button
          type="button"
          :disabled="page >= computedTotalPages || disabled"
          class="flex size-7 items-center justify-center rounded-md border border-border bg-card text-foreground hover:bg-muted active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer shadow-2xs"
          title="Next page"
          @click="setPage(page + 1)"
        >
          <ChevronRight class="size-3.5" :stroke-width="1.8" />
        </button>
      </div>
    </div>
  </div>
</template>
