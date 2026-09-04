<script setup lang="ts">
import type { Role, Menu } from '@/types'
import {
  KeyRound,
  Loader2,
  CheckCircle2,
  Lock,
  Edit2,
  ShieldAlert,
  FolderKanban,
  Check,
  Sparkles,
} from 'lucide-vue-next'
import Button from '@/components/ui/Button.vue'

export interface MenuGroup {
  id: number
  name: string
  code: string
  icon?: string
  submenus: Menu[]
}

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

function isGroupEnabled(group: MenuGroup): boolean {
  return group.submenus.some((sub) => isMenuEnabled(sub))
}

function getGroupActiveCount(group: MenuGroup): string {
  const activeCount = group.submenus.filter((sub) => isMenuEnabled(sub)).length
  return `${activeCount}/${group.submenus.length} Active`
}
</script>

<template>
  <!-- Loading Skeleton State -->
  <div v-if="isLoading" class="flex flex-col gap-5 w-full">
    <div class="rounded-2xl border border-border/40 bg-card/60 p-5 animate-pulse">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="size-10 rounded-xl bg-muted/60"></div>
          <div class="space-y-2">
            <div class="h-4 w-36 rounded bg-muted/60"></div>
            <div class="h-3 w-52 rounded bg-muted/40"></div>
          </div>
        </div>
        <div class="h-8 w-20 rounded-xl bg-muted/40"></div>
      </div>
    </div>
    <div class="space-y-4">
      <div v-for="i in 2" :key="i" class="rounded-2xl border border-border/40 bg-card/60 p-4 animate-pulse space-y-4">
        <div class="h-4 w-28 rounded bg-muted/60"></div>
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          <div v-for="j in 3" :key="j" class="h-24 rounded-xl border border-border/30 bg-muted/20"></div>
        </div>
      </div>
    </div>
  </div>

  <!-- Selected Role Matrix View -->
  <div v-else-if="selectedRole" class="flex flex-col gap-5 w-full">
    <!-- Header Banner Card -->
    <div class="bg-card/70 backdrop-blur-md rounded-2xl p-4 sm:p-5 shadow-2xs border border-border/50">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div class="flex items-start gap-3.5 min-w-0">
          <div class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <KeyRound class="size-5" />
          </div>
          <div class="min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <h2 class="text-lg font-bold text-foreground tracking-tight font-sans">{{ selectedRole.name }}</h2>
              <span
                v-if="selectedRole.organization?.name"
                class="text-[10px] px-2 py-0.5 rounded-md font-mono font-medium bg-primary/10 text-primary border border-primary/20"
              >
                {{ selectedRole.organization.name }}
              </span>
              <span
                v-else-if="selectedRole.is_system"
                class="text-[10px] px-2 py-0.5 rounded-md font-mono font-medium bg-muted text-muted-foreground"
              >
                System Profile
              </span>
            </div>
            <p class="text-xs text-muted-foreground mt-0.5 font-sans truncate max-w-xl">
              {{ selectedRole.description || 'Custom role authorization profile and access control policies.' }}
            </p>
          </div>
        </div>

        <div class="flex items-center gap-2.5 shrink-0">
          <!-- Auto-save Status Indicator -->
          <div
            class="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-xl transition-all duration-200 font-sans border"
            :class="{
              'bg-muted/40 text-muted-foreground border-transparent': autoSaveStatus === 'idle',
              'bg-warning/15 text-warning border-warning/30': autoSaveStatus === 'saving',
              'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30': autoSaveStatus === 'saved',
              'bg-destructive/15 text-destructive border-destructive/30': autoSaveStatus === 'error',
            }"
          >
            <Loader2 v-if="autoSaveStatus === 'saving'" class="size-3.5 animate-spin" />
            <CheckCircle2 v-else-if="autoSaveStatus === 'saved'" class="size-3.5" />
            <Lock v-else class="size-3.5" />
            <span>{{ autoSaveStatus === 'saving' ? 'Saving...' : autoSaveStatus === 'saved' ? 'Saved' : 'Auto-save' }}</span>
          </div>

          <Button
            v-if="!selectedRole.is_system"
            variant="outline"
            size="sm"
            class="gap-1.5 text-xs rounded-xl h-8.5 px-3 font-sans cursor-pointer btn-tactile shadow-2xs border-border/60 bg-card hover:bg-muted/60"
            @click="emit('editRole', selectedRole)"
          >
            <Edit2 class="size-3.5" />
            <span>Edit Profile</span>
          </Button>
        </div>
      </div>
    </div>

    <!-- Super Admin Protected Role Notice -->
    <div
      v-if="isSelectedRoleSuperAdmin"
      class="relative overflow-hidden rounded-2xl bg-amber-500/10 border border-amber-500/20 p-4 backdrop-blur-md flex items-start gap-3.5 shadow-2xs"
    >
      <div class="flex size-8 items-center justify-center rounded-lg bg-amber-500/20 text-amber-500 shrink-0 mt-0.5">
        <ShieldAlert class="size-4.5" />
      </div>
      <div>
        <h4 class="text-xs font-bold text-amber-500 tracking-wide font-sans">Super Admin System Profile (Immutable)</h4>
        <p class="text-xs text-muted-foreground mt-0.5 leading-relaxed font-sans">
          This system profile maintains full root privileges across all platform entities and cannot be restricted.
        </p>
      </div>
    </div>

    <!-- Module Access Permissions Bento Sections -->
    <div class="space-y-4">
      <div
        v-for="group in menuGroups"
        :key="group.id"
        class="bg-card/70 backdrop-blur-md rounded-2xl border border-border/50 overflow-hidden shadow-2xs"
      >
        <!-- Group Header -->
        <div class="flex items-center justify-between p-3.5 sm:px-4 bg-muted/25 border-b border-border/40">
          <div class="flex items-center gap-2.5">
            <div class="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <FolderKanban class="size-3.5" />
            </div>
            <div class="flex items-center gap-2">
              <span class="text-xs font-bold text-foreground uppercase tracking-wider font-sans">{{ group.name }}</span>
              <span class="text-[10px] px-2 py-0.2 rounded-full font-mono font-medium bg-muted text-muted-foreground">
                {{ getGroupActiveCount(group) }}
              </span>
            </div>
          </div>

          <div v-if="!isSelectedRoleSuperAdmin" class="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="sm"
              class="h-6.5 px-2 text-[10.5px] font-medium text-muted-foreground hover:text-foreground font-sans rounded-lg cursor-pointer"
              @click="emit('toggleGroup', group, true)"
            >
              Select All
            </Button>
            <span class="text-border text-xs">|</span>
            <Button
              variant="ghost"
              size="sm"
              class="h-6.5 px-2 text-[10.5px] font-medium text-muted-foreground hover:text-destructive font-sans rounded-lg cursor-pointer"
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
            class="rounded-xl border border-border/40 bg-card/50 hover:border-border/70 p-3 flex flex-col justify-between gap-3 transition-colors shadow-2xs"
          >
            <div>
              <div class="text-xs font-semibold text-foreground font-sans">{{ submenu.name }}</div>
              <div class="text-[10px] text-muted-foreground font-mono mt-0.5 truncate">{{ submenu.path || submenu.code }}</div>
            </div>

            <!-- Permission Levels Action Chips -->
            <div v-if="submenu.levels && submenu.levels.length > 0" class="flex flex-wrap gap-1.5">
              <button
                v-for="level in submenu.levels"
                :key="level.id"
                type="button"
                :disabled="isSelectedRoleSuperAdmin"
                class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all duration-150 font-sans border btn-tactile"
                :class="[
                  level.is_active
                    ? 'bg-primary/10 text-primary border-primary/30 font-semibold shadow-2xs dark:bg-primary/20'
                    : 'bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground border-transparent',
                  isSelectedRoleSuperAdmin ? 'cursor-not-allowed opacity-80' : 'cursor-pointer',
                ]"
                @click="emit('toggleMenuLevel', level)"
              >
                <Check v-if="level.is_active" class="size-3 stroke-[2.5]" />
                <span>{{ level.name }}</span>
              </button>
            </div>
            <div v-else class="text-[10px] text-muted-foreground italic font-sans">
              Inherited root policy
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Empty State (No role selected) -->
  <div v-else class="rounded-2xl border border-border/60 bg-card/60 p-12 text-center text-muted-foreground my-auto shadow-2xs">
    <ShieldAlert class="size-10 mx-auto mb-2.5 text-muted-foreground/40" />
    <h3 class="text-sm font-semibold text-foreground font-sans">No Role Selected</h3>
    <p class="text-xs text-muted-foreground mt-1 max-w-sm mx-auto font-sans">
      Choose a security role from the sidebar to inspect and configure its workspace permission matrix.
    </p>
  </div>
</template>
