<template>
  <section class="management-page">
    <header class="management-heading">
      <div><span class="management-kicker">MATERIALS / MASTER DATA</span><h1>物料档案</h1><p>维护原材料编码、规格与库存基准。</p></div>
      <el-button class="create-button" type="primary" @click="openCreate">新增物料</el-button>
    </header>
    <el-card class="management-card" shadow="never">
      <el-form class="management-filters" inline @submit.prevent="load"><el-form-item><el-input v-model="query.keyword" placeholder="搜索物料名称/编码" clearable /></el-form-item><el-button type="primary" @click="load">查询</el-button></el-form>
      <el-table v-loading="loading" :data="rows" empty-text="暂无物料数据"><el-table-column prop="materialCode" label="物料编码" /><el-table-column prop="materialName" label="物料名称" /><el-table-column prop="category" label="类别" /><el-table-column prop="unit" label="单位" /><el-table-column prop="status" label="状态"><template #default="{ row }"><el-tag :type="row.status === 1 ? 'success' : 'info'">{{ row.status === 1 ? '启用' : '停用' }}</el-tag></template></el-table-column><el-table-column label="操作" width="190" align="center"><template #default="{ row }"><div class="row-actions"><el-button class="row-action-button" size="small" type="primary" plain @click="openEdit(row)">编辑</el-button><el-button class="row-action-button" size="small" type="danger" plain @click="remove(row)">删除</el-button></div></template></el-table-column></el-table>
      <el-pagination v-model:current-page="query.pageNum" v-model:page-size="query.pageSize" layout="total, prev, pager, next" :total="total" @current-change="load" />
    </el-card>
    <el-dialog v-model="dialogVisible" :title="editing ? '编辑物料' : '新增物料'" width="480px"><el-form ref="formRef" :model="form" :rules="rules" label-width="90px"><el-form-item label="物料编码" prop="materialCode"><el-input v-model="form.materialCode" /></el-form-item><el-form-item label="物料名称" prop="materialName"><el-input v-model="form.materialName" /></el-form-item><el-form-item label="类别"><el-input v-model="form.category" /></el-form-item><el-form-item label="单位"><el-input v-model="form.unit" /></el-form-item></el-form><template #footer><el-button @click="dialogVisible = false">取消</el-button><el-button type="primary" :loading="saving" @click="save">保存</el-button></template></el-dialog>
  </section>
</template>
<script setup>
import { reactive, ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { listMaterials, createMaterial, updateMaterial, deleteMaterial } from '../api/materials'
const rows = ref([]); const total = ref(0); const loading = ref(false); const saving = ref(false); const dialogVisible = ref(false); const editing = ref(null); const formRef = ref(); const query = reactive({ pageNum: 1, pageSize: 10, keyword: '' }); const form = reactive({ materialCode: '', materialName: '', category: '', unit: '' }); const rules = { materialCode: [{ required: true, message: '请输入物料编码', trigger: 'blur' }], materialName: [{ required: true, message: '请输入物料名称', trigger: 'blur' }] }
async function load () { loading.value = true; try { const res = await listMaterials(query); rows.value = res.data?.records || []; total.value = res.data?.total || 0 } catch (e) { ElMessage.error(e.response?.data?.msg || '物料加载失败') } finally { loading.value = false } }
function openCreate () { editing.value = null; Object.assign(form, { materialCode: '', materialName: '', category: '', unit: '' }); dialogVisible.value = true }
function openEdit (row) { editing.value = row; Object.assign(form, row); dialogVisible.value = true }
async function save () { const ok = await formRef.value.validate().catch(() => false); if (!ok) return; saving.value = true; try { editing.value ? await updateMaterial(editing.value.id, form) : await createMaterial(form); ElMessage.success('保存成功'); dialogVisible.value = false; await load() } catch (e) { ElMessage.error(e.response?.data?.msg || '保存失败') } finally { saving.value = false } }
async function remove (row) { try { await ElMessageBox.confirm('确认删除该物料？删除后不可恢复。', '提示', { type: 'warning' }); await deleteMaterial(row.id); ElMessage.success('删除成功'); if (rows.value.length === 1 && query.pageNum > 1) query.pageNum -= 1; await load() } catch (e) { if (e !== 'cancel' && e !== 'close') ElMessage.error(e.response?.data?.msg || '删除失败') } }
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
.row-actions { display: flex; justify-content: center; gap: 7px; }
.row-action-button { min-width: 52px; border-radius: 6px; }
.management-card :deep(.el-pagination) { justify-content: flex-end; margin-top: 16px; }
@media (max-width: 560px) { .management-heading { align-items: flex-start; flex-direction: column; margin-bottom: 16px; } .create-button { align-self: flex-start; } .management-card :deep(.el-card__body) { padding: 15px 12px; } .row-actions { gap: 4px; } .row-action-button { min-width: 0; padding: 6px 8px; } }
</style>
