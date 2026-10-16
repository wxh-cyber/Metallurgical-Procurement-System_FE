<template>
  <section class="management-page">
    <header class="management-heading">
      <div><span class="management-kicker">SUPPLIERS / PARTNERS</span><h1>供应商管理</h1><p>维护供应商信息与合作状态。</p></div>
      <el-button class="create-button" type="primary" @click="openCreate">新增供应商</el-button>
    </header>
    <el-card class="management-card" shadow="never">
      <el-form class="management-filters" inline @submit.prevent="load"><el-form-item><el-input v-model="query.keyword" placeholder="搜索供应商名称/编码" clearable /></el-form-item><el-button class="search-button" type="primary" @click="load"><el-icon><Search /></el-icon><span>查询</span></el-button></el-form>
      <el-table v-loading="loading" :data="rows" empty-text="暂无供应商数据"><el-table-column prop="supplierCode" label="供应商编码" /><el-table-column prop="supplierName" label="供应商名称" /><el-table-column prop="contactPerson" label="联系人" /><el-table-column prop="phone" label="联系电话" /><el-table-column prop="status" label="状态"><template #default="{ row }"><el-tag class="status-tag" :class="row.status === 1 ? 'status-enabled' : 'status-disabled'" effect="light">{{ row.status === 1 ? '启用' : '停用' }}</el-tag></template></el-table-column><el-table-column label="操作" width="190" align="center"><template #default="{ row }"><div class="row-actions"><el-button class="row-action-button" size="small" type="primary" plain @click="openEdit(row)">编辑</el-button><el-button class="row-action-button" size="small" type="danger" plain @click="remove(row)">删除</el-button></div></template></el-table-column></el-table>
      <el-pagination v-model:current-page="query.pageNum" v-model:page-size="query.pageSize" layout="total, prev, pager, next" :total="total" @current-change="load" />
    </el-card>
    <el-dialog v-model="dialogVisible" class="supplier-dialog" width="560px" :close-on-click-modal="false" @closed="resetFormValidation">
      <template #header><div class="dialog-heading"><span class="dialog-kicker">SUPPLIER RECORD / {{ editing ? 'UPDATE' : 'NEW ENTRY' }}</span><h2>{{ editing ? '编辑供应商' : '新增供应商' }}</h2><p>维护合作方基础资料与当前合作状态。</p></div></template>
      <el-form ref="formRef" class="supplier-form" :model="form" :rules="rules" label-position="top">
        <div class="form-section-heading"><span class="section-index">01</span><div><strong>基础信息</strong><p>用于识别和联系供应商</p></div></div>
        <div class="form-field-grid"><el-form-item label="供应商编码" prop="supplierCode"><el-input v-model="form.supplierCode" placeholder="请输入唯一供应商编码" /></el-form-item><el-form-item label="供应商名称" prop="supplierName"><el-input v-model="form.supplierName" placeholder="请输入供应商名称" /></el-form-item><el-form-item label="联系人" prop="contactPerson"><el-input v-model="form.contactPerson" placeholder="请输入联系人" /></el-form-item><el-form-item label="联系电话" prop="phone"><el-input v-model="form.phone" placeholder="手机号或座机" /></el-form-item></div>
        <div class="status-section"><div class="form-section-heading"><span class="section-index status-index">02</span><div><strong>合作状态</strong><p>停用后可保留历史采购记录</p></div></div><el-form-item label="状态" prop="status"><el-select v-model="form.status" class="status-select" placeholder="请选择状态"><el-option :value="1" label="启用" /><el-option :value="0" label="停用" /></el-select></el-form-item></div>
      </el-form>
      <template #footer><div class="dialog-actions"><el-button class="cancel-button" @click="dialogVisible = false">取消</el-button><el-button class="save-button" type="primary" :loading="saving" @click="save">保存供应商</el-button></div></template>
    </el-dialog>
  </section>
</template>
<script setup>
import { reactive, ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import { listSuppliers, createSupplier, updateSupplier, deleteSupplier } from '../api/suppliers'
const rows = ref([]); const total = ref(0); const loading = ref(false); const saving = ref(false); const dialogVisible = ref(false); const editing = ref(null); const formRef = ref(); const query = reactive({ pageNum: 1, pageSize: 10, keyword: '' }); const form = reactive({ supplierCode: '', supplierName: '', contactPerson: '', phone: '', status: 1 }); const phonePattern = /^(?:1[3-9]\d{9}|(?:0\d{2,3})[- ]?\d{7,8})$/; const rules = { supplierCode: [{ required: true, message: '请输入供应商编码', trigger: 'blur' }], supplierName: [{ required: true, message: '请输入供应商名称', trigger: 'blur' }], phone: [{ validator: (rule, value, callback) => { if (!value || phonePattern.test(value.trim())) callback(); else callback(new Error('请输入有效的手机号或座机号码')) }, trigger: ['blur', 'change'] }], status: [{ required: true, message: '请选择供应商状态', trigger: 'change' }] }
async function load () { loading.value = true; try { const res = await listSuppliers(query); rows.value = res.data?.records || []; total.value = res.data?.total || 0 } catch (e) { ElMessage.error(e.response?.data?.msg || '供应商加载失败') } finally { loading.value = false } }
function openCreate () { editing.value = null; Object.assign(form, { supplierCode: '', supplierName: '', contactPerson: '', phone: '', status: 1 }); dialogVisible.value = true }
function openEdit (row) { editing.value = row; Object.assign(form, { supplierCode: row.supplierCode || '', supplierName: row.supplierName || '', contactPerson: row.contactPerson || '', phone: row.phone || '', status: row.status === 0 ? 0 : 1 }); dialogVisible.value = true }
function resetFormValidation () { formRef.value?.clearValidate() }
async function save () { const ok = await formRef.value.validate().catch(() => false); if (!ok) return; saving.value = true; try { editing.value ? await updateSupplier(editing.value.id, form) : await createSupplier(form); ElMessage.success('保存成功'); dialogVisible.value = false; await load() } catch (e) { ElMessage.error(e.response?.data?.msg || '保存失败') } finally { saving.value = false } }
async function remove (row) { try { await ElMessageBox.confirm('确认删除该供应商？删除后不可恢复。', '提示', { type: 'warning' }); await deleteSupplier(row.id); ElMessage.success('删除成功'); if (rows.value.length === 1 && query.pageNum > 1) query.pageNum -= 1; await load() } catch (e) { if (e !== 'cancel' && e !== 'close') ElMessage.error(e.response?.data?.msg || '删除失败') } }
onMounted(load)
</script>

<style scoped>
.management-page { max-width: 1320px; margin: 0 auto; }
.management-heading { display: flex; align-items: center; justify-content: space-between; gap: 20px; margin: 1px 0 22px; }
.management-kicker { color: #a17b49; font-size: 9px; font-weight: 700; letter-spacing: .18em; }
.management-heading h1 { margin: 7px 0 5px; color: #243848; font-size: 27px; letter-spacing: -.04em; }
.management-heading p { margin: 0; color: #82909b; font-size: 13px; }
.create-button { flex: 0 0 auto; min-height: 38px; padding: 0 17px; border-radius: 8px; }
.management-card { border: 1px solid #e2e8e9; border-radius: 13px; background: rgba(255,255,255,.96); box-shadow: 0 7px 25px rgba(30,52,68,.035); }
.management-card :deep(.el-card__body) { padding: 20px 22px; }
.management-filters { margin-bottom: 4px; }
.management-filters :deep(.el-form-item) { margin-right: 10px; margin-bottom: 0; }
.management-filters :deep(.el-input) { width: 330px; }
.search-button { min-height: 38px; padding: 0 16px; border-radius: 8px; gap: 6px; box-shadow: 0 5px 12px rgba(52,79,89,.13); }
.search-button:hover { transform: translateY(-1px); box-shadow: 0 7px 15px rgba(52,79,89,.18); }
.status-tag { min-width: 48px; border: 0; border-radius: 999px; font-weight: 650; text-align: center; }
.status-enabled { color: #247453; background: #e5f4ec; }
.status-disabled { color: #7b8587; background: #edf0ef; }
.row-actions { display: flex; justify-content: center; gap: 7px; }
.row-action-button { min-width: 52px; border-radius: 6px; }
.management-card :deep(.el-pagination) { justify-content: flex-end; margin-top: 16px; }
.dialog-heading { padding-right: 28px; }
.dialog-kicker { color: #a17b49; font-size: 9px; font-weight: 800; letter-spacing: .2em; }
.dialog-heading h2 { margin: 7px 0 4px; color: #243848; font-size: 22px; letter-spacing: -.035em; }
.dialog-heading p { margin: 0; color: #81909a; font-size: 12px; }
.supplier-form :deep(.el-form-item) { margin-bottom: 17px; }
.supplier-form :deep(.el-form-item__label) { padding-bottom: 6px; color: #4f606b; font-size: 12px; font-weight: 650; line-height: 1.4; }
.supplier-form :deep(.el-input__wrapper), .supplier-form :deep(.el-select__wrapper) { min-height: 39px; border-radius: 7px; box-shadow: 0 0 0 1px #dfe5e5 inset; transition: box-shadow .18s ease; }
.supplier-form :deep(.el-input__wrapper:hover), .supplier-form :deep(.el-select__wrapper:hover) { box-shadow: 0 0 0 1px #b8c5c5 inset; }
.supplier-form :deep(.el-input__wrapper.is-focus), .supplier-form :deep(.el-select__wrapper.is-focused) { box-shadow: 0 0 0 1px #b17d43 inset, 0 0 0 3px rgba(177,125,67,.1); }
.form-section-heading { display: flex; align-items: center; gap: 11px; margin-bottom: 17px; }
.section-index { display: grid; width: 30px; height: 30px; flex: 0 0 30px; place-items: center; border: 1px solid #eadcc8; border-radius: 8px; background: #f7f1e8; color: #a17b49; font-size: 10px; font-weight: 800; }
.form-section-heading strong { color: #314552; font-size: 13px; }
.form-section-heading p { margin: 3px 0 0; color: #93a0a5; font-size: 11px; }
.form-field-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); column-gap: 17px; }
.status-section { margin-top: 2px; padding: 17px 17px 1px; border: 1px solid #e4e9e5; border-left: 3px solid #b88951; border-radius: 10px; background: linear-gradient(135deg, #fafbf8, #f4f6f2); }
.status-index { border-color: #d8e5e2; background: #eaf1ef; color: #4c7775; }
.status-select { width: 100%; }
.dialog-actions { display: flex; justify-content: flex-end; gap: 9px; }
.dialog-actions :deep(.el-button) { min-width: 88px; height: 37px; border-radius: 7px; }
.dialog-actions .save-button { border-color: #344f59; background: #344f59; }
.dialog-actions .save-button:hover { border-color: #42636c; background: #42636c; }
:global(.supplier-dialog.el-dialog), :global(.supplier-dialog .el-dialog) { overflow: hidden; max-width: calc(100vw - 32px); border: 1px solid rgba(214,222,221,.9); border-radius: 15px; background: #fff; box-shadow: 0 24px 70px rgba(31,49,57,.2); }
:global(.supplier-dialog .el-dialog__header) { margin: 0; padding: 22px 27px 17px; border-bottom: 1px solid #edf0ed; }
:global(.supplier-dialog .el-dialog__headerbtn) { top: 20px; right: 20px; }
:global(.supplier-dialog .el-dialog__body) { padding: 20px 27px 22px; }
:global(.supplier-dialog .el-dialog__footer) { padding: 14px 27px 19px; border-top: 1px solid #edf0ed; }
@media (max-width: 560px) { .management-heading { align-items: flex-start; flex-direction: column; margin-bottom: 16px; } .create-button { align-self: flex-start; } .management-card :deep(.el-card__body) { padding: 15px 12px; } .row-actions { gap: 4px; } .row-action-button { min-width: 0; padding: 6px 8px; } }
@media (max-width: 520px) { .form-field-grid { grid-template-columns: 1fr; column-gap: 0; } .status-section { padding: 14px 13px 1px; } :global(.supplier-dialog.el-dialog), :global(.supplier-dialog .el-dialog) { width: calc(100vw - 28px) !important; } :global(.supplier-dialog .el-dialog__header) { padding: 20px 19px 15px; } :global(.supplier-dialog .el-dialog__body) { padding: 17px 19px 19px; } :global(.supplier-dialog .el-dialog__footer) { padding: 12px 19px 16px; } }
</style>
