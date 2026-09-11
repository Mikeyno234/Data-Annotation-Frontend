<script setup lang="ts">
import Card from '@/components/ui/Card.vue'
import CardContent from '@/components/ui/CardContent.vue'
import { Users, UserCheck, Shield } from 'lucide-vue-next'

defineProps<{
  totalCount: number
  activeCount: number
  rolesCount: number
}>()
</script>

<template>
  <div class="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
    <Card class="hover:border-foreground/30 transition-all">
      <CardContent class="p-4 flex items-center justify-between">
        <div>
          <div class="text-[11px] font-medium text-muted-foreground">Total Registered</div>
          <div class="text-2xl font-semibold text-foreground tracking-tight mt-1">{{ totalCount }}</div>
        </div>
        <div class="flex size-8 items-center justify-center rounded-md bg-muted text-muted-foreground border border-border">
          <Users class="size-4" :stroke-width="1.6" />
        </div>
      </CardContent>
    </Card>

    <Card class="hover:border-foreground/30 transition-all">
      <CardContent class="p-4 flex items-center justify-between">
        <div>
          <div class="text-[11px] font-medium text-muted-foreground">Active Operators</div>
          <div class="text-2xl font-semibold text-foreground tracking-tight mt-1">{{ activeCount }}</div>
        </div>
        <div class="flex size-8 items-center justify-center rounded-md bg-muted text-muted-foreground border border-border">
          <UserCheck class="size-4" :stroke-width="1.6" />
        </div>
      </CardContent>
    </Card>

    <Card class="hover:border-foreground/30 transition-all">
      <CardContent class="p-4 flex items-center justify-between">
        <div>
          <div class="text-[11px] font-medium text-muted-foreground">Configured Roles</div>
          <div class="text-2xl font-semibold text-foreground tracking-tight mt-1">{{ rolesCount }}</div>
        </div>
        <div class="flex size-8 items-center justify-center rounded-md bg-muted text-muted-foreground border border-border">
          <Shield class="size-4" :stroke-width="1.6" />
        </div>
      </CardContent>
    </Card>
  </div>
</template>
