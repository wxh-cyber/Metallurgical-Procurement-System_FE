import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import App from './App.vue'
import router from './router'
import { useUserStore } from './stores'

const app = createApp(App)
const pinia = createPinia()
app.use(pinia).use(router).use(ElementPlus)
const userStore = useUserStore(pinia)
window.addEventListener('auth-expired', () => {
  userStore.clear()
  if (router.currentRoute.value.path !== '/login') router.replace('/login')
})
userStore.restore().catch(() => {}).finally(() => app.mount('#app'))
