import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { VueQueryPlugin, type VueQueryPluginOptions } from '@tanstack/vue-query'
import App from './App.vue'
import router from './router'
import './assets/main.css'

const vueQueryPluginOptions: VueQueryPluginOptions = {
  queryClientConfig: {
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 2, // 2 minutes staleTime
        gcTime: 1000 * 60 * 10,   // 10 minutes memory garbage collection
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  },
}

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(VueQueryPlugin, vueQueryPluginOptions)

app.mount('#app')
