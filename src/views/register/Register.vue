<template>
  <main class="auth-page">
    <div class="auth-orb" aria-hidden="true" />
    <section class="auth-shell" aria-labelledby="register-title">
      <div class="auth-intro"><div><div class="auth-kicker">RAW MATERIALS / 01</div><h1 id="register-title" class="auth-title">让每一批原料，都有迹可循。</h1><p class="auth-copy">建立您的采购工作台，集中管理供应商、计划、订单与库存，让关键决策始终建立在清晰数据之上。</p></div><div class="auth-metric"><div><strong>24/7</strong>流程可追踪</div><div><strong>01</strong>统一工作台</div></div></div>
      <div class="auth-form-panel"><el-form ref="formRef" class="auth-form" :model="form" :rules="rules" @submit.prevent="submit"><h2 class="auth-form-heading">创建工作账号</h2><p class="auth-form-subtitle">加入冶金采购管理系统，开始建立您的业务协同空间。</p><el-form-item prop="username"><el-input v-model="form.username" placeholder="用户名" autocomplete="username" /></el-form-item><el-form-item prop="email"><el-input v-model="form.email" placeholder="邮箱地址" autocomplete="email" /></el-form-item><el-form-item prop="password"><el-input v-model="form.password" type="password" show-password placeholder="设置密码（至少 6 位）" autocomplete="new-password" /></el-form-item><el-button class="auth-submit" native-type="submit" :loading="loading">创建账号</el-button><p class="auth-switch">已有账号？<router-link to="/login">返回登录</router-link></p></el-form></div>
    </section>
  </main>
</template>
<script setup>
import { reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import { register } from '../../api/auth'
import '../../styles/auth.css'
const router = useRouter(); const formRef = ref(); const loading = ref(false); const form = reactive({ username: '', email: '', password: '' })
const rules = { username: [{ required: true, message: '请输入用户名', trigger: 'blur' }], email: [{ required: true, message: '请输入邮箱地址', trigger: 'blur' }, { type: 'email', message: '请输入有效的邮箱地址', trigger: ['blur', 'change'] }], password: [{ required: true, message: '请输入密码', trigger: 'blur' }, { min: 6, message: '密码至少需要 6 位', trigger: 'blur' }] }
async function submit () {
  if (loading.value) return
  const valid = await formRef.value.validate().catch(() => false); if (!valid) return
  loading.value = true
  try { const response = await register(form); if (response?.code && response.code !== 200) throw new Error(response.msg || '注册失败'); ElMessage.success('账号创建成功，请登录'); await router.push('/login') } catch (error) { const status = error.response?.status; const message = error.response?.data?.msg || (status === 404 ? '注册接口未部署，请检查后端版本' : status === 409 ? '用户名或邮箱已存在' : error.message || '注册失败'); ElMessage.error(message) } finally { loading.value = false }
}
</script>
