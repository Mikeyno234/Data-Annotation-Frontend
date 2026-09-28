<script setup lang="ts" generic="T extends string">
import { cn } from '@/lib/utils'

/**
 * Segmented tab control. Replaces the hand-duplicated button rows that appeared
 * across MyTasks, Reviews, QA and ProjectDetail, so the active/inactive styling
 * lives in one place and stays consistent.
 */
interface TabItem<K extends string> {
  key: K
  label: string
  /** Optional trailing count shown as tabular-nums, e.g. a queue size. */
  count?: number
}

interface Props {
  modelValue: T
  items: TabItem<T>[]
  className?: string
}

withDefaults(defineProps<Props>(), {
  className: '',
})

const emit = defineEmits<{
  'update:modelValue': [value: T]
}>()
</script>

<template>
  <div
    role="tablist"
    :class="cn('inline-flex p-0.5 rounded-md bg-muted/60 border border-border shadow-2xs', className)"
  >
    <button
      v-for="item in items"
      :key="item.key"
      type="button"
      role="tab"
      :aria-selected="modelValue === item.key"
      :class="cn(
        'inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition-all cursor-pointer select-none min-h-[36px]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background',
        modelValue === item.key
          ? 'bg-card text-foreground shadow-2xs border border-border'
          : 'text-muted-foreground hover:text-foreground border border-transparent',
      )"
      @click="emit('update:modelValue', item.key)"
    >
      <span>{{ item.label }}</span>
      <span
        v-if="item.count !== undefined"
        class="tabular-nums text-[11px] text-muted-foreground"
      >{{ item.count }}</span>
    </button>
  </div>
</template>
