import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import App from './App.vue'
import router from './router'
import { useUserStore } from './stores'

const app = createApp(App)
const pinia = createPinia()
app.use(pinia).use(router).use(ElementPlus)

// 全局注册 Element Plus 图标（侧边菜单等组件内以组件名使用）
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

// 刷新时从本地恢复用户信息
useUserStore(pinia).restore()

app.mount('#app')
