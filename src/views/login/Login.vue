<template><div class="login"><el-card><h2>冶金采购管理系统</h2><el-form><el-form-item><el-input placeholder="账号" /></el-form-item><el-form-item><el-input type="password" placeholder="密码" /></el-form-item><el-button type="primary" style="width:100%" @click="login">登录</el-button></el-form></el-card></div></template>
<script setup>
import { useRouter } from 'vue-router'
const router = useRouter(); function login () { localStorage.setItem('token', 'stage-1-placeholder'); router.push('/') }
</script>
<style scoped>.login{min-height:100vh;display:grid;place-items:center;background:#f3f6fa}.el-card{width:360px}</style>
