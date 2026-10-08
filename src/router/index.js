import { createRouter, createWebHistory } from 'vue-router'
import MainLayout from '../layout/MainLayout.vue'

const routes = [
  { path: '/login', component: () => import('../views/login/Login.vue') },
  { path: '/', component: MainLayout, redirect: '/dashboard', children: [
    { path: 'dashboard', component: () => import('../views/dashboard/Dashboard.vue') },
    { path: 'material', component: () => import('../views/Placeholder.vue'), meta: { title: '物料档案' } },
    { path: 'supplier', component: () => import('../views/Placeholder.vue'), meta: { title: '供应商管理' } },
    { path: 'purchase-plan', component: () => import('../views/Placeholder.vue'), meta: { title: '采购计划' } },
    { path: 'purchase-order', component: () => import('../views/Placeholder.vue'), meta: { title: '采购订单' } },
    { path: 'arrival-inspect', component: () => import('../views/Placeholder.vue'), meta: { title: '到货检验' } },
    { path: 'inbound', component: () => import('../views/Placeholder.vue'), meta: { title: '入库管理' } },
    { path: 'outbound', component: () => import('../views/Placeholder.vue'), meta: { title: '领用出库' } },
    { path: 'inventory', component: () => import('../views/Placeholder.vue'), meta: { title: '库存台账' } },
    { path: 'report', component: () => import('../views/Placeholder.vue'), meta: { title: '统计报表' } }
  ]}
]
const router = createRouter({ history: createWebHistory(), routes })
router.beforeEach((to) => { if (to.path !== '/login' && !localStorage.getItem('token')) return '/login' })
export default router
