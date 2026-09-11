<script setup lang="ts">
import type { Role, Menu, MenuGroup } from '@/types'
import {
  KeyRound,
  Loader2,
  CheckCircle2,
  Lock,
  Edit2,
  FolderKanban,
  Check,
} from 'lucide-vue-next'
import Button from '@/components/ui/Button.vue'

const props = defineProps<{
  selectedRole?: Role
  isSelectedRoleSuperAdmin: boolean
  autoSaveStatus: 'idle' | 'saving' | 'saved' | 'error'
  menuGroups: MenuGroup[]
  canEditRole?: boolean
  isLoading?: boolean
}>()

const emit = defineEmits<{
  (e: 'editRole', role: Role): void
  (e: 'toggleGroup', group: MenuGroup, active: boolean): void
  (e: 'toggleMenuLevel', level: any): void
}>()

function isMenuEnabled(menu: Menu): boolean {
  if (props.isSelectedRoleSuperAdmin) return true
  if (!menu.levels || menu.levels.length === 0) return false
  return menu.levels.some((lvl) => lvl.is_active)
}

function getGroupActiveCount(group: MenuGroup): string {
  const activeCount = group.submenus.filter((sub) => isMenuEnabled(sub)).length
  return `${activeCount}/${group.submenus.length} Active`
}
</script>

<template>
  <!-- Loading Skeleton State -->
  <div v-if="isLoading" class="flex flex-col gap-4 w-full">
    <div class="rounded-lg border border-border bg-card p-4 animate-pulse">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="size-9 rounded-md bg-muted"></div>
          <div class="space-y-2">
            <div class="h-4 w-36 rounded bg-muted"></div>
            <div class="h-3 w-52 rounded bg-muted/60"></div>
          </div>
        </div>
        <div class="h-8 w-20 rounded-md bg-muted/60"></div>
      </div>
    </div>
    <div class="space-y-4">
      <div v-for="i in 2" :key="i" class="rounded-lg border border-border bg-card p-4 animate-pulse space-y-4">
        <div class="h-4 w-28 rounded bg-muted"></div>
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          <div v-for="j in 3" :key="j" class="h-24 rounded-md border border-border/40 bg-muted/20"></div>
        </div>
      </div>
    </div>
  </div>

  <!-- Selected Role Matrix View -->
  <div v-else-if="selectedRole" class="flex flex-col gap-4 w-full">
    <!-- Header Banner Card -->
    <div class="bg-card rounded-lg p-4 sm:p-5 shadow-2xs border border-border">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div class="flex items-start gap-3.5 min-w-0">
          <div class="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-foreground border border-border">
            <KeyRound class="size-4 text-muted-foreground" :stroke-width="1.6" />
          </div>
          <div class="min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <h2 class="text-base font-semibold text-foreground tracking-tight">{{ selectedRole.name }}</h2>
              <span
                v-if="selectedRole.organization?.name"
                class="text-[10px] px-2 py-0.5 rounded-md font-medium bg-primary/10 text-primary border border-primary/20"
              >
                {{ selectedRole.organization.name }}
              </span>
              <span
                v-else-if="selectedRole.is_system"
                class="text-[10px] px-2 py-0.5 rounded-md font-medium bg-muted text-muted-foreground border border-border"
              >
                System Role
              </span>
            </div>
            <p class="text-xs text-muted-foreground mt-0.5 truncate max-w-xl">
              {{ selectedRole.description || 'Assigned permissions and workspace access.' }}
            </p>
          </div>
        </div>

        <div class="flex items-center gap-2.5 shrink-0">
          <!-- Auto-save Status Indicator -->
          <div
            class="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-md transition-all duration-200 border"
            :class="{
              'bg-muted/40 text-muted-foreground border-transparent': autoSaveStatus === 'idle',
              'bg-warning/15 text-warning border-warning/30': autoSaveStatus === 'saving',
              'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30': autoSaveStatus === 'saved',
              'bg-destructive/15 text-destructive border-destructive/30': autoSaveStatus === 'error',
            }"
          >
            <Loader2 v-if="autoSaveStatus === 'saving'" class="size-3.5 animate-spin" />
            <CheckCircle2 v-else-if="autoSaveStatus === 'saved'" class="size-3.5" :stroke-width="1.6" />
            <Lock v-else class="size-3.5 text-muted-foreground" :stroke-width="1.6" />
            <span>{{ autoSaveStatus === 'saving' ? 'Saving...' : autoSaveStatus === 'saved' ? 'Saved' : 'Auto-save' }}</span>
          </div>

          <Button
            v-if="!selectedRole.is_system"
            variant="outline"
            size="sm"
            class="gap-1.5 text-xs rounded-md h-8 px-3 cursor-pointer shadow-2xs"
            @click="emit('editRole', selectedRole)"
          >
            <Edit2 class="size-3.5" :stroke-width="1.6" />
            <span>Edit Role</span>
          </Button>
        </div>
      </div>
    </div>

    <!-- Super Admin Protected Role Notice -->
    <div
      v-if="isSelectedRoleSuperAdmin"
      class="rounded-lg bg-muted/40 border border-border p-3.5 flex items-center gap-3 text-xs text-muted-foreground"
    >
      <Lock class="size-4 text-muted-foreground shrink-0" :stroke-width="1.6" />
      <span>Super Admin has unrestricted system permissions across all modules and cannot be modified.</span>
    </div>

    <!-- Module Access Permissions Bento Sections -->
    <div class="space-y-4">
      <div
        v-for="group in menuGroups"
        :key="group.id"
        class="bg-card rounded-lg border border-border overflow-hidden shadow-2xs"
      >
        <!-- Group Header -->
        <div class="flex items-center justify-between p-3.5 sm:px-4 bg-muted/30 border-b border-border">
          <div class="flex items-center gap-2.5">
            <div class="flex size-7 items-center justify-center rounded-md bg-muted text-muted-foreground border border-border">
              <FolderKanban class="size-3.5" :stroke-width="1.6" />
            </div>
            <div class="flex items-center gap-2">
              <span class="text-xs font-semibold text-foreground tracking-tight">{{ group.name }}</span>
              <span class="text-[10px] px-2 py-0.5 rounded-full font-medium bg-muted text-muted-foreground border border-border/60">
                {{ getGroupActiveCount(group) }}
              </span>
            </div>
          </div>

          <div v-if="!isSelectedRoleSuperAdmin" class="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="sm"
              class="h-6.5 px-2 text-[10.5px] font-medium text-muted-foreground hover:text-foreground rounded-md cursor-pointer"
              @click="emit('toggleGroup', group, true)"
            >
              Select All
            </Button>
            <span class="text-border text-xs">|</span>
            <Button
              variant="ghost"
              size="sm"
              class="h-6.5 px-2 text-[10.5px] font-medium text-muted-foreground hover:text-destructive rounded-md cursor-pointer"
              @click="emit('toggleGroup', group, false)"
            >
              Clear
            </Button>
          </div>
        </div>

        <!-- Submenus & Action Chips Grid -->
        <div class="p-3.5 sm:p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          <div
            v-for="submenu in group.submenus"
            :key="submenu.id"
            class="rounded-md border border-border bg-card hover:border-foreground/30 p-3 flex flex-col justify-between gap-3 transition-colors shadow-2xs"
          >
            <div class="space-y-1">
              <div class="text-xs font-semibold text-foreground tracking-tight">{{ submenu.name }}</div>
              <div v-if="submenu.path" class="inline-flex items-center px-1.5 py-0.5 rounded bg-muted/60 border border-border text-[10px] font-mono text-muted-foreground">
                {{ submenu.path }}
              </div>
            </div>

            <!-- Permission Levels Action Chips -->
            <div v-if="submenu.levels && submenu.levels.length > 0" class="flex flex-wrap gap-1.5 pt-1">
              <button
                v-for="level in submenu.levels"
                :key="level.id"
                type="button"
                :disabled="isSelectedRoleSuperAdmin"
                class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium transition-all duration-150 border"
                :class="[
                  level.is_active
                    ? 'bg-primary text-primary-foreground border-primary/40 font-medium shadow-2xs'
                    : 'bg-muted/40 text-muted-foreground hover:bg-muted/70 hover:text-foreground border-border',
                  isSelectedRoleSuperAdmin ? 'cursor-not-allowed opacity-75' : 'cursor-pointer',
                ]"
                @click="emit('toggleMenuLevel', level)"
              >
                <Check v-if="level.is_active" class="size-3 stroke-[2]" />
                <span>{{ level.name }}</span>
              </button>
            </div>
            <div v-else class="text-[11px] text-muted-foreground/80 py-1">
              Full access
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Empty State (No role selected) -->
  <div v-else class="rounded-lg border border-border bg-card p-12 text-center text-muted-foreground my-auto shadow-2xs">
    <div class="size-10 mx-auto mb-2.5 rounded-md bg-muted border border-border flex items-center justify-center text-muted-foreground">
      <Lock class="size-4" :stroke-width="1.6" />
    </div>
    <h3 class="text-sm font-semibold text-foreground">No Role Selected</h3>
    <p class="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
      Choose a role from the sidebar to view and manage its permissions.
    </p>
  </div>
</template>
