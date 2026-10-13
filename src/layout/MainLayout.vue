<template>
  <el-container class="layout">
    <!-- 左侧固定菜单 -->
    <el-aside width="220px" class="aside">
      <div class="brand">
        <el-icon :size="22"><Goods /></el-icon>
        <span>冶金采购管理</span>
      </div>
      <el-menu router :default-active="$route.path" background-color="#18222c" text-color="#c9d4de" active-text-color="#ffffff" class="menu">
        <el-menu-item v-for="item in visibleMenus" :key="item.path" :index="item.path">
          <el-icon><component :is="item.icon" /></el-icon>
          <span>{{ item.title }}</span>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <!-- 顶部栏：当前登录用户姓名和角色 + 退出登录 -->
      <el-header class="header">
        <div class="header-title">{{ $route.meta.title || '原材料采购管理系统' }}</div>
        <div class="header-user">
          <el-dropdown @command="onCommand">
            <span class="user-info">
              <el-icon><UserFilled /></el-icon>
              <span>{{ userStore.realName }}</span>
              <el-tag size="small" effect="plain">{{ roleText }}</el-tag>
              <el-icon><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <el-main class="main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores'
import { ROLE_DICT } from '../utils/dict'

const router = useRouter()
const userStore = useUserStore()

// 菜单定义：path、标题、图标、可见角色
const allMenus = [
  { path: '/dashboard', title: '仪表盘', icon: 'Odometer', roles: ['ADMIN', 'PROCUREMENT', 'INSPECTOR', 'WAREHOUSE'] },
  { path: '/material', title: '物料档案', icon: 'Box', roles: ['ADMIN', 'PROCUREMENT', 'INSPECTOR', 'WAREHOUSE'] },
  { path: '/supplier', title: '供应商管理', icon: 'OfficeBuilding', roles: ['ADMIN', 'PROCUREMENT', 'INSPECTOR', 'WAREHOUSE'] },
  { path: '/plan', title: '采购计划', icon: 'Document', roles: ['ADMIN', 'PROCUREMENT'] },
  { path: '/order', title: '采购订单', icon: 'ShoppingCart', roles: ['ADMIN', 'PROCUREMENT'] },
  { path: '/inspect', title: '到货检验', icon: 'View', roles: ['ADMIN', 'INSPECTOR'] },
  { path: '/inbound', title: '入库管理', icon: 'Download', roles: ['ADMIN', 'WAREHOUSE'] },
  { path: '/outbound', title: '领用出库', icon: 'Upload', roles: ['ADMIN', 'WAREHOUSE'] },
  { path: '/inventory', title: '库存台账', icon: 'Coin', roles: ['ADMIN', 'PROCUREMENT', 'INSPECTOR', 'WAREHOUSE'] },
  { path: '/report', title: '统计报表', icon: 'DataAnalysis', roles: ['ADMIN', 'PROCUREMENT', 'INSPECTOR'] }
]

// 按当前角色过滤菜单
const visibleMenus = computed(() => {
  const role = userStore.role
  return allMenus.filter((item) => item.roles.includes(role))
})

const roleText = computed(() => ROLE_DICT[userStore.role] || userStore.role)

async function onCommand (command) {
  if (command === 'logout') {
    await userStore.signOut()
    router.push('/login')
  }
}
</script>

<style scoped>
.layout { min-height: 100vh; }
.aside { background: #18222c; display: flex; flex-direction: column; }
.brand { display: flex; align-items: center; gap: 8px; color: #fff; font-size: 16px; font-weight: 600; padding: 18px 20px; letter-spacing: 1px; }
.menu { border-right: 0; flex: 1; }
.header { display: flex; justify-content: space-between; align-items: center; background: #fff; border-bottom: 1px solid #e4e7ed; }
.header-title { font-size: 16px; font-weight: 600; color: #303133; }
.user-info { display: inline-flex; align-items: center; gap: 6px; cursor: pointer; color: #303133; outline: none; }
.main { background: #f5f7fa; }
</style>

<style>
/* 页面通用样式：页头 + 分页 */
.page-head { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
.page-head h2 { margin: 0 0 6px; }
.page-head p { margin: 0; color: #78909c; font-size: 13px; }
.el-pagination { justify-content: flex-end; margin-top: 16px; }
.search-bar { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; }
</style>
