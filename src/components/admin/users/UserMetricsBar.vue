<script setup lang="ts">
import { Users, UserCheck, Shield } from 'lucide-vue-next'

defineProps<{
  totalCount: number
  activeCount: number
  rolesCount: number
}>()
</script>

<template>
  <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
    <!-- Card 1: Total Registered (Berry Purple Motif) -->
    <div class="relative overflow-hidden rounded-2xl border border-purple-500/25 bg-purple-500/5 p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-purple-500/40 before:absolute before:size-36 before:rounded-full before:bg-purple-500/10 before:-top-12 before:-right-12 before:pointer-events-none group">
      <div class="flex items-center justify-between relative z-10">
        <div>
          <div class="text-xs font-semibold text-purple-700 dark:text-purple-300">Total Registered</div>
          <div class="text-2xl font-bold text-foreground tracking-tight mt-1.5 tabular-nums">{{ totalCount }}</div>
          <div class="text-[11px] text-muted-foreground mt-0.5">Platform accounts</div>
        </div>
        <div class="flex size-11 items-center justify-center rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/25 shadow-2xs group-hover:scale-105 transition-transform">
          <Users class="size-5" :stroke-width="1.8" />
        </div>
      </div>
    </div>

    <!-- Card 2: Active Operators (Berry Emerald Motif) -->
    <div class="relative overflow-hidden rounded-2xl border border-emerald-500/25 bg-emerald-500/5 p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-emerald-500/40 before:absolute before:size-36 before:rounded-full before:bg-emerald-500/10 before:-top-12 before:-right-12 before:pointer-events-none group">
      <div class="flex items-center justify-between relative z-10">
        <div>
          <div class="text-xs font-semibold text-emerald-700 dark:text-emerald-300">Active Operators</div>
          <div class="text-2xl font-bold text-foreground tracking-tight mt-1.5 tabular-nums">{{ activeCount }}</div>
          <div class="text-[11px] text-muted-foreground mt-0.5">Active workforce</div>
        </div>
        <div class="flex size-11 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 shadow-2xs group-hover:scale-105 transition-transform">
          <UserCheck class="size-5" :stroke-width="1.8" />
        </div>
      </div>
    </div>

    <!-- Card 3: Configured Roles (Berry Blue Motif) -->
    <div class="relative overflow-hidden rounded-2xl border border-blue-500/25 bg-blue-500/5 p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-blue-500/40 before:absolute before:size-36 before:rounded-full before:bg-blue-500/10 before:-top-12 before:-right-12 before:pointer-events-none group">
      <div class="flex items-center justify-between relative z-10">
        <div>
          <div class="text-xs font-semibold text-blue-700 dark:text-blue-300">Configured Roles</div>
          <div class="text-2xl font-bold text-foreground tracking-tight mt-1.5 tabular-nums">{{ rolesCount }}</div>
          <div class="text-[11px] text-muted-foreground mt-0.5">Access control groups</div>
        </div>
        <div class="flex size-11 items-center justify-center rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/25 shadow-2xs group-hover:scale-105 transition-transform">
          <Shield class="size-5" :stroke-width="1.8" />
        </div>
      </div>
    </div>
  </div>
</template>
