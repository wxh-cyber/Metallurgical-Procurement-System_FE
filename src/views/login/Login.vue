<template>
  <main class="auth-page">
    <div class="auth-orb" aria-hidden="true" />
    <section class="auth-shell" aria-labelledby="login-title">
      <div class="auth-intro"><div><div class="auth-kicker">METALLURGY / PROCUREMENT</div><h1 id="login-title" class="auth-title">把复杂供应链，炼成清晰秩序。</h1><p class="auth-copy">从物料档案到入库台账，在一个可靠的工作台里看见每一次采购动作的来处与去向。</p></div><div class="auth-metric"><div><strong>10+</strong>业务模块</div><div><strong>1</strong>数据入口</div></div></div>
      <div class="auth-form-panel"><el-form ref="formRef" class="auth-form" :model="form" :rules="rules" @submit.prevent="submit"><h2 class="auth-form-heading">欢迎回来</h2><p class="auth-form-subtitle">登录您的采购管理工作台，继续推进业务。</p><el-form-item prop="account"><el-input v-model="form.account" placeholder="用户名或邮箱" autocomplete="username" /></el-form-item><el-form-item prop="password"><el-input v-model="form.password" type="password" show-password placeholder="密码" autocomplete="current-password" /></el-form-item><el-button class="auth-submit" native-type="submit" :loading="loading">登录工作台</el-button><p class="auth-switch">还没有账号？<router-link to="/register">创建工作账号</router-link></p></el-form></div>
    </section>
  </main>
</template>
<script setup>
import { reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import { useUserStore } from '../../stores'
import '../../styles/auth.css'
const router = useRouter(); const userStore = useUserStore(); const formRef = ref(); const loading = ref(false); const form = reactive({ account: '', password: '' })
const rules = { account: [{ required: true, message: '请输入用户名或邮箱', trigger: 'blur' }], password: [{ required: true, message: '请输入密码', trigger: 'blur' }] }
async function submit () {
  if (loading.value) return
  const valid = await formRef.value.validate().catch(() => false); if (!valid) return
  loading.value = true
  try { await userStore.signIn({ username: form.account, password: form.password }); ElMessage.success('登录成功'); await router.push('/') } catch (error) { ElMessage.error(error.response?.data?.msg || error.message || '登录失败') } finally { loading.value = false }
}
</script>
