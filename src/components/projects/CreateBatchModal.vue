<script setup lang="ts">
import { ref, computed } from 'vue'
import Modal from '@/components/ui/Modal.vue'
import Button from '@/components/ui/Button.vue'
import Input from '@/components/ui/Input.vue'
import Badge from '@/components/ui/Badge.vue'
import type { User } from '@/types'
import { Layers, Users, Search, PlusCircle } from 'lucide-vue-next'

const props = defineProps<{
  open: boolean
  isCreating: boolean
  availableAnnotators?: User[]
}>()

const emit = defineEmits<{
  (e: 'update:open', val: boolean): void
  (e: 'submit', payload: { name: string; priority: string; assigneeIds: number[] }): void
}>()

const batchName = ref('')
const priority = ref('MEDIUM')
const selectedAssigneeIds = ref<number[]>([])
const annotatorSearch = ref('')

const filteredAnnotators = computed(() => {
  const list = props.availableAnnotators || []
  if (!annotatorSearch.value.trim()) return list
  const q = annotatorSearch.value.toLowerCase().trim()
  return list.filter(
    (u) =>
      u.full_name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.role?.name?.toLowerCase().includes(q)
  )
})

function toggleAssignee(userId: number) {
  const idx = selectedAssigneeIds.value.indexOf(userId)
  if (idx >= 0) {
    selectedAssigneeIds.value.splice(idx, 1)
  } else {
    selectedAssigneeIds.value.push(userId)
  }
}

function handleSubmit() {
  if (!batchName.value.trim()) return
  emit('submit', {
    name: batchName.value.trim(),
    priority: priority.value,
    assigneeIds: selectedAssigneeIds.value,
  })
}

function handleClose() {
  emit('update:open', false)
  batchName.value = ''
  selectedAssigneeIds.value = []
}
</script>

<template>
  <Modal
    :open="open"
    title="Create Data Annotation Batch"
    description="Initialize an isolated batch partition and allocate annotators for workforce tracking."
    @close="handleClose"
  >
    <form class="space-y-4" @submit.prevent="handleSubmit">
      <div class="space-y-1.5">
        <label class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Batch Name
        </label>
        <Input
          v-model="batchName"
          placeholder="e.g. Batch - Audio Segment A"
          required
        />
      </div>

      <div class="space-y-1.5">
        <label class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Priority Level
        </label>
        <select
          v-model="priority"
          class="w-full rounded-xl border border-border/60 bg-background px-3 py-2 text-xs font-medium text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
        >
          <option value="LOW">Low Priority</option>
          <option value="MEDIUM">Medium Priority</option>
          <option value="HIGH">High Priority</option>
          <option value="URGENT">Urgent Priority</option>
        </select>
      </div>

      <!-- Assign Annotators -->
      <div v-if="availableAnnotators && availableAnnotators.length > 0" class="space-y-1.5 pt-1">
        <div class="flex items-center justify-between">
          <label class="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Users class="size-3.5" />
            Assign Annotators (Optional)
          </label>
          <span class="text-[11px] text-primary font-medium">
            {{ selectedAssigneeIds.length }} selected
          </span>
        </div>

        <div class="relative">
          <Search class="size-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
          <input
            v-model="annotatorSearch"
            type="text"
            placeholder="Search annotators..."
            class="w-full rounded-xl border border-border/60 bg-background pl-8 pr-3 py-1.5 text-xs font-medium text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
          />
        </div>

        <div class="max-h-36 overflow-y-auto rounded-xl border border-border/50 bg-background/60 p-1.5 space-y-1">
          <div
            v-for="u in filteredAnnotators"
            :key="u.id"
            class="flex items-center justify-between p-1.5 rounded-lg text-xs cursor-pointer transition-colors"
            :class="selectedAssigneeIds.includes(u.id) ? 'bg-primary/10 text-primary font-semibold' : 'hover:bg-muted/60 text-foreground'"
            @click="toggleAssignee(u.id)"
          >
            <div class="flex items-center gap-2 truncate">
              <input
                type="checkbox"
                :checked="selectedAssigneeIds.includes(u.id)"
                class="size-3.5 rounded accent-primary cursor-pointer"
                @click.stop="toggleAssignee(u.id)"
              />
              <span class="truncate">{{ u.full_name || u.email }}</span>
            </div>
            <Badge variant="outline" class="text-[10px] px-1.5 py-0 capitalize shrink-0">
              {{ u.role?.name || 'Annotator' }}
            </Badge>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex items-center justify-end gap-2.5 pt-3 border-t border-border/40">
        <Button
          variant="ghost"
          type="button"
          class="rounded-xl cursor-pointer"
          :disabled="isCreating"
          @click="handleClose"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          :disabled="isCreating || !batchName.trim()"
          class="rounded-xl font-semibold gap-2 cursor-pointer shadow-sm"
        >
          <PlusCircle class="size-4" />
          <span>{{ isCreating ? 'Creating Batch...' : 'Create Batch' }}</span>
        </Button>
      </div>
    </form>
  </Modal>
</template>
