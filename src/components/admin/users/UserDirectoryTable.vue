<script setup lang="ts">
import type { User, Role } from '@/types'
import { getAvatarUrl } from '@/api/auth'
import Card from '@/components/ui/Card.vue'
import Button from '@/components/ui/Button.vue'
import Pagination from '@/components/ui/Pagination.vue'
import { RefreshCw, Mail, Building2, Pencil } from 'lucide-vue-next'

const props = defineProps<{
  users: User[]
  roles: Role[]
  currentUserId?: number
  currentPage: number
  pageLimit: number
  totalUsers: number
  totalPages: number
  isLoading: boolean
}>()

const emit = defineEmits<{
  (e: 'editUser', user: User): void
  (e: 'toggleStatus', user: User): void
  (e: 'pageChange', page: number): void
  (e: 'limitChange', limit: number): void
}>()

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}
</script>

<template>
  <Card class="overflow-hidden shadow-2xs border border-border">
    <div v-if="isLoading" class="flex flex-col items-center justify-center p-16">
      <RefreshCw class="size-5 animate-spin text-primary mb-2" />
      <span class="text-xs text-muted-foreground font-medium">Loading directory...</span>
    </div>

    <div v-else-if="users.length === 0" class="flex flex-col items-center justify-center p-16 text-center">
      <h3 class="text-sm font-semibold text-foreground">No users found</h3>
      <p class="text-xs text-muted-foreground mt-1 max-w-sm">
        No team members match your active search or role criteria.
      </p>
    </div>

    <div v-else class="overflow-x-auto">
      <table class="w-full text-left text-xs">
        <thead class="bg-muted/40 text-[11px] font-medium text-muted-foreground border-b border-border">
          <tr>
            <th class="px-5 py-3">User</th>
            <th class="px-5 py-3">Role</th>
            <th class="px-5 py-3">Organization</th>
            <th class="px-5 py-3">Status</th>
            <th class="px-5 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-border/60">
          <tr v-for="user in users" :key="user.id" class="transition-colors hover:bg-muted/30">
            <!-- User Profile & Avatar -->
            <td class="px-5 py-3.5">
              <div class="flex items-center gap-3">
                <div class="size-8 rounded-full bg-muted border border-border/80 overflow-hidden shrink-0 flex items-center justify-center text-foreground font-semibold text-xs shadow-2xs">
                  <img
                    v-if="user.avatar"
                    :src="getAvatarUrl(user)"
                    :alt="user.full_name"
                    class="size-full object-cover"
                  />
                  <span v-else>{{ getInitials(user.full_name) }}</span>
                </div>
                <div class="min-w-0">
                  <div class="font-medium text-foreground flex items-center gap-1.5 truncate">
                    <span>{{ user.full_name }}</span>
                    <span v-if="user.id === currentUserId" class="text-[10px] text-muted-foreground font-medium px-1.5 py-0.2 rounded bg-muted border border-border/60">You</span>
                  </div>
                  <div class="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5 truncate">
                    <Mail class="size-3 shrink-0 opacity-70" />
                    <span>{{ user.email }}</span>
                  </div>
                </div>
              </div>
            </td>

            <!-- Role -->
            <td class="px-5 py-3.5">
              <span
                class="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors"
                :class="
                  user.role?.name === 'Super Admin'
                    ? 'bg-primary/10 text-primary border border-primary/20'
                    : 'bg-muted/60 text-foreground/80 border border-border/50'
                "
              >
                {{ user.role?.name || 'No Role' }}
              </span>
            </td>

            <!-- Organization -->
            <td class="px-5 py-3.5">
              <div class="flex items-center gap-1.5 text-foreground font-medium">
                <Building2 class="size-3.5 text-muted-foreground shrink-0" />
                <span>{{ user.organization?.name || 'Global / Super' }}</span>
              </div>
            </td>

            <!-- Status -->
            <td class="px-5 py-3.5">
              <span
                class="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium"
                :class="
                  user.status === 'ACTIVE'
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                    : 'bg-muted/60 text-muted-foreground border border-border/50'
                "
              >
                {{ user.status === 'ACTIVE' ? 'Active' : 'Inactive' }}
              </span>
            </td>

            <!-- Actions -->
            <td class="px-5 py-3.5 text-right">
              <Button
                variant="outline"
                size="sm"
                class-name="h-7 px-2.5 text-xs gap-1.5 rounded-md hover:bg-muted font-medium transition-colors shadow-2xs"
                @click="emit('editUser', user)"
              >
                <Pencil class="size-3 text-muted-foreground" />
                <span>Edit</span>
              </Button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div class="px-5 py-2 border-t border-muted/20">
      <Pagination
        :page="currentPage"
        :limit="pageLimit"
        :total="totalUsers"
        :total-pages="totalPages"
        :disabled="isLoading"
        @update:page="emit('pageChange', $event)"
        @update:limit="emit('limitChange', $event)"
      />
    </div>
  </Card>
</template>
