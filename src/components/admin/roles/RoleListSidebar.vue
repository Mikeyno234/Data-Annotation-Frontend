<script setup lang="ts">
import type { Role } from '@/types'
import Input from '@/components/ui/Input.vue'
import { Shield, Search, Edit2, Trash2, X, Sparkles } from 'lucide-vue-next'

defineProps<{
  roles: Role[]
  filteredRoles: Role[]
  selectedRoleId: number | null
  searchQuery: string
  isSuperAdmin: boolean
  isLoading?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:searchQuery', val: string): void
  (e: 'selectRole', id: number): void
  (e: 'editRole', role: Role): void
  (e: 'deleteRole', role: Role): void
}>()
</script>

<template>
  <div class="flex flex-col gap-3 w-full">
    <!-- Search Bar & Counter Header -->
    <div class="relative">
      <Search class="pointer-events-none absolute left-3.5 top-3 size-4 text-muted-foreground" />
      <Input
        :model-value="searchQuery"
        placeholder="Search roles or tenant..."
        class="h-10 pl-10 pr-8 text-xs rounded-xl font-sans border border-border/50 bg-card/70 focus-visible:bg-card focus-visible:ring-1 focus-visible:ring-primary/30 shadow-2xs"
        @input="emit('update:searchQuery', ($event.target as HTMLInputElement).value)"
      />
      <button
        v-if="searchQuery"
        type="button"
        class="absolute right-3 top-3 text-muted-foreground hover:text-foreground cursor-pointer"
        title="Clear search"
        @click="emit('update:searchQuery', '')"
      >
        <X class="size-4" />
      </button>
    </div>

    <!-- Role Profiles Container -->
    <div class="flex flex-col gap-1.5 rounded-2xl bg-card/60 backdrop-blur-md border border-border/50 p-2 shadow-2xs max-h-[calc(100vh-250px)] min-h-[300px] overflow-y-auto">
      <!-- Loading Skeleton State -->
      <div v-if="isLoading" class="p-2 space-y-2">
        <div
          v-for="i in 4"
          :key="i"
          class="flex flex-col gap-2 rounded-xl p-3 border border-border/30 bg-muted/20 animate-pulse"
        >
          <div class="flex items-center gap-2.5">
            <div class="size-7 rounded-lg bg-muted/60"></div>
            <div class="h-3.5 w-28 rounded bg-muted/60"></div>
          </div>
          <div class="h-2.5 w-full rounded bg-muted/40"></div>
        </div>
      </div>

      <!-- Empty State -->
      <div
        v-else-if="filteredRoles.length === 0"
        class="flex flex-col items-center justify-center p-8 text-center text-xs text-muted-foreground font-sans my-auto"
      >
        <Shield class="size-8 text-muted-foreground/40 mb-2" />
        <span class="font-semibold text-foreground">No roles found</span>
        <span class="text-[11px] text-muted-foreground mt-0.5">Try refining your filter or search query</span>
      </div>

      <!-- Role Items List -->
      <button
        v-for="r in filteredRoles"
        v-else
        :key="r.id"
        type="button"
        class="group relative flex flex-col gap-1.5 rounded-xl p-3 text-left transition-all duration-150 cursor-pointer select-none font-sans btn-tactile border"
        :class="
          selectedRoleId === r.id
            ? 'bg-card border-primary/40 shadow-xs ring-1 ring-primary/20 text-foreground'
            : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40 hover:border-border/30'
        "
        @click="emit('selectRole', r.id)"
      >
        <!-- Active Left Indicator Bar -->
        <div
          v-if="selectedRoleId === r.id"
          class="absolute left-0 top-3 bottom-3 w-1 rounded-r-full bg-primary"
        ></div>

        <div class="flex items-center justify-between gap-2 min-w-0 w-full pl-1">
          <div class="flex items-center gap-2.5 min-w-0">
            <div
              class="flex size-7 shrink-0 items-center justify-center rounded-lg transition-colors"
              :class="
                selectedRoleId === r.id
                  ? 'bg-primary/15 text-primary'
                  : 'bg-muted/60 text-muted-foreground group-hover:bg-muted group-hover:text-foreground'
              "
            >
              <Shield class="size-3.5" />
            </div>
            <span
              class="text-xs truncate font-bold"
              :class="selectedRoleId === r.id ? 'text-foreground' : 'text-foreground/90'"
            >
              {{ r.name }}
            </span>
          </div>

          <div class="flex items-center gap-1 shrink-0">
            <!-- Organization / System Badge -->
            <span
              v-if="r.is_system"
              class="text-[9.5px] px-1.5 py-0.5 rounded font-mono font-medium bg-muted text-muted-foreground"
            >
              System
            </span>
            <span
              v-else-if="r.organization?.name"
              class="text-[9.5px] px-1.5 py-0.5 rounded font-mono font-medium bg-primary/10 text-primary truncate max-w-[80px]"
            >
              {{ r.organization.name }}
            </span>

            <!-- Actions (Edit / Delete) on Hover -->
            <div
              v-if="isSuperAdmin && !r.is_system"
              class="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity ml-1"
              :class="selectedRoleId === r.id ? 'opacity-100' : ''"
            >
              <button
                type="button"
                class="rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                title="Edit Role"
                @click.stop="emit('editRole', r)"
              >
                <Edit2 class="size-3" />
              </button>
              <button
                type="button"
                class="rounded-md p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                title="Delete Role"
                @click.stop="emit('deleteRole', r)"
              >
                <Trash2 class="size-3" />
              </button>
            </div>
          </div>
        </div>

        <p
          v-if="r.description"
          class="text-[11px] line-clamp-1 leading-relaxed pl-1"
          :class="selectedRoleId === r.id ? 'text-muted-foreground' : 'text-muted-foreground/80'"
        >
          {{ r.description }}
        </p>
      </button>
    </div>
  </div>
</template>
