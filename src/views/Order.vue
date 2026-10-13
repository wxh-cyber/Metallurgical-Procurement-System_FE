<template>
  <section>
    <div class="page-head">
      <div><h2>采购订单</h2><p>手工创建采购订单，跟踪到货与入库进度。</p></div>
      <el-button v-if="canOrder" type="primary" @click="openCreate">手工建单</el-button>
    </div>

    <el-card shadow="never">
      <!-- 搜索：订单编号 + 状态 + 供应商 -->
      <el-form inline @submit.prevent="load">
        <el-form-item>
          <el-input v-model="query.keyword" placeholder="搜索订单编号" clearable style="width: 190px" @clear="load" />
        </el-form-item>
        <el-form-item>
          <el-select v-model="query.status" placeholder="全部状态" clearable style="width: 130px" @change="load">
            <el-option v-for="(item, value) in ORDER_STATUS_DICT" :key="value" :label="item.text" :value="value" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-select v-model="query.supplierId" placeholder="全部供应商" clearable filterable style="width: 190px" @change="load">
            <el-option v-for="s in suppliers" :key="s.id" :label="s.supplierName" :value="s.id" />
          </el-select>
        </el-form-item>
        <el-button type="primary" @click="load">查询</el-button>
      </el-form>

      <el-table v-loading="loading" :data="rows" empty-text="暂无采购订单" @row-click="showDetail">
        <el-table-column prop="orderCode" label="订单编号" width="150" />
        <el-table-column prop="materialName" label="物料名称" min-width="130" />
        <el-table-column prop="supplierName" label="供应商" min-width="150" />
        <el-table-column label="数量(吨)" width="100">
          <template #default="{ row }">{{ row.quantity }}</template>
        </el-table-column>
        <el-table-column label="单价(元/吨)" width="110">
          <template #default="{ row }">{{ row.unitPrice }}</template>
        </el-table-column>
        <el-table-column label="总金额(元)" width="130">
          <template #default="{ row }">{{ formatMoney(row.totalAmount) }}</template>
        </el-table-column>
        <el-table-column label="订单日期" width="110">
          <template #default="{ row }">{{ row.orderDate || '-' }}</template>
        </el-table-column>
        <el-table-column label="到货进度" min-width="150">
          <template #default="{ row }">
            <el-progress :percentage="progress(row)" :status="progressStatus(row)" :stroke-width="10" />
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="tagType(ORDER_STATUS_DICT[row.status]?.type)">{{ ORDER_STATUS_DICT[row.status]?.text || row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column v-if="canOrder" label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button v-if="row.status === 'CREATED'" link type="success" @click.stop="confirm(row)">确认</el-button>
            <el-button v-if="['CREATED', 'CONFIRMED'].includes(row.status)" link type="danger" @click.stop="close(row)">关闭</el-button>
            <el-button link @click.stop="showDetail(row)">详情</el-button>
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

    <!-- 手工建单弹窗 -->
    <el-dialog v-model="createVisible" title="手工创建采购订单" width="520px" destroy-on-close>
      <el-form ref="createRef" :model="createForm" :rules="createRules" label-width="120px">
        <el-form-item label="供应商" prop="supplierId">
          <el-select v-model="createForm.supplierId" placeholder="请选择供应商" filterable style="width: 100%">
            <el-option v-for="s in suppliers" :key="s.id" :label="`${s.supplierName}（${s.supplierCode}）`" :value="s.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="物料" prop="materialId">
          <el-select v-model="createForm.materialId" placeholder="请选择物料" filterable style="width: 100%">
            <el-option v-for="m in materials" :key="m.id" :label="`${m.materialName}（${m.materialCode}）`" :value="m.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="采购数量(吨)" prop="quantity">
          <el-input-number v-model="createForm.quantity" :min="0.01" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item label="采购单价(元/吨)" prop="unitPrice">
          <el-input-number v-model="createForm.unitPrice" :min="0.01" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item label="期望到货日期">
          <el-date-picker v-model="createForm.expectArrivalDate" type="date" value-format="YYYY-MM-DD" placeholder="选填" style="width: 100%" />
        </el-form-item>
        <el-form-item label="预计总金额">
          <span class="amount">{{ computedAmount }} 元</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="saveCreate">保存订单</el-button>
      </template>
    </el-dialog>

    <!-- 详情抽屉：到货进度条 -->
    <el-drawer v-model="detailVisible" :title="`订单详情 ${current?.orderCode || ''}`" size="480px">
      <template v-if="current">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="订单编号">{{ current.orderCode }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="tagType(ORDER_STATUS_DICT[current.status]?.type)">{{ ORDER_STATUS_DICT[current.status]?.text || current.status }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="物料名称">{{ current.materialName }}</el-descriptions-item>
          <el-descriptions-item label="物料编码">{{ current.materialCode || '-' }}</el-descriptions-item>
          <el-descriptions-item label="供应商">{{ current.supplierName }}</el-descriptions-item>
          <el-descriptions-item label="来源计划">{{ current.planId ? '有' : '手工创建' }}</el-descriptions-item>
          <el-descriptions-item label="数量">{{ current.quantity }} 吨</el-descriptions-item>
          <el-descriptions-item label="单价">{{ current.unitPrice }} 元/吨</el-descriptions-item>
          <el-descriptions-item label="总金额">{{ formatMoney(current.totalAmount) }} 元</el-descriptions-item>
          <el-descriptions-item label="订单日期">{{ current.orderDate || '-' }}</el-descriptions-item>
          <el-descriptions-item label="期望到货">{{ current.expectArrivalDate || '-' }}</el-descriptions-item>
        </el-descriptions>

        <div class="progress-block">
          <div class="progress-title">到货进度</div>
          <el-progress :percentage="progress(current)" :status="progressStatus(current)" :stroke-width="14" />
          <div class="progress-desc">已到货 {{ current.receivedQuantity || 0 }} 吨 / 共 {{ current.quantity }} 吨</div>
        </div>
      </template>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
      </template>
    </el-drawer>
  </section>
</template>

<script setup>
import { computed, reactive, ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { listOrders, createOrder, confirmOrder, closeOrder } from '../api/orders'
import { listMaterials } from '../api/materials'
import { listSuppliers } from '../api/suppliers'
import { ORDER_STATUS_DICT, tagType } from '../utils/dict'
import { useUserStore } from '../stores'

const userStore = useUserStore()
const canOrder = userStore.isAdmin || userStore.role === 'PROCUREMENT'

const rows = ref([])
const total = ref(0)
const loading = ref(false)
const saving = ref(false)
const materials = ref([])
const suppliers = ref([])
const current = ref(null)
const query = reactive({ pageNum: 1, pageSize: 10, keyword: '', status: '', supplierId: null })

const createVisible = ref(false)
const createRef = ref()
const createForm = reactive({ supplierId: null, materialId: null, quantity: null, unitPrice: null, expectArrivalDate: '' })
const createRules = {
  supplierId: [{ required: true, message: '请选择供应商', trigger: 'change' }],
  materialId: [{ required: true, message: '请选择物料', trigger: 'change' }],
  quantity: [{ required: true, message: '请输入采购数量', trigger: 'blur' }],
  unitPrice: [{ required: true, message: '请输入采购单价', trigger: 'blur' }]
}

const detailVisible = ref(false)

function formatMoney (value) {
  return Number(value || 0).toLocaleString('zh-CN', { maximumFractionDigits: 2 })
}

// 到货进度百分比：received / quantity
function progress (row) {
  const qty = Number(row.quantity || 0)
  if (!qty) return 0
  return Math.min(100, Math.round((Number(row.receivedQuantity || 0) / qty) * 100))
}

function progressStatus (row) {
  const p = progress(row)
  if (p >= 100) return 'success'
  if (row.status === 'CLOSED') return 'exception'
  return 'active'
}

// 手工建单实时计算金额
const computedAmount = computed(() => {
  const qty = Number(createForm.quantity || 0)
  const price = Number(createForm.unitPrice || 0)
  return (qty * price).toLocaleString('zh-CN', { maximumFractionDigits: 2 })
})

async function load () {
  loading.value = true
  try {
    const res = await listOrders(query)
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
  Object.assign(createForm, { supplierId: null, materialId: null, quantity: null, unitPrice: null, expectArrivalDate: '' })
  createVisible.value = true
}

async function saveCreate () {
  const ok = await createRef.value.validate().catch(() => false)
  if (!ok) return
  saving.value = true
  try {
    const res = await createOrder(createForm)
    ElMessage.success(`订单 ${res.data?.orderCode || ''} 创建成功`)
    createVisible.value = false
    load()
  } catch (e) { /* 错误提示已由拦截器统一处理 */ } finally { saving.value = false }
}

async function confirm (row) {
  try {
    await ElMessageBox.confirm(`确认订单「${row.orderCode}」？确认后进入供应商发货流程。`, '确认订单', { type: 'info' })
    await confirmOrder(row.id)
    ElMessage.success('订单已确认')
    load()
  } catch (e) { /* 取消或错误均不处理 */ }
}

async function close (row) {
  try {
    await ElMessageBox.confirm(`确认关闭订单「${row.orderCode}」？关闭后不可继续到货。`, '关闭订单', { type: 'warning' })
    await closeOrder(row.id)
    ElMessage.success('订单已关闭')
    load()
  } catch (e) { /* 取消或错误均不处理 */ }
}

function showDetail (row) {
  current.value = row
  detailVisible.value = true
}

onMounted(() => { load(); loadMaterials(); loadSuppliers() })
</script>

<style scoped>
.amount { color: #e6a23c; font-weight: 700; }
.progress-block { margin-top: 24px; }
.progress-title { font-size: 14px; font-weight: 600; margin-bottom: 12px; color: #303133; }
.progress-desc { margin-top: 8px; color: #909399; font-size: 13px; }
</style>
