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
  <div class="grid grid-cols-1 sm:grid-cols-3 gap-5">
    <Card class="bg-card/90 shadow-sm">
      <CardContent class="p-5 flex items-center gap-4">
        <div class="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Users class="size-6" />
        </div>
        <div>
          <div class="text-3xl font-extrabold text-foreground tracking-tight">{{ totalCount }}</div>
          <div class="text-xs text-muted-foreground font-semibold uppercase tracking-wider mt-0.5">Total Registered</div>
        </div>
      </CardContent>
    </Card>

    <Card class="bg-card/90 shadow-sm">
      <CardContent class="p-5 flex items-center gap-4">
        <div class="flex size-12 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-500">
          <UserCheck class="size-6" />
        </div>
        <div>
          <div class="text-3xl font-extrabold text-emerald-500 tracking-tight">{{ activeCount }}</div>
          <div class="text-xs text-muted-foreground font-semibold uppercase tracking-wider mt-0.5">Active</div>
        </div>
      </CardContent>
    </Card>

    <Card class="bg-card/90 shadow-sm">
      <CardContent class="p-5 flex items-center gap-4">
        <div class="flex size-12 items-center justify-center rounded-2xl bg-info/15 text-info">
          <Shield class="size-6" />
        </div>
        <div>
          <div class="text-3xl font-extrabold text-info tracking-tight">{{ rolesCount }}</div>
          <div class="text-xs text-muted-foreground font-semibold uppercase tracking-wider mt-0.5">Configured Roles</div>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
