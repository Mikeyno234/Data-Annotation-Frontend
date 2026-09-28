<script setup lang="ts">
import type { User, Role } from '@/types'
import { getAvatarUrl } from '@/api/auth'
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
  <div class="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-xs">
    <div v-if="isLoading" class="flex flex-col items-center justify-center p-16">
      <RefreshCw class="size-6 animate-spin text-primary mb-2" />
      <span class="text-xs text-muted-foreground font-medium">Loading directory...</span>
    </div>

    <div v-else-if="users.length === 0" class="flex flex-col items-center justify-center p-16 text-center">
      <h3 class="text-sm font-bold text-foreground">No users found</h3>
      <p class="text-xs text-muted-foreground mt-1 max-w-sm">
        No team members match your active search or role criteria.
      </p>
    </div>

    <div v-else class="overflow-x-auto">
      <table class="w-full text-left text-xs">
        <thead class="bg-muted/50 text-[11px] font-semibold text-muted-foreground border-b border-border/70">
          <tr>
            <th class="px-5 py-3">User</th>
            <th class="px-5 py-3">Role</th>
            <th class="px-5 py-3">Organization</th>
            <th class="px-5 py-3">Status</th>
            <th class="px-5 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-border/60">
          <tr v-for="user in users" :key="user.id" class="transition-colors hover:bg-muted/20">
            <!-- User Profile & Avatar (Berry Rounded-xl Avatar) -->
            <td class="px-5 py-3.5">
              <div class="flex items-center gap-3">
                <div class="size-9 rounded-xl bg-primary/10 border border-primary/20 overflow-hidden shrink-0 flex items-center justify-center text-primary font-bold text-xs shadow-2xs">
                  <img
                    v-if="user.avatar"
                    :src="getAvatarUrl(user)"
                    :alt="user.full_name"
                    class="size-full object-cover"
                  />
                  <span v-else>{{ getInitials(user.full_name) }}</span>
                </div>
                <div class="min-w-0">
                  <div class="font-semibold text-foreground flex items-center gap-1.5 truncate">
                    <span>{{ user.full_name }}</span>
                    <span v-if="user.id === currentUserId" class="text-[10px] text-primary font-semibold px-2 py-0.2 rounded-full bg-primary/10 border border-primary/20">You</span>
                  </div>
                  <div class="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5 truncate">
                    <Mail class="size-3 shrink-0 opacity-70" />
                    <span>{{ user.email }}</span>
                  </div>
                </div>
              </div>
            </td>

            <!-- Role (Berry Soft Pill Badge) -->
            <td class="px-5 py-3.5">
              <span
                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wide uppercase transition-colors"
                :class="
                  user.role?.name === 'Super Admin'
                    ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20'
                    : 'bg-muted/80 text-foreground/80 border border-border/60'
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

            <!-- Status (Berry Pill Badge) -->
            <td class="px-5 py-3.5">
              <span
                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wide uppercase"
                :class="
                  user.status === 'ACTIVE'
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                    : 'bg-muted/80 text-muted-foreground border border-border/60'
                "
              >
                {{ user.status === 'ACTIVE' ? 'Active' : 'Inactive' }}
              </span>
            </td>

            <!-- Actions (Berry Rounded-xl Button) -->
            <td class="px-5 py-3.5 text-right">
              <Button
                variant="outline"
                size="sm"
                class="h-8 px-3 text-xs gap-1.5 rounded-xl hover:bg-muted font-medium transition-colors shadow-2xs"
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
    <div class="px-5 py-3 border-t border-border/70">
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
  </div>
</template>
