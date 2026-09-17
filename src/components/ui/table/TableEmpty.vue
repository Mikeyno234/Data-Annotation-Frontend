<script setup lang="ts">
import { cn } from '@/lib/utils'
import TableRow from './TableRow.vue'
import TableCell from './TableCell.vue'

interface Props {
  class?: string
  colspan?: number
}

const props = withDefaults(defineProps<Props>(), {
  colspan: 1,
})
</script>

<template>
  <TableRow>
    <TableCell
      :class="
        cn(
          'p-8 text-center align-middle text-xs text-muted-foreground',
          props.class,
        )
      "
      :colspan="props.colspan"
    >
      <slot />
    </TableCell>
  </TableRow>
</template>
