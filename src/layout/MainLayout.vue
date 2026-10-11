<template>
  <el-container class="layout-shell">
    <el-aside class="sidebar" width="232px">
      <div class="brand-lockup">
        <div class="brand-mark">冶</div>
        <div><h2>冶金采购</h2><span>PROCUREMENT OFFICE</span></div>
      </div>
      <div class="nav-label">工作空间</div>
      <el-menu class="side-menu" router :default-active="route.path">
        <el-menu-item index="/dashboard"><el-icon><DataBoard /></el-icon><span>仪表盘</span></el-menu-item>
        <el-menu-item v-for="item in menus" :key="item.path" :index="item.path"><el-icon><component :is="item.icon" /></el-icon><span>{{ item.title }}</span></el-menu-item>
        <div class="nav-label account-label">账户</div>
        <el-menu-item index="/account"><el-icon><User /></el-icon><span>账户管理</span></el-menu-item>
      </el-menu>
      <div class="sidebar-foot"><span class="status-dot" />系统运行正常</div>
    </el-aside>

    <el-container class="workspace">
      <el-header class="topbar" height="72px">
        <div class="topbar-context"><span class="context-kicker">METALLURGY / PROCUREMENT</span><span class="context-title">原材料采购管理系统</span></div>
        <div class="topbar-actions">
          <el-button class="profile-trigger" text @click="goAccount" aria-label="打开个人中心">
            <el-avatar class="user-avatar" :size="36">{{ avatarInitial }}</el-avatar>
            <span class="profile-name">{{ displayName }}</span>
            <el-icon class="profile-chevron"><ArrowDown /></el-icon>
          </el-button>
          <span class="topbar-divider" />
          <el-button class="logout-button" text @click="logout"><el-icon><SwitchButton /></el-icon><span>退出</span></el-button>
        </div>
      </el-header>
      <el-main class="main-content"><router-view /></el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { DataBoard, User, ArrowDown, SwitchButton, Box, Shop, Tickets, Document, CircleCheck, Download, Upload, Files, TrendCharts } from '@element-plus/icons-vue'
import { useUserStore } from '../stores'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const currentUser = computed(() => userStore.user || {})
const displayName = computed(() => currentUser.value.realName || currentUser.value.username || '当前用户')
const avatarInitial = computed(() => Array.from(displayName.value.trim())[0] || '用')
const allMenus = [
  { path: '/material', title: '物料档案', permission: 'material:read', icon: Box },
  { path: '/supplier', title: '供应商管理', permission: 'supplier:read', icon: Shop },
  { path: '/purchase-plan', title: '采购计划', permission: 'purchase-plan:read', icon: Tickets },
  { path: '/purchase-order', title: '采购订单', permission: 'purchase-order:read', icon: Document },
  { path: '/arrival-inspect', title: '到货检验', permission: 'arrival-inspect:read', icon: CircleCheck },
  { path: '/inbound', title: '入库管理', permission: 'inbound:read', icon: Download },
  { path: '/outbound', title: '领用出库', permission: 'outbound:read', icon: Upload },
  { path: '/inventory', title: '库存台账', permission: 'inventory:read', icon: Files },
  { path: '/report', title: '统计报表', permission: 'report:read', icon: TrendCharts }
]
const menus = computed(() => allMenus.filter(item => userStore.can(item.permission)))
function goAccount () { router.push('/account') }
async function logout () { await userStore.signOut(); router.push('/login') }
</script>

<style scoped>
.layout-shell { min-height: 100vh; background: #f2f5f7; }
.sidebar { display: flex; flex-direction: column; background: #142332; color: #eaf0f5; border-right: 1px solid rgba(255,255,255,.06); }
.brand-lockup { display: flex; align-items: center; gap: 12px; padding: 22px 20px 26px; }
.brand-mark { display: grid; place-items: center; width: 38px; height: 38px; border: 1px solid rgba(243,183,99,.55); border-radius: 11px; color: #f4bd70; font-family: Georgia,serif; font-size: 21px; background: linear-gradient(145deg,rgba(244,184,96,.15),rgba(244,184,96,.03)); }
.brand-lockup h2 { margin: 0 0 4px; color: #f6f8fa; font-size: 16px; letter-spacing: .04em; }
.brand-lockup span,.nav-label { color: #8293a3; font-size: 9px; letter-spacing: .17em; }
.nav-label { padding: 8px 22px 10px; text-transform: uppercase; }
.account-label { margin-top: 18px; }
.side-menu { flex: 1; border-right: 0; background: transparent; --el-menu-bg-color: transparent; --el-menu-text-color: #9babb9; --el-menu-hover-bg-color: rgba(255,255,255,.06); --el-menu-active-color: #f3bd70; }
.side-menu :deep(.el-menu-item) { height: 44px; margin: 2px 11px; border-radius: 8px; font-size: 13px; }
.side-menu :deep(.el-menu-item .el-icon) { color: #8297a7; font-size: 16px; }
.side-menu :deep(.el-menu-item.is-active) { background: linear-gradient(90deg,rgba(243,183,99,.17),rgba(243,183,99,.04)); box-shadow: inset 2px 0 #e8ad5d; }
.side-menu :deep(.el-menu-item.is-active .el-icon) { color: #f3bd70; }
.sidebar-foot { display: flex; align-items: center; gap: 9px; margin: 18px 18px 20px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,.08); color: #8192a0; font-size: 11px; }
.status-dot { width: 7px; height: 7px; border-radius: 50%; background: #67bd8e; box-shadow: 0 0 0 4px rgba(103,189,142,.1); }
.workspace { min-width: 0; }
.topbar { display: flex; align-items: center; justify-content: space-between; padding: 0 32px; border-bottom: 1px solid #e5eaee; background: rgba(255,255,255,.92); }
.topbar-context { display: flex; flex-direction: column; gap: 3px; }
.context-kicker { color: #9aa8b2; font-size: 9px; letter-spacing: .19em; }
.context-title { color: #293c4d; font-size: 14px; font-weight: 600; }
.topbar-actions { display: flex; align-items: center; gap: 18px; }
.profile-trigger { height: 46px; padding: 4px 8px 4px 4px; border-radius: 24px; color: #304354; }
.profile-trigger:hover { background: #f2f5f6; }
.user-avatar { flex: 0 0 auto; color: #243746; background: linear-gradient(145deg,#f4c477,#df9f4d); font-weight: 700; }
.profile-name { margin-left: 9px; font-size: 13px; font-weight: 600; }
.profile-chevron { margin-left: 5px; color: #8796a0; font-size: 12px; }
.topbar-divider { width: 1px; height: 24px; background: #e5eaee; }
.logout-button { color: #768691; font-size: 12px; }
.logout-button:hover { color: #b05243; }
.main-content { min-height: calc(100vh - 72px); padding: 30px 34px 42px; background: radial-gradient(ellipse at 86% 2%,rgba(230,178,106,.09),transparent 32%),#f2f5f7; }
@media (max-width: 760px) { .sidebar { width: 64px !important; } .brand-lockup { justify-content: center; padding: 18px 0; } .brand-lockup > div:last-child,.nav-label,.sidebar-foot,.side-menu :deep(.el-menu-item span) { display: none; } .side-menu :deep(.el-menu-item) { justify-content: center; margin: 4px 8px; padding: 0 !important; } .side-menu :deep(.el-menu-item .el-icon) { margin: 0; } .topbar { padding: 0 14px; } .context-kicker { display: none; } .context-title { font-size: 12px; } .topbar-actions { gap: 8px; } .profile-name,.profile-chevron,.logout-button span { display: none; } .main-content { padding: 22px 16px; } }
</style>
