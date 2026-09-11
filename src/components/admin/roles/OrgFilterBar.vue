<script setup lang="ts">
import type { Role } from '@/types'
import { Building2 } from 'lucide-vue-next'

defineProps<{
  organizationList: Array<{ id: number; name: string }>
  selectedOrgFilter: 'ALL' | number
  roles: Role[]
}>()

const emit = defineEmits<{
  (e: 'selectOrg', id: 'ALL' | number): void
}>()
</script>

<template>
  <div class="flex flex-wrap items-center gap-2 p-1.5 rounded-lg bg-card border border-border shadow-2xs">
    <div class="flex items-center gap-2 px-3 py-1.5 text-muted-foreground shrink-0 border-r border-border pr-3 mr-0.5">
      <Building2 class="size-3.5 text-muted-foreground" :stroke-width="1.6" />
      <span class="text-[11px] font-medium text-foreground">Tenant Scope</span>
    </div>

    <div class="flex flex-wrap items-center gap-1.5 flex-1 min-w-0">
      <button
        type="button"
        class="group flex items-center gap-2 rounded-md px-2.5 py-1 text-xs font-medium transition-all duration-150 cursor-pointer btn-tactile border"
        :class="
          selectedOrgFilter === 'ALL'
            ? 'bg-muted text-foreground border-border/80 shadow-2xs'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted/60 border-transparent'
        "
        @click="emit('selectOrg', 'ALL')"
      >
        <span>All Roles</span>
        <span
          class="text-[10px] px-1.5 py-0.5 rounded-md font-mono font-bold transition-colors"
          :class="selectedOrgFilter === 'ALL' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground group-hover:bg-muted/80'"
        >
          {{ roles.length }}
        </span>
      </button>

      <button
        v-for="org in organizationList"
        :key="org.id"
        type="button"
        class="group flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-medium transition-all duration-150 cursor-pointer font-sans btn-tactile"
        :class="
          selectedOrgFilter === org.id
            ? 'bg-card text-foreground font-semibold shadow-xs border border-border/70 ring-1 ring-primary/20'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted/40 border border-transparent'
        "
        @click="emit('selectOrg', org.id)"
      >
        <span class="truncate max-w-[160px]">{{ org.name }}</span>
        <span
          class="text-[10px] px-1.5 py-0.5 rounded-md font-mono font-bold transition-colors"
          :class="selectedOrgFilter === org.id ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground group-hover:bg-muted/80'"
        >
          {{ roles.filter((r) => r.organization_id === org.id).length }}
        </span>
      </button>
    </div>
  </div>
</template>
