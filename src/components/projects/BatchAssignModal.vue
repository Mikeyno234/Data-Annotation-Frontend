<script setup lang="ts">
import type { Batch, User } from '@/types'
import Modal from '@/components/ui/Modal.vue'
import Button from '@/components/ui/Button.vue'
import Input from '@/components/ui/Input.vue'
import Badge from '@/components/ui/Badge.vue'
import {
  Users,
  Search,
  Check,
  Building2,
  Filter,
} from 'lucide-vue-next'

defineProps<{
  open: boolean
  batch: Batch | null
  selectedUserIds: number[]
  annotators: User[]
  isAssigning: boolean
  filterOrgOnly: boolean
  searchQuery: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'toggleUser', userId: number): void
  (e: 'confirm'): void
  (e: 'update:filterOrgOnly', val: boolean): void
  (e: 'update:searchQuery', val: string): void
}>()
</script>

<template>
  <Modal
    :open="open"
    :title="`Assign Annotators — ${batch?.name || 'Batch'}`"
    max-width="lg"
    @close="emit('close')"
  >
    <div class="space-y-4">
      <p class="text-xs text-muted-foreground">
        Select workforce members permitted to annotate tasks in this batch.
      </p>

      <!-- Search & Org Filter Bar -->
      <div class="flex items-center gap-2">
        <div class="relative flex-1">
          <Search class="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground pointer-events-none" :stroke-width="1.6" />
          <input
            :value="searchQuery"
            type="text"
            placeholder="Search by name, email, or role..."
            class="w-full h-8 pl-8 pr-3 text-xs rounded-lg bg-card border border-border text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-ring"
            @input="emit('update:searchQuery', ($event.target as HTMLInputElement).value)"
          />
        </div>

        <button
          type="button"
          class="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer select-none"
          :class="filterOrgOnly ? 'bg-primary/10 text-primary border-primary/30' : 'bg-muted/40 text-muted-foreground border-border/70'"
          @click="emit('update:filterOrgOnly', !filterOrgOnly)"
        >
          <Building2 class="size-3.5" :stroke-width="1.6" />
          <span>Org Only</span>
        </button>
      </div>

      <!-- Selected Count Badge -->
      <div class="flex items-center justify-between text-xs px-1">
        <span class="text-muted-foreground">
          Showing {{ annotators.length }} eligible member(s)
        </span>
        <Badge variant="secondary">
          {{ selectedUserIds.length }} selected
        </Badge>
      </div>

      <!-- Annotators List -->
      <div class="max-h-64 overflow-y-auto divide-y divide-border/50 rounded-xl border border-border/70 bg-card">
        <div
          v-if="annotators.length === 0"
          class="p-6 text-center text-xs text-muted-foreground"
        >
          No matching members found.
        </div>

        <div
          v-for="u in annotators"
          :key="u.id"
          class="flex items-center justify-between p-3 transition-colors hover:bg-muted/30 cursor-pointer"
          @click="emit('toggleUser', u.id)"
        >
          <div class="flex items-center gap-2.5 min-w-0">
            <!-- Custom Checkbox -->
            <div
              class="flex size-4.5 shrink-0 items-center justify-center rounded border transition-all"
              :class="
                selectedUserIds.includes(u.id)
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-card'
              "
            >
              <Check v-if="selectedUserIds.includes(u.id)" class="size-3" :stroke-width="2.5" />
            </div>

            <div class="min-w-0">
              <div class="flex items-center gap-1.5 truncate">
                <span class="font-medium text-xs text-foreground">
                  {{ u.full_name || u.email }}
                </span>
                <span v-if="u.role?.name" class="text-[10px] text-muted-foreground px-1.5 py-0.2 rounded bg-muted/70">
                  {{ u.role.name }}
                </span>
              </div>
              <div class="text-[11px] text-muted-foreground truncate mt-0.5">
                {{ u.email }}
                <span v-if="u.organization?.name"> • {{ u.organization.name }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Footer -->
    <template #footer>
      <div class="flex items-center justify-end gap-2">
        <Button variant="ghost" size="sm" @click="emit('close')">
          Cancel
        </Button>
        <Button
          variant="default"
          size="sm"
          :disabled="isAssigning"
          @click="emit('confirm')"
        >
          <span v-if="isAssigning">Saving...</span>
          <span v-else>Save Assignments</span>
        </Button>
      </div>
    </template>
  </Modal>
</template>
