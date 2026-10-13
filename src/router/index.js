import { createRouter, createWebHistory } from 'vue-router'
import MainLayout from '../layout/MainLayout.vue'

const routes = [
  { path: '/login', component: () => import('../views/login/Login.vue') },
  {
    path: '/',
    component: MainLayout,
    redirect: '/dashboard',
    children: [
      { path: 'dashboard', component: () => import('../views/dashboard/Dashboard.vue'), meta: { title: '仪表盘' } },
      { path: 'material', component: () => import('../views/Material.vue'), meta: { title: '物料档案' } },
      { path: 'supplier', component: () => import('../views/Supplier.vue'), meta: { title: '供应商管理' } },
      { path: 'plan', component: () => import('../views/Plan.vue'), meta: { title: '采购计划' } },
      { path: 'order', component: () => import('../views/Order.vue'), meta: { title: '采购订单' } },
      { path: 'inspect', component: () => import('../views/Inspect.vue'), meta: { title: '到货检验' } },
      { path: 'inbound', component: () => import('../views/Inbound.vue'), meta: { title: '入库管理' } },
      { path: 'outbound', component: () => import('../views/Outbound.vue'), meta: { title: '领用出库' } },
      { path: 'inventory', component: () => import('../views/Inventory.vue'), meta: { title: '库存台账' } },
      { path: 'report', component: () => import('../views/Report.vue'), meta: { title: '统计报表' } }
    ]
  }
]

const router = createRouter({ history: createWebHistory(), routes })

// 路由守卫：未登录跳登录页；已登录访问登录页跳仪表盘
router.beforeEach((to) => {
  const hasToken = Boolean(localStorage.getItem('token'))
  if (to.path === '/login') return hasToken ? '/dashboard' : true
  if (!hasToken) return '/login'
})

export default router
