<template>
  <section>
    <div class="page-head">
      <div><h2>采购计划</h2><p>车间申请 → 审批 → 转采购订单。</p></div>
      <el-button v-if="canPlan" type="primary" @click="openCreate">新增计划</el-button>
    </div>

    <el-card shadow="never">
      <!-- 搜索：计划编号 + 状态 -->
      <el-form inline @submit.prevent="load">
        <el-form-item>
          <el-input v-model="query.keyword" placeholder="搜索计划编号" clearable style="width: 200px" @clear="load" />
        </el-form-item>
        <el-form-item>
          <el-select v-model="query.status" placeholder="全部状态" clearable style="width: 140px" @change="load">
            <el-option v-for="(item, value) in PLAN_STATUS_DICT" :key="value" :label="item.text" :value="value" />
          </el-select>
        </el-form-item>
        <el-button type="primary" @click="load">查询</el-button>
      </el-form>

      <el-table v-loading="loading" :data="rows" empty-text="暂无采购计划">
        <el-table-column prop="planCode" label="计划编号" width="150" />
        <el-table-column prop="materialName" label="物料名称" min-width="130" />
        <el-table-column prop="materialCode" label="物料编码" width="130" />
        <el-table-column label="数量(吨)" width="100">
          <template #default="{ row }">{{ row.quantity }}</template>
        </el-table-column>
        <el-table-column label="期望到货" width="110">
          <template #default="{ row }">{{ row.expectDate || '-' }}</template>
        </el-table-column>
        <el-table-column prop="applyDept" label="申请部门" width="110" />
        <el-table-column prop="applicant" label="申请人" width="90" />
        <el-table-column prop="applyTime" label="申请时间" width="160">
          <template #default="{ row }">{{ formatTime(row.applyTime) }}</template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="tagType(PLAN_STATUS_DICT[row.status]?.type)">{{ PLAN_STATUS_DICT[row.status]?.text || row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button v-if="canPlan && row.status === 'DRAFT'" link type="primary" @click="submitPlan(row)">提交审批</el-button>
            <el-button v-if="userStore.isAdmin && row.status === 'PENDING'" link type="warning" @click="openApprove(row)">审批</el-button>
            <el-button v-if="canPlan && row.status === 'APPROVED'" link type="success" @click="openConvert(row)">转订单</el-button>
            <el-button link @click="showDetail(row)">详情</el-button>
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

    <!-- 新增计划弹窗 -->
    <el-dialog v-model="createVisible" title="新增采购计划" width="520px" destroy-on-close>
      <el-form ref="createRef" :model="createForm" :rules="createRules" label-width="100px">
        <el-form-item label="物料" prop="materialId">
          <el-select v-model="createForm.materialId" placeholder="请选择物料" filterable style="width: 100%">
            <el-option v-for="m in materials" :key="m.id" :label="`${m.materialName}（${m.materialCode}）`" :value="m.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="采购数量(吨)" prop="quantity">
          <el-input-number v-model="createForm.quantity" :min="0.01" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item label="期望到货日期">
          <el-date-picker v-model="createForm.expectDate" type="date" value-format="YYYY-MM-DD" placeholder="请选择日期" style="width: 100%" />
        </el-form-item>
        <el-form-item label="申请部门" prop="applyDept">
          <el-input v-model="createForm.applyDept" placeholder="如：炼铁一车间" />
        </el-form-item>
        <el-form-item label="申请事由">
          <el-input v-model="createForm.reason" type="textarea" :rows="2" placeholder="如：补充高炉铁矿粉库存" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="saveCreate">保存</el-button>
      </template>
    </el-dialog>

    <!-- 审批弹窗 -->
    <el-dialog v-model="approveVisible" title="计划审批" width="480px" destroy-on-close>
      <el-descriptions :column="1" border size="small" class="approve-desc">
        <el-descriptions-item label="计划编号">{{ current?.planCode }}</el-descriptions-item>
        <el-descriptions-item label="物料">{{ current?.materialName }}</el-descriptions-item>
        <el-descriptions-item label="数量">{{ current?.quantity }} 吨</el-descriptions-item>
        <el-descriptions-item label="申请部门">{{ current?.applyDept }}</el-descriptions-item>
        <el-descriptions-item label="申请事由">{{ current?.reason || '-' }}</el-descriptions-item>
      </el-descriptions>
      <el-form ref="approveRef" :model="approveForm" :rules="approveRules" label-width="100px" class="approve-form">
        <el-form-item label="审批结论" prop="approve">
          <el-radio-group v-model="approveForm.approve">
            <el-radio :value="true">通过</el-radio>
            <el-radio :value="false">驳回</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="审批意见">
          <el-input v-model="approveForm.remark" type="textarea" :rows="2" placeholder="选填，如：同意采购" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="approveVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="saveApprove">提交</el-button>
      </template>
    </el-dialog>

    <!-- 转订单弹窗 -->
    <el-dialog v-model="convertVisible" title="计划转采购订单" width="520px" destroy-on-close>
      <el-alert :title="`${current?.materialName} · ${current?.quantity} 吨`" type="info" :closable="false" show-icon class="convert-tip" />
      <el-form ref="convertRef" :model="convertForm" :rules="convertRules" label-width="100px" class="approve-form">
        <el-form-item label="供应商" prop="supplierId">
          <el-select v-model="convertForm.supplierId" placeholder="请选择供应商" filterable style="width: 100%">
            <el-option v-for="s in suppliers" :key="s.id" :label="`${s.supplierName}（${s.supplierCode}）`" :value="s.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="采购单价(元/吨)" prop="unitPrice">
          <el-input-number v-model="convertForm.unitPrice" :min="0.01" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item label="预计金额">
          <span class="amount">{{ computedAmount(convertForm.unitPrice) }} 元</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="convertVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="saveConvert">转订单</el-button>
      </template>
    </el-dialog>

    <!-- 详情弹窗 -->
    <el-dialog v-model="detailVisible" title="采购计划详情" width="560px">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="计划编号">{{ current?.planCode }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="tagType(PLAN_STATUS_DICT[current?.status]?.type)">{{ PLAN_STATUS_DICT[current?.status]?.text || current?.status }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="物料名称">{{ current?.materialName }}</el-descriptions-item>
        <el-descriptions-item label="物料编码">{{ current?.materialCode }}</el-descriptions-item>
        <el-descriptions-item label="数量">{{ current?.quantity }} 吨</el-descriptions-item>
        <el-descriptions-item label="期望到货">{{ current?.expectDate || '-' }}</el-descriptions-item>
        <el-descriptions-item label="申请部门">{{ current?.applyDept }}</el-descriptions-item>
        <el-descriptions-item label="申请人">{{ current?.applicant }}</el-descriptions-item>
        <el-descriptions-item label="申请时间">{{ formatTime(current?.applyTime) }}</el-descriptions-item>
        <el-descriptions-item label="申请事由" :span="2">{{ current?.reason || '-' }}</el-descriptions-item>
        <el-descriptions-item label="审批人">{{ current?.approver || '-' }}</el-descriptions-item>
        <el-descriptions-item label="审批时间">{{ formatTime(current?.approveTime) }}</el-descriptions-item>
        <el-descriptions-item label="审批意见" :span="2">{{ current?.approveRemark || '-' }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </section>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { listPlans, createPlan, submitPlan as submitPlanApi, approvePlan, createOrderFromPlan } from '../api/plans'
import { listMaterials } from '../api/materials'
import { listSuppliers } from '../api/suppliers'
import { PLAN_STATUS_DICT, tagType } from '../utils/dict'
import { useUserStore } from '../stores'

const userStore = useUserStore()
const canPlan = userStore.isAdmin || userStore.role === 'PROCUREMENT'

const rows = ref([])
const total = ref(0)
const loading = ref(false)
const saving = ref(false)
const materials = ref([])
const suppliers = ref([])
const current = ref(null)
const formRef = null
const query = reactive({ pageNum: 1, pageSize: 10, keyword: '', status: '' })

// 新增计划
const createVisible = ref(false)
const createRef = ref()
const createForm = reactive({ materialId: null, quantity: null, expectDate: '', applyDept: '', reason: '' })
const createRules = {
  materialId: [{ required: true, message: '请选择物料', trigger: 'change' }],
  quantity: [{ required: true, message: '请输入采购数量', trigger: 'blur' }],
  applyDept: [{ required: true, message: '请输入申请部门', trigger: 'blur' }]
}

// 审批
const approveVisible = ref(false)
const approveRef = ref()
const approveForm = reactive({ approve: true, remark: '' })
const approveRules = { approve: [{ required: true, message: '请选择审批结论', trigger: 'change' }] }

// 转订单
const convertVisible = ref(false)
const convertRef = ref()
const convertForm = reactive({ supplierId: null, unitPrice: null })
const convertRules = {
  supplierId: [{ required: true, message: '请选择供应商', trigger: 'change' }],
  unitPrice: [{ required: true, message: '请输入采购单价', trigger: 'blur' }]
}

const detailVisible = ref(false)

function formatTime (value) {
  if (!value) return '-'
  return String(value).replace('T', ' ').slice(0, 16)
}

function computedAmount (price) {
  const qty = Number(current.value?.quantity || 0)
  const p = Number(price || 0)
  return (qty * p).toLocaleString('zh-CN', { maximumFractionDigits: 2 })
}

async function load () {
  loading.value = true
  try {
    const res = await listPlans(query)
    rows.value = res.data?.records || []
    total.value = res.data?.total || 0
  } catch (e) { /* 错误提示已由拦截器统一处理 */ } finally { loading.value = false }
}

async function loadMaterials () {
  const res = await listMaterials({ pageNum: 1, pageSize: 100 }).catch(() => ({ data: { records: [] } }))
  materials.value = res.data?.records || []
}

async function loadSuppliers () {
  const res = await listSuppliers({ pageNum: 1, pageSize: 100 }).catch(() => ({ data: { records: [] } }))
  suppliers.value = res.data?.records || []
}

function openCreate () {
  Object.assign(createForm, { materialId: null, quantity: null, expectDate: '', applyDept: '', reason: '' })
  createVisible.value = true
}

async function saveCreate () {
  const ok = await createRef.value.validate().catch(() => false)
  if (!ok) return
  saving.value = true
  try {
    await createPlan(createForm)
    ElMessage.success('新增成功，请在列表提交审批')
    createVisible.value = false
    load()
  } catch (e) { /* 错误提示已由拦截器统一处理 */ } finally { saving.value = false }
}

async function submitPlan (row) {
  try {
    await ElMessageBox.confirm(`确认提交计划「${row.planCode}」进入审批流程？`, '提交审批', { type: 'info' })
    await submitPlanApi(row.id)
    ElMessage.success('已提交审批')
    load()
  } catch (e) { /* 取消或错误均不处理 */ }
}

function openApprove (row) {
  current.value = row
  Object.assign(approveForm, { approve: true, remark: '' })
  approveVisible.value = true
}

async function saveApprove () {
  const ok = await approveRef.value.validate().catch(() => false)
  if (!ok) return
  saving.value = true
  try {
    await approvePlan(current.value.id, approveForm)
    ElMessage.success(approveForm.approve ? '审批通过' : '已驳回')
    approveVisible.value = false
    load()
  } catch (e) { /* 错误提示已由拦截器统一处理 */ } finally { saving.value = false }
}

function openConvert (row) {
  current.value = row
  Object.assign(convertForm, { supplierId: null, unitPrice: null })
  convertVisible.value = true
}

async function saveConvert () {
  const ok = await convertRef.value.validate().catch(() => false)
  if (!ok) return
  saving.value = true
  try {
    const res = await createOrderFromPlan(current.value.id, convertForm)
    ElMessage.success(`已生成订单 ${res.data?.orderCode || ''}`)
    convertVisible.value = false
    load()
  } catch (e) { /* 错误提示已由拦截器统一处理 */ } finally { saving.value = false }
}

function showDetail (row) {
  current.value = row
  detailVisible.value = true
}

onMounted(() => { load(); loadMaterials(); loadSuppliers() })
</script>

<style scoped>
.approve-desc { margin-bottom: 18px; }
.approve-form { margin-top: 18px; }
.convert-tip { margin-bottom: 18px; }
.amount { color: #e6a23c; font-weight: 700; }
</style>
