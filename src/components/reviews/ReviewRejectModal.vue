<script setup lang="ts">
import Modal from '@/components/ui/Modal.vue'
import Button from '@/components/ui/Button.vue'

defineProps<{
  open: boolean
  comment: string
}>()

const emit = defineEmits<{
  (e: 'update:comment', val: string): void
  (e: 'close'): void
  (e: 'confirm'): void
}>()
</script>

<template>
  <Modal
    :open="open"
    title="Reject Annotation & Request Rework"
    description="Provide clear corrections and feedback for the annotator"
    @close="emit('close')"
  >
    <form class="space-y-4" @submit.prevent="emit('confirm')">
      <div class="space-y-1.5">
        <label class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Reviewer Notes</label>
        <textarea
          :value="comment"
          rows="3"
          placeholder="e.g. Speaker boundaries at 00:04 overlap improperly. Please re-align timestamps."
          class="w-full rounded-xl border border-border/60 bg-muted/40 p-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:bg-card focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none shadow-inner"
          required
          @input="emit('update:comment', ($event.target as HTMLTextAreaElement).value)"
        ></textarea>
      </div>

      <div class="flex items-center justify-end gap-2.5 pt-3">
        <Button variant="ghost" type="button" class="rounded-xl" @click="emit('close')">Cancel</Button>
        <Button variant="destructive" type="submit" class="rounded-xl font-semibold">Confirm Rejection</Button>
      </div>
    </form>
  </Modal>
</template>
