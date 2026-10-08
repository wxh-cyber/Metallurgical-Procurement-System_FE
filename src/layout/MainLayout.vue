<template><el-container class="layout"><el-aside width="220px"><h2>冶金采购</h2><el-menu router><el-menu-item index="/dashboard">仪表盘</el-menu-item><el-menu-item v-for="item in menus" :key="item.path" :index="item.path">{{ item.title }}</el-menu-item></el-menu></el-aside><el-container><el-header>原材料采购管理系统 <el-button link @click="logout">退出</el-button></el-header><el-main><router-view /></el-main></el-container></el-container></template>
<script setup>
import { useRouter } from 'vue-router'
const router = useRouter()
const menus = [{ path: '/material', title: '物料档案' }, { path: '/supplier', title: '供应商管理' }, { path: '/purchase-plan', title: '采购计划' }, { path: '/purchase-order', title: '采购订单' }, { path: '/arrival-inspect', title: '到货检验' }, { path: '/inbound', title: '入库管理' }, { path: '/outbound', title: '领用出库' }, { path: '/inventory', title: '库存台账' }, { path: '/report', title: '统计报表' }]
function logout () { localStorage.removeItem('token'); router.push('/login') }
</script>
<style scoped>.layout{min-height:100vh}.el-aside{background:#18222c;color:#fff}.el-aside h2{padding:12px 20px}.el-menu{border-right:0}.el-header{display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #eee}</style>
