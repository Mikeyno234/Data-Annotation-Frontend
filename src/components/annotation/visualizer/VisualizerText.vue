<script setup lang="ts">
import Badge from '@/components/ui/Badge.vue'

defineProps<{
  parsedData: any
}>()
</script>

<template>
  <div class="space-y-3">
    <!-- Classification view -->
    <div v-if="parsedData.type === 'classification'" class="p-4 rounded-xl bg-muted/30 border border-border/60 space-y-2">
      <div class="flex items-center justify-between">
        <span class="text-xs font-medium text-muted-foreground">Classified Label</span>
        <Badge variant="default" class="text-xs font-bold px-2.5 py-0.5">
          {{ parsedData.label }}
        </Badge>
      </div>
      <div v-if="parsedData.confidence" class="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/40">
        <span>Confidence</span>
        <span class="font-mono font-semibold text-foreground">{{ parsedData.confidence }}</span>
      </div>
      <div v-if="parsedData.notes" class="text-xs text-muted-foreground pt-1">
        <p class="font-medium text-foreground">Notes:</p>
        <p class="mt-0.5 italic">{{ parsedData.notes }}</p>
      </div>
    </div>

    <!-- Generic Empty or Object representation -->
    <div v-else class="p-4 rounded-xl bg-muted/20 border border-border/40 text-xs text-muted-foreground">
      <p v-if="parsedData.type === 'empty'" class="italic text-muted-foreground/80">No structured text annotations in payload.</p>
      <pre v-else class="font-mono text-[11px] overflow-x-auto p-3 bg-muted/40 border border-border/40 rounded-lg text-foreground/90">{{ JSON.stringify(parsedData.data, null, 2) }}</pre>
    </div>
  </div>
</template>
