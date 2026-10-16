<template>
  <section class="management-page">
    <header class="management-heading">
      <div><span class="management-kicker">MATERIALS / MASTER DATA</span><h1>物料档案</h1><p>维护原材料编码、规格与库存基准。</p></div>
      <div class="heading-actions"><el-button :loading="purchaseLoading" @click="loadPurchaseQuantities">刷新采购数量</el-button><el-button class="create-button" type="primary" @click="openCreate">新增物料</el-button></div>
    </header>
    <el-card class="management-card" shadow="never">
      <el-alert v-if="purchaseError" class="purchase-alert" :title="purchaseError" type="warning" :closable="false" show-icon />
      <el-form class="management-filters" inline @submit.prevent="load"><el-form-item><el-input v-model="query.keyword" placeholder="搜索物料名称/编码" clearable /></el-form-item><el-button class="search-button" type="primary" @click="load"><el-icon><Search /></el-icon><span>查询</span></el-button></el-form>
      <el-table v-loading="loading" :data="rows" empty-text="暂无物料数据"><el-table-column prop="materialCode" label="物料编码" /><el-table-column prop="materialName" label="物料名称" /><el-table-column prop="category" label="类别" /><el-table-column prop="unit" label="单位" /><el-table-column label="本年度采购数量" min-width="150"><template #default="{ row }">{{ purchaseLoaded ? formatPurchaseQuantity(row) : '暂不可用' }}</template></el-table-column><el-table-column prop="status" label="状态"><template #default="{ row }"><el-tag class="status-tag" :class="row.status === 1 ? 'status-enabled' : 'status-disabled'" effect="light">{{ row.status === 1 ? '启用' : '停用' }}</el-tag></template></el-table-column><el-table-column label="操作" width="190" align="center"><template #default="{ row }"><div class="row-actions"><el-button class="row-action-button" size="small" type="primary" plain @click="openEdit(row)">编辑</el-button><el-button class="row-action-button" size="small" type="danger" plain @click="remove(row)">删除</el-button></div></template></el-table-column></el-table>
      <el-pagination v-model:current-page="query.pageNum" v-model:page-size="query.pageSize" layout="total, prev, pager, next" :total="total" @current-change="load" />
    </el-card>
    <el-dialog v-model="dialogVisible" class="material-dialog" width="560px" :close-on-click-modal="false" @closed="resetFormValidation">
      <template #header>
        <div class="dialog-heading"><span class="dialog-kicker">MATERIAL RECORD / {{ editing ? 'UPDATE' : 'NEW ENTRY' }}</span><h2>{{ editing ? '编辑物料' : '新增物料' }}</h2><p>维护基础档案与年度采购数量。</p></div>
      </template>
      <el-form ref="formRef" class="material-form" :model="form" :rules="rules" label-position="top">
        <div class="form-section-heading"><span class="section-index">01</span><div><strong>基础信息</strong><p>用于识别和归类采购物料</p></div></div>
        <div class="form-field-grid">
          <el-form-item label="物料编码" prop="materialCode"><el-input v-model="form.materialCode" placeholder="请输入唯一物料编码" /></el-form-item>
          <el-form-item label="物料名称" prop="materialName"><el-input v-model="form.materialName" placeholder="请输入物料名称" /></el-form-item>
          <el-form-item label="类别"><el-input v-model="form.category" placeholder="例如：矿石、辅料" /></el-form-item>
          <el-form-item label="计量单位"><el-input v-model="form.unit" placeholder="例如：吨、千克" /></el-form-item><el-form-item label="状态" prop="status"><el-select v-model="form.status" class="status-select" placeholder="请选择状态"><el-option :value="1" label="启用" /><el-option :value="0" label="停用" /></el-select></el-form-item>
        </div>
        <div class="quantity-section">
          <div class="form-section-heading"><span class="section-index quantity-index">02</span><div><strong>采购数量</strong><p>本年度数量，可在后续采购中继续调整</p></div></div>
          <el-form-item label="本年度采购数量" prop="purchaseQuantity" class="quantity-form-item">
            <el-input v-model="form.purchaseQuantity" type="number" min="0" step="0.01" inputmode="decimal" clearable placeholder="默认 0" @clear="form.purchaseQuantity = 0"><template #append>{{ form.unit || '单位' }}</template></el-input>
            <div class="quantity-hint">仅支持非负数，最多保留两位小数；清空后按 0 保存。</div>
          </el-form-item>
        </div>
      </el-form>
      <template #footer><div class="dialog-actions"><el-button class="cancel-button" @click="dialogVisible = false">取消</el-button><el-button class="save-button" type="primary" :loading="saving" @click="save">保存物料</el-button></div></template>
    </el-dialog>
  </section>
</template>
<script setup>
import { reactive, ref, onMounted, onUnmounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import { listMaterials, createMaterial, updateMaterial, deleteMaterial } from '../api/materials'
import { getPurchaseReport } from '../api/reports'
import { buildPurchaseQuantityIndex, createMaterialPayload, getPurchaseQuantity, normalizePurchaseQuantity } from '../utils/materialQuantity'
const rows = ref([]); const total = ref(0); const loading = ref(false); const saving = ref(false); const dialogVisible = ref(false); const editing = ref(null); const formRef = ref(); const query = reactive({ pageNum: 1, pageSize: 10, keyword: '' }); const form = reactive({ materialCode: '', materialName: '', category: '', unit: '', purchaseQuantity: 0, status: 1 }); const rules = { materialCode: [{ required: true, message: '请输入物料编码', trigger: 'blur' }], materialName: [{ required: true, message: '请输入物料名称', trigger: 'blur' }], purchaseQuantity: [{ validator: (rule, value, callback) => { try { normalizePurchaseQuantity(value); callback() } catch (error) { callback(error) } }, trigger: ['blur', 'change'] }], status: [{ required: true, message: '请选择物料状态', trigger: 'change' }] }
const purchaseLoading = ref(false); const purchaseLoaded = ref(false); const purchaseError = ref(''); const purchaseQuantities = ref({}); const currentYear = new Date().getFullYear(); let purchaseRefreshTimer
async function load () { loading.value = true; try { const res = await listMaterials(query); rows.value = res.data?.records || []; total.value = res.data?.total || 0 } catch (e) { ElMessage.error(e.response?.data?.msg || '物料加载失败') } finally { loading.value = false } }
function extractPurchaseRows (response) { const payload = response?.data ?? response; if (Array.isArray(payload)) return payload; const candidates = [payload?.byMaterial, payload?.materials, payload?.records, payload?.items, response?.byMaterial]; return candidates.find(Array.isArray) || null }
function normalizePurchaseQuantities (response) { const reportRows = extractPurchaseRows(response); if (!reportRows) throw new Error('采购报表返回格式无法识别。'); return buildPurchaseQuantityIndex(reportRows) }
function formatPurchaseQuantity (row) { const quantity = getPurchaseQuantity(row, purchaseQuantities.value); return new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 2 }).format(quantity) + (row.unit ? ' ' + row.unit : '') }
async function loadPurchaseQuantities () { purchaseLoading.value = true; try { const response = await getPurchaseReport({ year: currentYear }); purchaseQuantities.value = normalizePurchaseQuantities(response); purchaseLoaded.value = true; purchaseError.value = '' } catch (error) { purchaseError.value = error.response?.data?.msg || error.message || '采购数量刷新失败，暂时保留上次成功数据。' } finally { purchaseLoading.value = false } }
async function openCreate () { editing.value = null; Object.assign(form, { materialCode: '', materialName: '', category: '', unit: '', purchaseQuantity: 0, status: 1 }); dialogVisible.value = true; await nextTick(); formRef.value?.clearValidate() }
async function openEdit (row) { editing.value = row; Object.assign(form, { materialCode: row.materialCode || '', materialName: row.materialName || '', category: row.category || '', unit: row.unit || '', purchaseQuantity: normalizePurchaseQuantity(row.purchaseQuantity ?? getPurchaseQuantity(row, purchaseQuantities.value)), status: row.status === 0 ? 0 : 1 }); dialogVisible.value = true; await nextTick(); formRef.value?.clearValidate() }
function resetFormValidation () { formRef.value?.clearValidate() }
async function save () { const ok = await formRef.value.validate().catch(() => false); if (!ok) return; saving.value = true; try { const payload = createMaterialPayload(form); editing.value ? await updateMaterial(editing.value.id, payload) : await createMaterial(payload); ElMessage.success('保存成功'); dialogVisible.value = false; await Promise.all([load(), loadPurchaseQuantities()]) } catch (e) { ElMessage.error(e.response?.data?.msg || e.message || '保存失败') } finally { saving.value = false } }
async function remove (row) { try { await ElMessageBox.confirm('确认删除该物料？删除后不可恢复。', '提示', { type: 'warning' }); await deleteMaterial(row.id); ElMessage.success('删除成功'); if (rows.value.length === 1 && query.pageNum > 1) query.pageNum -= 1; await load() } catch (e) { if (e !== 'cancel' && e !== 'close') ElMessage.error(e.response?.data?.msg || '删除失败') } }
onMounted(() => { load(); loadPurchaseQuantities(); purchaseRefreshTimer = window.setInterval(loadPurchaseQuantities, 60000) })
onUnmounted(() => { if (purchaseRefreshTimer) window.clearInterval(purchaseRefreshTimer) })
</script>

<style scoped>
.management-page { max-width: 1320px; margin: 0 auto; }
.management-heading { display: flex; align-items: center; justify-content: space-between; gap: 20px; margin: 1px 0 22px; }
.heading-actions { display: flex; align-items: center; gap: 9px; }
.purchase-alert { margin-bottom: 14px; }
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
.dialog-heading h2 { margin: 7px 0 4px; color: #243848; font-size: 22px; font-weight: 700; letter-spacing: -.035em; }
.dialog-heading p { margin: 0; color: #81909a; font-size: 12px; }
.material-form :deep(.el-form-item) { margin-bottom: 17px; }
.material-form :deep(.el-form-item__label) { padding-bottom: 6px; color: #4f606b; font-size: 12px; font-weight: 650; line-height: 1.4; }
.material-form :deep(.el-input__wrapper) { min-height: 39px; border-radius: 7px; box-shadow: 0 0 0 1px #dfe5e5 inset; transition: box-shadow .18s ease, background-color .18s ease; }
.material-form :deep(.el-input__wrapper:hover) { box-shadow: 0 0 0 1px #b8c5c5 inset; }
.material-form :deep(.el-input__wrapper.is-focus) { box-shadow: 0 0 0 1px #b17d43 inset, 0 0 0 3px rgba(177,125,67,.1); }
.material-form :deep(.el-select__wrapper) { min-height: 39px; border-radius: 7px; box-shadow: 0 0 0 1px #dfe5e5 inset; }
.status-select { width: 100%; }
.form-section-heading { display: flex; align-items: center; gap: 11px; margin-bottom: 17px; }
.section-index { display: grid; width: 30px; height: 30px; flex: 0 0 30px; place-items: center; border: 1px solid #eadcc8; border-radius: 8px; background: #f7f1e8; color: #a17b49; font-size: 10px; font-weight: 800; letter-spacing: .04em; }
.form-section-heading strong { color: #314552; font-size: 13px; }
.form-section-heading p { margin: 3px 0 0; color: #93a0a5; font-size: 11px; }
.form-field-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); column-gap: 17px; }
.quantity-section { margin-top: 2px; padding: 17px 17px 1px; border: 1px solid #e4e9e5; border-left: 3px solid #b88951; border-radius: 10px; background: linear-gradient(135deg, #fafbf8, #f4f6f2); }
.quantity-index { border-color: #d8e5e2; background: #eaf1ef; color: #4c7775; }
.quantity-form-item { margin-bottom: 12px !important; }
.quantity-form-item :deep(.el-input__wrapper) { min-height: 46px; background: #fff; }
.quantity-form-item :deep(.el-input-group__append) { border: 0; border-left: 1px solid #e5e9e6; background: #f4f6f3; color: #6e7e80; font-size: 12px; }
.quantity-hint { margin-top: 7px; color: #8b9899; font-size: 11px; line-height: 1.5; }
.dialog-actions { display: flex; justify-content: flex-end; gap: 9px; }
.dialog-actions :deep(.el-button) { min-width: 88px; height: 37px; border-radius: 7px; }
.dialog-actions .save-button { border-color: #344f59; background: #344f59; }
.dialog-actions .save-button:hover { border-color: #42636c; background: #42636c; }
:global(.material-dialog.el-dialog), :global(.material-dialog .el-dialog) { overflow: hidden; max-width: calc(100vw - 32px); border: 1px solid rgba(214,222,221,.9); border-radius: 15px; background: #fff; box-shadow: 0 24px 70px rgba(31,49,57,.2); }
:global(.material-dialog .el-dialog__header) { margin: 0; padding: 22px 27px 17px; border-bottom: 1px solid #edf0ed; }
:global(.material-dialog .el-dialog__headerbtn) { top: 20px; right: 20px; }
:global(.material-dialog .el-dialog__body) { padding: 20px 27px 22px; }
:global(.material-dialog .el-dialog__footer) { padding: 14px 27px 19px; border-top: 1px solid #edf0ed; }
@media (max-width: 560px) { .management-heading { align-items: flex-start; flex-direction: column; margin-bottom: 16px; } .heading-actions { flex-wrap: wrap; } .create-button { align-self: flex-start; } .management-card :deep(.el-card__body) { padding: 15px 12px; } .row-actions { gap: 4px; } .row-action-button { min-width: 0; padding: 6px 8px; } }
@media (max-width: 520px) { .form-field-grid { grid-template-columns: 1fr; column-gap: 0; } .quantity-section { padding: 14px 13px 1px; } :global(.material-dialog.el-dialog), :global(.material-dialog .el-dialog) { width: calc(100vw - 28px) !important; } :global(.material-dialog .el-dialog__header) { padding: 20px 19px 15px; } :global(.material-dialog .el-dialog__body) { padding: 17px 19px 19px; } :global(.material-dialog .el-dialog__footer) { padding: 12px 19px 16px; } }
</style>
