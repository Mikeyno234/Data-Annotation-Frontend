<script setup lang="ts">
import type { User, Role } from '@/types'
import { getAvatarUrl } from '@/api/auth'
import Card from '@/components/ui/Card.vue'
import Badge from '@/components/ui/Badge.vue'
import Button from '@/components/ui/Button.vue'
import Pagination from '@/components/ui/Pagination.vue'
import { RefreshCw, Mail, Building2 } from 'lucide-vue-next'

defineProps<{
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
  (e: 'updateRole', user: User, roleId: number): void
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
  <Card class="bg-card/90 overflow-hidden shadow-sm">
    <div v-if="isLoading" class="flex flex-col items-center justify-center p-16">
      <RefreshCw class="size-6 animate-spin text-primary mb-2" />
      <span class="text-xs text-muted-foreground">Loading directory...</span>
    </div>

    <div v-else-if="users.length === 0" class="flex flex-col items-center justify-center p-16 text-center">
      <h3 class="text-base font-bold text-foreground">No users found</h3>
      <p class="text-xs text-muted-foreground mt-1 max-w-sm">
        No team members match your active search or role criteria.
      </p>
    </div>

    <div v-else class="overflow-x-auto">
      <table class="w-full text-left text-sm">
        <thead class="bg-muted/50 text-xs uppercase font-semibold tracking-wider text-muted-foreground">
          <tr>
            <th class="px-5 py-4">User</th>
            <th class="px-5 py-4">Role Assignment</th>
            <th class="px-5 py-4">Organization</th>
            <th class="px-5 py-4">Status</th>
            <th class="px-5 py-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody class="text-xs">
          <tr v-for="user in users" :key="user.id" class="transition-colors hover:bg-muted/40 odd:bg-muted/10">
            <!-- User Profile & Avatar -->
            <td class="px-5 py-4">
              <div class="flex items-center gap-3">
                <div class="size-10 rounded-2xl bg-primary/10 overflow-hidden shrink-0 flex items-center justify-center text-primary font-bold shadow-2xs">
                  <img
                    v-if="user.avatar"
                    :src="getAvatarUrl(user)"
                    :alt="user.full_name"
                    class="size-full object-cover"
                  />
                  <span v-else>{{ getInitials(user.full_name) }}</span>
                </div>
                <div class="min-w-0">
                  <div class="font-bold text-foreground flex items-center gap-1.5 truncate">
                    <span>{{ user.full_name }}</span>
                    <span v-if="user.id === currentUserId" class="text-[10px] text-primary font-semibold">(You)</span>
                  </div>
                  <div class="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5 truncate">
                    <Mail class="size-3 shrink-0" />
                    <span>{{ user.email }}</span>
                  </div>
                </div>
              </div>
            </td>

            <!-- Role Selector -->
            <td class="px-5 py-4">
              <select
                :value="user.role_id"
                class="h-8 rounded-xl border border-border/50 bg-muted/60 px-2.5 text-xs font-semibold text-foreground focus:bg-card focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
                @change="emit('updateRole', user, Number(($event.target as HTMLSelectElement).value))"
              >
                <option v-for="r in roles" :key="r.id" :value="r.id">
                  {{ r.name }}
                </option>
              </select>
            </td>

            <!-- Organization -->
            <td class="px-5 py-4">
              <div class="flex items-center gap-1.5 text-foreground font-semibold">
                <Building2 class="size-3.5 text-muted-foreground" />
                <span>{{ user.organization?.name || 'Global / Super' }}</span>
              </div>
            </td>

            <!-- Status Badge -->
            <td class="px-5 py-4">
              <Badge
                :variant="user.status === 'ACTIVE' ? 'success' : 'outline'"
                :dot="user.status === 'ACTIVE'"
                class="text-xs font-semibold"
              >
                {{ user.status === 'ACTIVE' ? 'Active' : 'Inactive' }}
              </Badge>
            </td>

            <!-- Action Button -->
            <td class="px-5 py-4 text-right">
              <Button
                v-if="user.id !== currentUserId"
                variant="outline"
                size="sm"
                class="h-8 px-3 text-xs rounded-xl font-semibold cursor-pointer"
                :class="user.status === 'ACTIVE' ? 'text-destructive hover:bg-destructive/10' : 'text-emerald-500 hover:bg-emerald-500/10'"
                @click="emit('toggleStatus', user)"
              >
                {{ user.status === 'ACTIVE' ? 'Deactivate' : 'Activate' }}
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
