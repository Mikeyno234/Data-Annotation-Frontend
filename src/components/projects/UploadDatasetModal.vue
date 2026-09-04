<script setup lang="ts">
import Modal from '@/components/ui/Modal.vue'
import Button from '@/components/ui/Button.vue'
import Input from '@/components/ui/Input.vue'

defineProps<{
  showUploadModal: boolean
  isUploading: boolean
  uploadName: string
}>()

const emit = defineEmits<{
  (e: 'update:showUploadModal', val: boolean): void
  (e: 'update:uploadName', val: string): void
  (e: 'fileSelect', event: Event): void
  (e: 'submit'): void
}>()
</script>

<template>
  <Modal
    :open="showUploadModal"
    title="Upload Dataset & Media Source"
    description="Binary files will be stored in S3/MinIO and queued for AI pre-labeling"
    @close="emit('update:showUploadModal', false)"
  >
    <form class="space-y-4" @submit.prevent="emit('submit')">
      <div class="space-y-1.5">
        <label class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Select Audio / Media File
        </label>
        <input
          type="file"
          class="w-full rounded-xl border-0 bg-muted/60 p-2.5 text-xs text-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-primary file:text-primary-foreground file:font-semibold file:cursor-pointer shadow-inner"
          required
          @change="emit('fileSelect', $event)"
        />
      </div>

      <div class="space-y-1.5">
        <label class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Dataset Item Name
        </label>
        <Input
          :model-value="uploadName"
          placeholder="e.g. Dialog_Wawancara_01.mp3"
          required
          @input="emit('update:uploadName', ($event.target as HTMLInputElement).value)"
        />
      </div>

      <div class="flex items-center justify-end gap-2.5 pt-3">
        <Button variant="ghost" type="button" class="rounded-xl" @click="emit('update:showUploadModal', false)">
          Cancel
        </Button>
        <Button type="submit" :disabled="isUploading" class="rounded-xl font-semibold">
          {{ isUploading ? 'Uploading...' : 'Upload & Enqueue' }}
        </Button>
      </div>
    </form>
  </Modal>
</template>
