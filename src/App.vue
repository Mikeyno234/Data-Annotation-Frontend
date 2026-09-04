<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import MainLayout from '@/components/layout/MainLayout.vue'
import ToastContainer from '@/components/ui/ToastContainer.vue'
import { useTheme } from '@/stores/theme'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const authStore = useAuthStore()
const isLoginPage = computed(() => route.path === '/login')
useTheme()

onMounted(async () => {
  if (authStore.isAuthenticated) {
    await authStore.fetchCurrentUser()
  }
})
</script>

<template>
  <div v-if="isLoginPage">
    <RouterView v-slot="{ Component }">
      <transition name="page-fade" mode="out-in">
        <component :is="Component" />
      </transition>
    </RouterView>
    <ToastContainer />
  </div>
  <MainLayout v-else>
    <RouterView v-slot="{ Component, route }">
      <transition name="page-slide" mode="out-in">
        <component :is="Component" :key="route.path" />
      </transition>
    </RouterView>
  </MainLayout>
</template>
