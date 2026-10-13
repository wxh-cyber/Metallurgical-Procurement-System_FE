<template>
  <section>
    <div class="page-head">
      <div><h2>到货检验</h2><p>到货登记与质量检验，系统按冶金指标自动判定。</p></div>
      <el-button v-if="canInspect" type="primary" @click="openCreate">新增检验</el-button>
    </div>

    <el-card shadow="never">
      <!-- 搜索：检验单号 + 结果 -->
      <el-form inline @submit.prevent="load">
        <el-form-item>
          <el-input v-model="query.keyword" placeholder="搜索检验单号" clearable style="width: 190px" @clear="load" />
        </el-form-item>
        <el-form-item>
          <el-select v-model="query.result" placeholder="全部结果" clearable style="width: 140px" @change="load">
            <el-option v-for="(item, value) in INSPECT_RESULT_DICT" :key="value" :label="item.text" :value="value" />
          </el-select>
        </el-form-item>
        <el-button type="primary" @click="load">查询</el-button>
      </el-form>

      <el-table v-loading="loading" :data="rows" empty-text="暂无检验记录">
        <el-table-column prop="inspectCode" label="检验单号" width="150" />
        <el-table-column prop="orderCode" label="来源订单" width="150" />
        <el-table-column prop="supplierName" label="供应商" min-width="140" />
        <el-table-column prop="materialName" label="物料" min-width="120" />
        <el-table-column label="到货数量(吨)" width="110">
          <template #default="{ row }">{{ row.arrivalQuantity }}</template>
        </el-table-column>
        <el-table-column label="主成分实测%" width="100">
          <template #default="{ row }">{{ row.mainIndexActual ?? '-' }}</template>
        </el-table-column>
        <el-table-column label="硫实测%" width="90">
          <template #default="{ row }">{{ row.sActual ?? '-' }}</template>
        </el-table-column>
        <el-table-column label="磷实测%" width="90">
          <template #default="{ row }">{{ row.pActual ?? '-' }}</template>
        </el-table-column>
        <el-table-column label="粒度" width="80">
          <template #default="{ row }">{{ row.granularityOk === 1 ? '达标' : (row.granularityOk === 0 ? '不达标' : '-') }}</template>
        </el-table-column>
        <el-table-column label="判定结果" width="100">
          <template #default="{ row }">
            <el-tag :type="tagType(INSPECT_RESULT_DICT[row.result]?.type)">{{ INSPECT_RESULT_DICT[row.result]?.text || row.result }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="inspector" label="检验人" width="90" />
        <el-table-column label="检验时间" width="160">
          <template #default="{ row }">{{ formatTime(row.inspectTime) }}</template>
        </el-table-column>
        <el-table-column v-if="canInspect" label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button link type="warning" @click="openResult(row)">修正结果</el-button>
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

    <!-- 新增检验弹窗 -->
    <el-dialog v-model="createVisible" title="到货登记与检验" width="640px" destroy-on-close>
      <el-form ref="createRef" :model="createForm" :rules="createRules" label-width="110px">
        <el-form-item label="来源订单" prop="orderId">
          <el-select v-model="createForm.orderId" placeholder="选择待到货订单" filterable style="width: 100%" @change="onOrderChange">
            <el-option v-for="o in receivableOrders" :key="o.id" :label="`${o.orderCode}｜${o.materialName}｜剩余${remaining(o)}吨`" :value="o.id" />
          </el-select>
        </el-form-item>

        <!-- 订单与物料标准提示 -->
        <template v-if="currentOrder">
          <el-alert type="info" :closable="false" class="order-tip">
            <template #title>
              <div>订单 {{ currentOrder.orderCode }} · {{ currentOrder.supplierName }}<br />
              已到货 {{ currentOrder.receivedQuantity || 0 }} 吨，剩余可到货 <b>{{ remaining(currentOrder) }}</b> 吨<br />
              检验标准：主成分≥{{ currentMaterial?.mainIndexRequired ?? '-' }}%，硫≤{{ currentMaterial?.sMax ?? '-' }}%，磷≤{{ currentMaterial?.pMax ?? '-' }}%，粒度要求：{{ currentMaterial?.granularity || '无' }}
              </div>
            </template>
          </el-alert>
        </template>

        <el-form-item label="到货日期">
          <el-date-picker v-model="createForm.arrivalDate" type="date" value-format="YYYY-MM-DD" placeholder="默认当天" style="width: 100%" />
        </el-form-item>
        <el-form-item label="到货数量(吨)" prop="arrivalQuantity">
          <el-input-number v-model="createForm.arrivalQuantity" :min="0.01" :precision="2" :max="maxArrival" style="width: 100%" />
        </el-form-item>
        <el-row :gutter="12">
          <el-col :span="8"><el-form-item label="主成分实测%" prop="mainIndexActual"><el-input-number v-model="createForm.mainIndexActual" :min="0" :max="100" :precision="2" style="width: 100%" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="硫实测%" prop="sActual"><el-input-number v-model="createForm.sActual" :min="0" :max="100" :precision="3" style="width: 100%" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="磷实测%" prop="pActual"><el-input-number v-model="createForm.pActual" :min="0" :max="100" :precision="3" style="width: 100%" /></el-form-item></el-col>
        </el-row>
        <el-form-item label="粒度是否达标" prop="granularityOk">
          <el-radio-group v-model="createForm.granularityOk">
            <el-radio :value="1">达标</el-radio>
            <el-radio :value="0">不达标</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="createForm.remark" type="textarea" :rows="2" />
        </el-form-item>

        <!-- 实时自动判定建议 -->
        <el-form-item label="自动判定">
          <div class="judge-box" v-if="currentMaterial && suggestion">
            <el-tag :type="tagType(INSPECT_RESULT_DICT[suggestion]?.type)" size="large">
              {{ INSPECT_RESULT_DICT[suggestion]?.text }}
            </el-tag>
            <span class="judge-tip">
              {{ suggestion === 'UNQUALIFIED' ? '不合格，不得入库，请退回供应商处理' : (suggestion === 'DOWNGRADED' ? '让步接收，建议降价结算' : '指标全部达标') }}
            </span>
          </div>
          <span v-else class="judge-tip">请先选择订单并录入实测值</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="saveCreate">提交检验</el-button>
      </template>
    </el-dialog>

    <!-- 修正结果弹窗 -->
    <el-dialog v-model="resultVisible" title="人工修正检验结果" width="440px" destroy-on-close>
      <p class="result-tip">系统判定：<el-tag :type="tagType(INSPECT_RESULT_DICT[current?.result]?.type)">{{ INSPECT_RESULT_DICT[current?.result]?.text }}</el-tag></p>
      <el-form ref="resultRef" :model="resultForm" :rules="resultRules" label-width="90px">
        <el-form-item label="修正为" prop="result">
          <el-radio-group v-model="resultForm.result">
            <el-radio v-for="(item, value) in INSPECT_RESULT_DICT" :key="value" :value="value">{{ item.text }}</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="resultVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="saveResult">保存</el-button>
      </template>
    </el-dialog>
  </section>
</template>

<script setup>
import { computed, reactive, ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { listInspects, createInspect, updateInspectResult } from '../api/inspects'
import { listOrders } from '../api/orders'
import { listMaterials } from '../api/materials'
import { INSPECT_RESULT_DICT, judgeResult, tagType } from '../utils/dict'
import { useUserStore } from '../stores'

const userStore = useUserStore()
const canInspect = userStore.isAdmin || userStore.role === 'INSPECTOR'

const rows = ref([])
const total = ref(0)
const loading = ref(false)
const saving = ref(false)
const orders = ref([])
const materials = ref([])
const current = ref(null)
const query = reactive({ pageNum: 1, pageSize: 10, keyword: '', result: '' })

const createVisible = ref(false)
const createRef = ref()
const createForm = reactive({ orderId: null, arrivalDate: '', arrivalQuantity: null, mainIndexActual: null, sActual: null, pActual: null, granularityOk: null, remark: '' })
const createRules = {
  orderId: [{ required: true, message: '请选择来源订单', trigger: 'change' }],
  arrivalQuantity: [{ required: true, message: '请输入到货数量', trigger: 'blur' }]
}

const resultVisible = ref(false)
const resultRef = ref()
const resultForm = reactive({ result: '' })
const resultRules = { result: [{ required: true, message: '请选择检验结果', trigger: 'change' }] }

// 可到货订单：已下单/部分到货/全部到货 且 未到满
const receivableOrders = computed(() => orders.value.filter((o) => ['CREATED', 'CONFIRMED', 'PARTIAL', 'ARRIVED'].includes(o.status) && remaining(o) > 0))

const currentOrder = computed(() => orders.value.find((o) => o.id === createForm.orderId) || null)
const currentMaterial = computed(() => materials.value.find((m) => m.id === (currentOrder.value?.materialId)) || null)
const maxArrival = computed(() => remaining(currentOrder.value))
const suggestion = computed(() => (currentMaterial.value ? judgeResult(currentMaterial.value, createForm) : ''))

function remaining (order) {
  return Number((order.quantity || 0) - (order.receivedQuantity || 0))
}

function formatTime (value) {
  if (!value) return '-'
  return String(value).replace('T', ' ').slice(0, 16)
}

async function load () {
  loading.value = true
  try {
    const res = await listInspects(query)
    rows.value = res.data?.records || []
    total.value = res.data?.total || 0
  } catch (e) { /* 错误提示已由拦截器统一处理 */ } finally { loading.value = false }
}

async function loadOrders () {
  const res = await listOrders({ pageNum: 1, pageSize: 100 }).catch(() => ({ data: { records: [] } }))
  orders.value = res.data?.records || []
}

async function loadMaterials () {
  const res = await listMaterials({ pageNum: 1, pageSize: 100 }).catch(() => ({ data: { records: [] } }))
  materials.value = res.data?.records || []
}

function onOrderChange () {
  Object.assign(createForm, { arrivalQuantity: null, mainIndexActual: null, sActual: null, pActual: null, granularityOk: null })
}

function openCreate () {
  Object.assign(createForm, { orderId: null, arrivalDate: '', arrivalQuantity: null, mainIndexActual: null, sActual: null, pActual: null, granularityOk: null, remark: '' })
  createVisible.value = true
}

async function saveCreate () {
  const ok = await createRef.value.validate().catch(() => false)
  if (!ok) return
  // 有粒度要求时必须选择是否达标
  if (currentMaterial.value?.granularity && createForm.granularityOk === null) {
    ElMessage.warning('该物料有粒度要求，请选择粒度是否达标')
    return
  }
  saving.value = true
  try {
    const res = await createInspect(createForm)
    ElMessage.success(`检验单 ${res.data?.inspectCode || ''} 登记成功`)
    createVisible.value = false
    load(); loadOrders()
  } catch (e) { /* 错误提示已由拦截器统一处理 */ } finally { saving.value = false }
}

function openResult (row) {
  current.value = row
  resultForm.result = row.result
  resultVisible.value = true
}

async function saveResult () {
  const ok = await resultRef.value.validate().catch(() => false)
  if (!ok) return
  saving.value = true
  try {
    await updateInspectResult(current.value.id, resultForm.result)
    ElMessage.success('结果已修正')
    resultVisible.value = false
    load()
  } catch (e) { /* 错误提示已由拦截器统一处理 */ } finally { saving.value = false }
}

onMounted(() => { load(); loadOrders(); loadMaterials() })
</script>

<style scoped>
.order-tip { margin-bottom: 18px; }
.order-tip :deep(.el-alert__title) { line-height: 1.8; }
.judge-box { display: flex; align-items: center; gap: 12px; }
.judge-tip { color: #909399; font-size: 13px; }
.result-tip { margin: 0 0 16px; color: #606266; font-size: 14px; }
</style>
