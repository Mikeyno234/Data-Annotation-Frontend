<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ProfileInfoTab from '@/components/profile/ProfileInfoTab.vue'
import ProfilePreferencesTab from '@/components/profile/ProfilePreferencesTab.vue'
import ProfileSecurityTab from '@/components/profile/ProfileSecurityTab.vue'
import ProfileShortcutsTab from '@/components/profile/ProfileShortcutsTab.vue'
import { User, Sliders, Lock, Keyboard } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()

const validTabs = ['profile', 'preferences', 'security', 'shortcuts']
const activeTab = ref<'profile' | 'preferences' | 'security' | 'shortcuts'>(
  validTabs.includes(route.query.tab as string) ? (route.query.tab as any) : 'profile'
)

watch(
  () => route.query.tab,
  (newTab) => {
    if (newTab && validTabs.includes(newTab as string)) {
      activeTab.value = newTab as any
    }
  }
)

function setTab(tab: 'profile' | 'preferences' | 'security' | 'shortcuts') {
  activeTab.value = tab
  router.replace({ query: { ...route.query, tab } })
}
</script>

<template>
  <div class="flex flex-col gap-6 max-w-5xl mx-auto">
    <!-- Header -->
    <div class="flex flex-wrap items-start justify-between gap-4 pb-2">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight text-foreground">Account & Preferences</h1>
        <p class="text-xs text-muted-foreground mt-1">
          Manage your personal profile, workspace configurations, and security settings.
        </p>
      </div>
    </div>

    <!-- Navigation Tabs -->
    <div class="flex items-center gap-1 overflow-x-auto rounded-lg bg-muted/60 p-1 text-xs border border-border/50 scrollbar-none">
      <button
        type="button"
        class="flex items-center gap-2 rounded-md px-3.5 py-2 font-medium transition-all cursor-pointer shrink-0 whitespace-nowrap"
        :class="activeTab === 'profile' ? 'bg-background text-foreground shadow-xs font-semibold' : 'text-muted-foreground hover:text-foreground hover:bg-background/50'"
        @click="setTab('profile')"
      >
        <User class="size-3.5" />
        <span>Profile & Avatar</span>
      </button>

      <button
        type="button"
        class="flex items-center gap-2 rounded-md px-3.5 py-2 font-medium transition-all cursor-pointer shrink-0 whitespace-nowrap"
        :class="activeTab === 'preferences' ? 'bg-background text-foreground shadow-xs font-semibold' : 'text-muted-foreground hover:text-foreground hover:bg-background/50'"
        @click="setTab('preferences')"
      >
        <Sliders class="size-3.5" />
        <span>Workspace Preferences</span>
      </button>

      <button
        type="button"
        class="flex items-center gap-2 rounded-md px-3.5 py-2 font-medium transition-all cursor-pointer shrink-0 whitespace-nowrap"
        :class="activeTab === 'security' ? 'bg-background text-foreground shadow-xs font-semibold' : 'text-muted-foreground hover:text-foreground hover:bg-background/50'"
        @click="setTab('security')"
      >
        <Lock class="size-3.5" />
        <span>Security & Password</span>
      </button>

      <button
        type="button"
        class="flex items-center gap-2 rounded-md px-3.5 py-2 font-medium transition-all cursor-pointer shrink-0 whitespace-nowrap"
        :class="activeTab === 'shortcuts' ? 'bg-background text-foreground shadow-xs font-semibold' : 'text-muted-foreground hover:text-foreground hover:bg-background/50'"
        @click="setTab('shortcuts')"
      >
        <Keyboard class="size-3.5" />
        <span>Keyboard Shortcuts</span>
      </button>
    </div>

    <!-- Tab Contents -->
    <ProfileInfoTab v-if="activeTab === 'profile'" />
    <ProfilePreferencesTab v-else-if="activeTab === 'preferences'" />
    <ProfileSecurityTab v-else-if="activeTab === 'security'" />
    <ProfileShortcutsTab v-else-if="activeTab === 'shortcuts'" />
  </div>
</template>
