<template><el-container class="layout"><el-aside width="220px"><h2>冶金采购</h2><el-menu router><el-menu-item index="/dashboard">仪表盘</el-menu-item><el-menu-item v-for="item in menus" :key="item.path" :index="item.path">{{ item.title }}</el-menu-item></el-menu></el-aside><el-container><el-header>原材料采购管理系统 <el-button link @click="logout">退出</el-button></el-header><el-main><router-view /></el-main></el-container></el-container></template>
<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores'
const router = useRouter(); const userStore = useUserStore()
const allMenus = [{ path: '/material', title: '物料档案', permission: 'material:read' }, { path: '/supplier', title: '供应商管理', permission: 'supplier:read' }, { path: '/purchase-plan', title: '采购计划', permission: 'purchase-plan:read' }, { path: '/purchase-order', title: '采购订单', permission: 'purchase-order:read' }, { path: '/arrival-inspect', title: '到货检验', permission: 'arrival-inspect:read' }, { path: '/inbound', title: '入库管理', permission: 'inbound:read' }, { path: '/outbound', title: '领用出库', permission: 'outbound:read' }, { path: '/inventory', title: '库存台账', permission: 'inventory:read' }, { path: '/report', title: '统计报表', permission: 'report:read' }]
const menus = computed(() => allMenus.filter(item => userStore.can(item.permission)))
async function logout () { await userStore.signOut(); router.push('/login') }
</script>
<style scoped>.layout{min-height:100vh}.el-aside{background:#18222c;color:#fff}.el-aside h2{padding:12px 20px}.el-menu{border-right:0}.el-header{display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #eee}.el-main{background:#f5f7fa}.page-head{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px}.page-head h2{margin:0 0 8px}.page-head p{margin:0;color:#789}.el-pagination{justify-content:flex-end;margin-top:18px}</style>
