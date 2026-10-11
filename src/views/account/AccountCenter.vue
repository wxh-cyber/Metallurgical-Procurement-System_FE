<template>
  <section class="account-page">
    <header class="page-heading">
      <div>
        <div class="eyebrow"><span class="eyebrow-line" /> ACCOUNT / PROFILE</div>
        <h1>个人中心</h1>
        <p>管理您的账户资料与安全设置。</p>
      </div>
      <div class="heading-mark" aria-hidden="true">ACCOUNT<br />CONTROL</div>
    </header>

    <div class="account-grid">
      <el-card class="profile-card" shadow="never">
        <div class="card-heading"><div><span class="section-index">01 / PROFILE</span><h2>账户资料</h2></div><el-icon class="heading-icon"><UserFilled /></el-icon></div>
        <div class="identity-banner">
          <el-avatar :size="58" class="identity-avatar">{{ avatarInitial }}</el-avatar>
          <div><span class="identity-caption">当前账户</span><strong>{{ displayName }}</strong></div>
          <div class="identity-status"><i />已登录</div>
        </div>
        <dl class="profile-details">
          <div class="detail-row"><dt><el-icon><User /></el-icon>用户名</dt><dd>{{ user.username || '—' }}</dd></div>
          <div class="detail-row"><dt><el-icon><Message /></el-icon>邮箱</dt><dd>{{ user.email || '—' }}</dd></div>
          <div class="detail-row role-row"><dt><el-icon><Avatar /></el-icon>身份</dt><dd><el-tag v-for="role in roles" :key="role.code" class="role-chip" effect="plain" round>{{ role.label }}</el-tag><span v-if="!roles.length" class="empty-value">未分配</span></dd></div>
        </dl>
        <div class="profile-note"><el-icon><InfoFilled /></el-icon><span>个人资料由系统账户信息提供，如需变更请联系系统管理员。</span></div>
      </el-card>

      <el-card class="security-card" shadow="never">
        <div class="card-heading"><div><span class="section-index">02 / SECURITY</span><h2>账户安全</h2></div><el-icon class="heading-icon"><Lock /></el-icon></div>
        <p class="security-intro">定期维护账户安全，保护采购业务数据。</p>
        <div class="security-action">
          <div class="action-symbol password-symbol"><el-icon><Key /></el-icon></div>
          <div class="action-copy"><h3>修改密码</h3><p>更新登录凭据，建议使用安全且独立的密码。</p></div>
          <el-button class="action-button" @click="openPasswordDialog">修改密码<el-icon class="el-icon--right"><ArrowRight /></el-icon></el-button>
        </div>
        <div class="danger-zone">
          <div class="danger-heading"><span class="danger-mark">!</span><div><h3>危险操作</h3><p>此区域中的操作可能影响账户访问，请谨慎执行。</p></div></div>
          <div class="security-action danger-action">
            <div class="action-symbol danger-symbol"><el-icon><WarningFilled /></el-icon></div>
            <div class="action-copy"><h3>注销账户</h3><p>退出当前账户并清除本设备保存的登录状态。</p></div>
            <el-button class="delete-button" type="danger" plain @click="deleteDialogVisible = true">注销账户</el-button>
          </div>
        </div>
      </el-card>
    </div>

    <el-dialog v-model="passwordDialogVisible" title="修改密码" width="460px" class="account-dialog" @closed="resetPasswordForm">
      <p class="dialog-intro">请填写当前密码和新的登录密码。</p>
      <el-form ref="passwordFormRef" :model="passwordForm" :rules="passwordRules" label-position="top">
        <el-form-item label="当前密码" prop="currentPassword"><el-input v-model="passwordForm.currentPassword" type="password" show-password autocomplete="current-password" placeholder="请输入当前密码" /></el-form-item>
        <el-form-item label="新密码" prop="newPassword"><el-input v-model="passwordForm.newPassword" type="password" show-password autocomplete="new-password" placeholder="至少 8 位，包含字母和数字" /></el-form-item>
        <el-form-item label="确认新密码" prop="confirmPassword"><el-input v-model="passwordForm.confirmPassword" type="password" show-password autocomplete="new-password" placeholder="再次输入新密码" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="passwordDialogVisible = false">取消</el-button><el-button type="primary" :loading="passwordSubmitting" @click="submitPasswordChange">确认修改</el-button></template>
    </el-dialog>

    <el-dialog v-model="deleteDialogVisible" title="确认注销账户" width="440px" class="account-dialog delete-dialog">
      <div class="confirm-content"><span class="confirm-icon"><el-icon><WarningFilled /></el-icon></span><div><strong>确定要注销当前账户吗？</strong><p>确认后将清除本设备保存的登录状态，并返回登录页面。此操作不会删除服务器账户。</p></div></div>
      <template #footer><el-button @click="deleteDialogVisible = false">暂不注销</el-button><el-button type="danger" @click="confirmDeleteAccount">确认注销</el-button></template>
    </el-dialog>
  </section>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { UserFilled, User, Message, Avatar, InfoFilled, Lock, Key, ArrowRight, WarningFilled } from '@element-plus/icons-vue'
import { useUserStore } from '../../stores'

const router = useRouter()
const userStore = useUserStore()
const user = computed(() => userStore.user || {})
const displayName = computed(() => user.value.realName || user.value.username || '当前用户')
const avatarInitial = computed(() => Array.from(displayName.value.trim())[0] || '用')
const roleLabels = { ADMIN: '系统管理员', PROCUREMENT: '采购员', INSPECTOR: '质检员', WAREHOUSE: '库管员' }
const roles = computed(() => userStore.roles.map(code => ({ code, label: roleLabels[code] || code })))

const passwordDialogVisible = ref(false)
const deleteDialogVisible = ref(false)
const passwordSubmitting = ref(false)
const passwordFormRef = ref()
const passwordForm = reactive({ currentPassword: '', newPassword: '', confirmPassword: '' })
const validateNewPassword = (_rule, value, callback) => {
  if (!value) return callback(new Error('请输入新密码'))
  if (value.length < 8 || !/[A-Za-z]/.test(value) || !/[0-9]/.test(value)) return callback(new Error('新密码至少 8 位，且需包含字母和数字'))
  if (value === passwordForm.currentPassword) return callback(new Error('新密码不能与当前密码相同'))
  callback()
}
const validatePasswordConfirmation = (_rule, value, callback) => {
  if (!value) return callback(new Error('请再次输入新密码'))
  if (value !== passwordForm.newPassword) return callback(new Error('两次输入的新密码不一致'))
  callback()
}
const passwordRules = {
  currentPassword: [{ required: true, message: '请输入当前密码', trigger: 'blur' }],
  newPassword: [{ validator: validateNewPassword, trigger: ['blur', 'change'] }],
  confirmPassword: [{ validator: validatePasswordConfirmation, trigger: ['blur', 'change'] }]
}

function openPasswordDialog () { passwordDialogVisible.value = true }
function resetPasswordForm () { passwordFormRef.value?.resetFields(); Object.assign(passwordForm, { currentPassword: '', newPassword: '', confirmPassword: '' }) }
async function submitPasswordChange () {
  const valid = await passwordFormRef.value?.validate().catch(() => false)
  if (!valid || passwordSubmitting.value) return
  passwordSubmitting.value = true
  try { ElMessage.info('修改密码接口待接入，当前未更改账户密码。'); passwordDialogVisible.value = false } finally { passwordSubmitting.value = false }
}
async function confirmDeleteAccount () {
  deleteDialogVisible.value = false
  await userStore.signOut().catch(() => {})
  ElMessage.success('已注销当前账户')
  await router.replace('/login')
}
</script>

<style scoped>
.account-page { max-width: 1120px; margin: 0 auto; color: #263a4b; animation: page-enter 420ms ease both; }
.page-heading { display: flex; justify-content: space-between; align-items: flex-end; margin: 1px 0 25px; }
.eyebrow { display: flex; align-items: center; gap: 9px; color: #a17b49; font-size: 9px; font-weight: 700; letter-spacing: .19em; }
.eyebrow-line { width: 21px; height: 1px; background: #d9a75d; }
.page-heading h1 { margin: 10px 0 6px; color: #243848; font-size: 27px; letter-spacing: -.04em; }
.page-heading p { margin: 0; color: #82909b; font-size: 13px; }
.heading-mark { padding: 0 0 4px 18px; border-left: 1px solid #d8e0e4; color: #9aa8af; font-size: 8px; line-height: 1.7; letter-spacing: .18em; }
.account-grid { display: grid; grid-template-columns: minmax(0,1fr) minmax(0,1.1fr); gap: 20px; align-items: stretch; }
.account-grid :deep(.el-card) { overflow: hidden; border: 1px solid #e3e9ec; border-radius: 14px; background: rgba(255,255,255,.94); box-shadow: 0 8px 28px rgba(30,52,68,.035); }
.account-grid :deep(.el-card__body) { padding: 25px 26px; }
.card-heading { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 22px; }
.section-index { color: #9aa7ae; font-size: 9px; letter-spacing: .16em; }
.card-heading h2 { margin: 6px 0 0; color: #2a3e4e; font-size: 17px; }
.heading-icon { color: #bf9660; font-size: 18px; }
.identity-banner { display: flex; align-items: center; gap: 14px; padding: 17px 16px; border: 1px solid #e9edef; border-radius: 11px; background: linear-gradient(105deg,#f6f8f8,#fbfaf7); }
.identity-avatar { color: #243746; background: linear-gradient(145deg,#f4c477,#dfa354); font-size: 23px; font-weight: 700; }
.identity-banner > div:nth-child(2) { display: flex; flex: 1; flex-direction: column; gap: 4px; }
.identity-caption { color: #98a5ad; font-size: 10px; }
.identity-banner strong { color: #293d4d; font-size: 16px; }
.identity-status { display: inline-flex; align-items: center; gap: 6px; color: #6d9e7f; font-size: 10px; }
.identity-status i { width: 6px; height: 6px; border-radius: 50%; background: #68b687; }
.profile-details { margin: 13px 0 0; }
.detail-row { display: grid; grid-template-columns: 116px 1fr; align-items: center; min-height: 53px; border-bottom: 1px solid #eef1f2; }
.detail-row dt { display: flex; align-items: center; gap: 9px; color: #8b99a2; font-size: 12px; }
.detail-row dt :deep(.el-icon) { font-size: 14px; color: #aab5ba; }
.detail-row dd { display: flex; flex-wrap: wrap; gap: 7px; margin: 0; color: #32495a; font-size: 13px; font-weight: 600; overflow-wrap: anywhere; }
.role-chip { border-color: #e7d8bd; color: #9a7543; background: #fcf8f0; font-size: 11px; }
.empty-value { color: #a5afb5; font-weight: 400; }
.profile-note { display: flex; align-items: flex-start; gap: 8px; margin-top: 17px; color: #98a5ac; font-size: 10px; line-height: 1.6; }
.profile-note :deep(.el-icon) { margin-top: 1px; color: #b29a76; }
.security-intro { margin: -13px 0 18px; color: #87949c; font-size: 12px; }
.security-action { display: flex; align-items: center; gap: 13px; padding: 16px 0; }
.action-symbol { display: grid; flex: 0 0 38px; place-items: center; width: 38px; height: 38px; border-radius: 11px; font-size: 16px; }
.password-symbol { color: #a67a3d; background: #faf3e6; }
.action-copy { flex: 1; min-width: 0; }
.action-copy h3 { margin: 0 0 5px; color: #344858; font-size: 13px; }
.action-copy p { margin: 0; color: #929fa6; font-size: 10px; line-height: 1.55; }
.action-button { flex: 0 0 auto; border-color: #dfe6e9; color: #496071; font-size: 11px; }
.action-button:hover { border-color: #d2a55e; color: #9c743f; background: #fffaf1; }
.danger-zone { margin-top: 17px; padding: 16px 15px 4px; border: 1px solid #f0e2de; border-radius: 11px; background: linear-gradient(135deg,#fffafa,#fff); }
.danger-heading { display: flex; align-items: flex-start; gap: 10px; padding-bottom: 10px; border-bottom: 1px solid #f5eae7; }
.danger-mark { display: grid; flex: 0 0 18px; place-items: center; width: 18px; height: 18px; border-radius: 50%; color: #b76452; background: #f9e9e5; font-size: 11px; font-weight: 700; }
.danger-heading h3 { margin: 1px 0 4px; color: #93584e; font-size: 12px; }
.danger-heading p { margin: 0; color: #aa9691; font-size: 10px; }
.danger-action { padding-bottom: 10px; }
.danger-symbol { color: #b35e4d; background: #fbece8; }
.danger-action .action-copy h3 { color: #704a44; }
.delete-button { flex: 0 0 auto; font-size: 11px; }
.dialog-intro { margin: -4px 0 20px; color: #87949c; font-size: 12px; }
.account-dialog :deep(.el-dialog) { border-radius: 14px; }
.account-dialog :deep(.el-dialog__title) { color: #2b3f4f; font-size: 17px; font-weight: 650; }
.account-dialog :deep(.el-form-item__label) { color: #536674; font-size: 12px; }
.account-dialog :deep(.el-input__wrapper) { min-height: 39px; border-radius: 8px; box-shadow: 0 0 0 1px #e1e7e9 inset; }
.account-dialog :deep(.el-input__wrapper.is-focus) { box-shadow: 0 0 0 1px #c89a58 inset,0 0 0 3px rgba(200,154,88,.1); }
.confirm-content { display: flex; align-items: flex-start; gap: 13px; }
.confirm-icon { display: grid; flex: 0 0 36px; place-items: center; width: 36px; height: 36px; border-radius: 10px; color: #b45f4e; background: #fbece8; font-size: 17px; }
.confirm-content strong { display: block; margin: 1px 0 8px; color: #344858; font-size: 13px; }
.confirm-content p { margin: 0; color: #89969e; font-size: 11px; line-height: 1.7; }
@keyframes page-enter { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
@media (max-width: 900px) { .account-grid { grid-template-columns: 1fr; } }
@media (max-width: 520px) { .page-heading { align-items: flex-start; } .heading-mark { display: none; } .account-grid :deep(.el-card__body) { padding: 21px 18px; } .detail-row { grid-template-columns: 92px 1fr; } .security-action { gap: 9px; } .action-copy p { max-width: 190px; } .action-button { padding: 8px 9px; } .delete-button { padding: 8px 10px; } }
</style>
