<template>
  <section>
    <div class="page-head">
      <div><h2>供应商管理</h2><p>维护供应商档案与合作状态。</p></div>
      <el-button v-if="canEdit" type="primary" @click="openCreate">新增供应商</el-button>
    </div>

    <el-card shadow="never">
      <!-- 搜索：名称/编码 + 状态 -->
      <el-form inline @submit.prevent="load">
        <el-form-item>
          <el-input v-model="query.keyword" placeholder="搜索供应商名称/编码" clearable style="width: 220px" @clear="load" />
        </el-form-item>
        <el-form-item>
          <el-select v-model="query.status" placeholder="全部状态" clearable style="width: 130px" @change="load">
            <el-option label="合作中" :value="1" />
            <el-option label="已暂停" :value="0" />
          </el-select>
        </el-form-item>
        <el-button type="primary" @click="load">查询</el-button>
      </el-form>

      <el-table v-loading="loading" :data="rows" empty-text="暂无供应商数据">
        <el-table-column prop="supplierCode" label="供应商编码" width="110" />
        <el-table-column prop="supplierName" label="供应商名称" min-width="150" />
        <el-table-column prop="contactPerson" label="联系人" width="100" />
        <el-table-column prop="phone" label="联系电话" width="130" />
        <el-table-column label="主营物料" min-width="200">
          <template #default="{ row }">
            <el-tag v-for="name in splitMaterials(row.mainMaterials)" :key="name" size="small" class="material-tag">{{ name }}</el-tag>
            <span v-if="!row.mainMaterials">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="businessLicense" label="资质证号" width="130">
          <template #default="{ row }">{{ row.businessLicense || '-' }}</template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="SUPPLIER_STATUS_DICT[row.status]?.type || 'info'">{{ SUPPLIER_STATUS_DICT[row.status]?.text || '未知' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column v-if="canEdit" label="操作" width="190" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
            <el-button v-if="row.status === 1" link type="warning" @click="toggleStatus(row, 0)">暂停合作</el-button>
            <el-button v-else link type="success" @click="toggleStatus(row, 1)">恢复合作</el-button>
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
    <el-dialog v-model="dialogVisible" :title="editing ? '编辑供应商' : '新增供应商'" width="560px" destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="110px">
        <el-row :gutter="12">
          <el-col :span="12"><el-form-item label="供应商编码" prop="supplierCode"><el-input v-model="form.supplierCode" placeholder="如 SUP-001" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="供应商名称" prop="supplierName"><el-input v-model="form.supplierName" /></el-form-item></el-col>
        </el-row>
        <el-row :gutter="12">
          <el-col :span="12"><el-form-item label="联系人"><el-input v-model="form.contactPerson" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="联系电话"><el-input v-model="form.phone" /></el-form-item></el-col>
        </el-row>
        <el-form-item label="地址"><el-input v-model="form.address" /></el-form-item>
        <el-form-item label="主营物料"><el-input v-model="form.mainMaterials" placeholder="多个用逗号分隔，如：澳洲铁矿粉,球团矿" /></el-form-item>
        <el-row :gutter="12">
          <el-col :span="12"><el-form-item label="资质证号"><el-input v-model="form.businessLicense" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="状态">
            <el-radio-group v-model="form.status">
              <el-radio :value="1">合作中</el-radio>
              <el-radio :value="0">暂停</el-radio>
            </el-radio-group>
          </el-form-item></el-col>
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
import { listSuppliers, createSupplier, updateSupplier, updateSupplierStatus } from '../api/suppliers'
import { SUPPLIER_STATUS_DICT } from '../utils/dict'
import { useUserStore } from '../stores'

const userStore = useUserStore()
const canEdit = userStore.isAdmin || userStore.role === 'PROCUREMENT'

const rows = ref([])
const total = ref(0)
const loading = ref(false)
const saving = ref(false)
const dialogVisible = ref(false)
const editing = ref(null)
const formRef = ref()
const query = reactive({ pageNum: 1, pageSize: 10, keyword: '', status: null })

const emptyForm = () => ({ supplierCode: '', supplierName: '', contactPerson: '', phone: '', address: '', mainMaterials: '', businessLicense: '', status: 1, remark: '' })
const form = reactive(emptyForm())

const rules = {
  supplierCode: [{ required: true, message: '请输入供应商编码', trigger: 'blur' }],
  supplierName: [{ required: true, message: '请输入供应商名称', trigger: 'blur' }]
}

// 主营物料按逗号拆分为标签
function splitMaterials (value) {
  if (!value) return []
  return value.split(/[,，]/).map((s) => s.trim()).filter(Boolean)
}

async function load () {
  loading.value = true
  try {
    const res = await listSuppliers(query)
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
    if (editing.value) await updateSupplier(editing.value.id, form)
    else await createSupplier(form)
    ElMessage.success('保存成功')
    dialogVisible.value = false
    load()
  } catch (e) { /* 错误提示已由拦截器统一处理 */ } finally { saving.value = false }
}

async function toggleStatus (row, status) {
  const action = status === 1 ? '恢复合作' : '暂停合作'
  try {
    await ElMessageBox.confirm(`确认${action}「${row.supplierName}」？`, '提示')
    await updateSupplierStatus(row.id, status)
    ElMessage.success(`${action}成功`)
    load()
  } catch (e) { /* 取消或错误均不处理 */ }
}

onMounted(load)
</script>

<style scoped>
.material-tag { margin: 2px 4px 2px 0; }
</style>
