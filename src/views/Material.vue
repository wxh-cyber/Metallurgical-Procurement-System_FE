<template>
  <section>
    <div class="page-head">
      <div><h2>物料档案</h2><p>维护原材料编码、冶金指标要求与库存基准。</p></div>
      <el-button v-if="canEdit" type="primary" @click="openCreate">新增物料</el-button>
    </div>

    <el-card shadow="never">
      <!-- 搜索：名称/编码 + 类别 -->
      <el-form inline @submit.prevent="load">
        <el-form-item>
          <el-input v-model="query.keyword" placeholder="搜索物料名称/编码" clearable style="width: 220px" @clear="load" />
        </el-form-item>
        <el-form-item>
          <el-select v-model="query.category" placeholder="全部类别" clearable style="width: 150px" @change="load">
            <el-option v-for="(text, value) in CATEGORY_DICT" :key="value" :label="text" :value="value" />
          </el-select>
        </el-form-item>
        <el-button type="primary" @click="load">查询</el-button>
      </el-form>

      <el-table v-loading="loading" :data="rows" empty-text="暂无物料数据">
        <el-table-column prop="materialCode" label="物料编码" width="130" />
        <el-table-column prop="materialName" label="物料名称" min-width="140" />
        <el-table-column label="类别" width="100">
          <template #default="{ row }">{{ CATEGORY_DICT[row.category] || row.category }}</template>
        </el-table-column>
        <el-table-column prop="unit" label="单位" width="70" />
        <el-table-column label="主成分要求%" width="110">
          <template #default="{ row }">{{ row.mainIndexRequired ?? '-' }}</template>
        </el-table-column>
        <el-table-column label="硫上限%" width="90">
          <template #default="{ row }">{{ row.sMax ?? '-' }}</template>
        </el-table-column>
        <el-table-column label="磷上限%" width="90">
          <template #default="{ row }">{{ row.pMax ?? '-' }}</template>
        </el-table-column>
        <el-table-column prop="granularity" label="粒度要求" width="100" />
        <el-table-column label="参考单价(元/吨)" width="120">
          <template #default="{ row }">{{ row.unitPrice ?? '-' }}</template>
        </el-table-column>
        <el-table-column label="安全库存(吨)" width="110">
          <template #default="{ row }">{{ row.safetyStock ?? '-' }}</template>
        </el-table-column>
        <el-table-column v-if="canEdit" label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
            <el-button link type="danger" @click="remove(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="query.pageNum"
        v-model:page-size="query.pageSize"
        layout="total, prev, pager, next"
        :total="total"
        @current-change="load"
      />
    </el-card>

    <!-- 新增/编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="editing ? '编辑物料' : '新增物料'" width="560px" destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="120px">
        <el-row :gutter="12">
          <el-col :span="12"><el-form-item label="物料编码" prop="materialCode"><el-input v-model="form.materialCode" placeholder="如 MAT-IRON-01" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="物料名称" prop="materialName"><el-input v-model="form.materialName" /></el-form-item></el-col>
        </el-row>
        <el-row :gutter="12">
          <el-col :span="12"><el-form-item label="物料类别" prop="category">
            <el-select v-model="form.category" placeholder="请选择类别" style="width: 100%">
              <el-option v-for="(text, value) in CATEGORY_DICT" :key="value" :label="text" :value="value" />
            </el-select>
          </el-form-item></el-col>
          <el-col :span="12"><el-form-item label="计量单位"><el-input v-model="form.unit" placeholder="默认：吨" /></el-form-item></el-col>
        </el-row>
        <el-row :gutter="12">
          <el-col :span="12"><el-form-item label="主成分要求%" prop="mainIndexRequired"><el-input-number v-model="form.mainIndexRequired" :min="0" :max="100" :precision="2" style="width: 100%" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="硫上限%" prop="sMax"><el-input-number v-model="form.sMax" :min="0" :max="100" :precision="3" style="width: 100%" /></el-form-item></el-col>
        </el-row>
        <el-row :gutter="12">
          <el-col :span="12"><el-form-item label="磷上限%" prop="pMax"><el-input-number v-model="form.pMax" :min="0" :max="100" :precision="3" style="width: 100%" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="粒度要求"><el-input v-model="form.granularity" placeholder="如 10-40mm" /></el-form-item></el-col>
        </el-row>
        <el-row :gutter="12">
          <el-col :span="12"><el-form-item label="参考单价(元/吨)" prop="unitPrice"><el-input-number v-model="form.unitPrice" :min="0" :precision="2" style="width: 100%" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="安全库存(吨)" prop="safetyStock"><el-input-number v-model="form.safetyStock" :min="0" :precision="2" style="width: 100%" /></el-form-item></el-col>
        </el-row>
        <el-form-item label="备注"><el-input v-model="form.remark" type="textarea" :rows="2" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="save">保存</el-button>
      </template>
    </el-dialog>
  </section>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { listMaterials, createMaterial, updateMaterial, deleteMaterial } from '../api/materials'
import { CATEGORY_DICT } from '../utils/dict'
import { useUserStore } from '../stores'

const userStore = useUserStore()
const canEdit = userStore.isAdmin

const rows = ref([])
const total = ref(0)
const loading = ref(false)
const saving = ref(false)
const dialogVisible = ref(false)
const editing = ref(null)
const formRef = ref()
const query = reactive({ pageNum: 1, pageSize: 10, keyword: '', category: '' })

const emptyForm = () => ({ materialCode: '', materialName: '', category: '', unit: '吨', mainIndexRequired: null, sMax: null, pMax: null, granularity: '', unitPrice: null, safetyStock: null, remark: '' })
const form = reactive(emptyForm())

const rules = {
  materialCode: [{ required: true, message: '请输入物料编码', trigger: 'blur' }],
  materialName: [{ required: true, message: '请输入物料名称', trigger: 'blur' }],
  category: [{ required: true, message: '请选择物料类别', trigger: 'change' }],
  mainIndexRequired: [{ type: 'number', min: 0, max: 100, message: '主成分要求须在 0-100 之间', trigger: 'change' }],
  sMax: [{ type: 'number', min: 0, max: 100, message: '硫上限须在 0-100 之间', trigger: 'change' }],
  pMax: [{ type: 'number', min: 0, max: 100, message: '磷上限须在 0-100 之间', trigger: 'change' }],
  unitPrice: [{ type: 'number', min: 0, message: '单价不能为负数', trigger: 'change' }],
  safetyStock: [{ type: 'number', min: 0, message: '安全库存不能为负数', trigger: 'change' }]
}

async function load () {
  loading.value = true
  try {
    const res = await listMaterials(query)
    rows.value = res.data?.records || []
    total.value = res.data?.total || 0
  } catch (e) { /* 错误提示已由拦截器统一处理 */ } finally { loading.value = false }
}

function openCreate () {
  editing.value = null
  Object.assign(form, emptyForm())
  dialogVisible.value = true
}

function openEdit (row) {
  editing.value = row
  Object.assign(form, emptyForm(), row)
  dialogVisible.value = true
}

async function save () {
  const ok = await formRef.value.validate().catch(() => false)
  if (!ok) return
  saving.value = true
  try {
    if (editing.value) await updateMaterial(editing.value.id, form)
    else await createMaterial(form)
    ElMessage.success('保存成功')
    dialogVisible.value = false
    load()
  } catch (e) { /* 错误提示已由拦截器统一处理 */ } finally { saving.value = false }
}

async function remove (row) {
  try {
    await ElMessageBox.confirm(`确认删除物料「${row.materialName}」？删除后不可恢复。`, '删除确认', { type: 'warning' })
    await deleteMaterial(row.id)
    ElMessage.success('删除成功')
    load()
  } catch (e) { /* 取消或错误均不处理 */ }
}

onMounted(load)
</script>
