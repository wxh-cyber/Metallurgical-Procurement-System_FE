<template>
  <section>
    <div class="page-head">
      <div><h2>入库管理</h2><p>从合格/让步接收的检验单生成入库单，入库后更新库存。</p></div>
    </div>

    <el-card shadow="never" class="pending-card">
      <template #header>
        <span><el-icon color="#67c23a"><CircleCheck /></el-icon> 待入库检验单（合格 / 让步接收且未入库）</span>
      </template>
      <el-table :data="pendingInspects" empty-text="暂无待入库检验单">
        <el-table-column prop="inspectCode" label="检验单号" width="150" />
        <el-table-column prop="orderCode" label="来源订单" width="150" />
        <el-table-column prop="supplierName" label="供应商" min-width="140" />
        <el-table-column prop="materialName" label="物料" min-width="120" />
        <el-table-column label="到货数量(吨)" width="110">
          <template #default="{ row }">{{ row.arrivalQuantity }}</template>
        </el-table-column>
        <el-table-column label="判定结果" width="110">
          <template #default="{ row }">
            <el-tag :type="tagType(INSPECT_RESULT_DICT[row.result]?.type)">{{ INSPECT_RESULT_DICT[row.result]?.text }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="inspector" label="检验人" width="90" />
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button v-if="canInbound" type="primary" size="small" @click="create(row)">一键入库</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-card shadow="never" class="list-card">
      <template #header>
        <span>入库记录</span>
      </template>
      <el-form inline @submit.prevent="loadInbounds">
        <el-form-item>
          <el-input v-model="query.keyword" placeholder="搜索入库单号" clearable style="width: 190px" @clear="loadInbounds" />
        </el-form-item>
        <el-button type="primary" @click="loadInbounds">查询</el-button>
      </el-form>
      <el-table v-loading="loading" :data="inbounds" empty-text="暂无入库记录">
        <el-table-column prop="inCode" label="入库单号" width="150" />
        <el-table-column prop="inspectCode" label="来源检验单" width="150" />
        <el-table-column prop="orderCode" label="来源订单" width="150" />
        <el-table-column prop="materialName" label="物料" min-width="120" />
        <el-table-column prop="supplierName" label="供应商" min-width="140" />
        <el-table-column label="入库数量(吨)" width="110">
          <template #default="{ row }">{{ row.quantity }}</template>
        </el-table-column>
        <el-table-column label="入库时间" width="160">
          <template #default="{ row }">{{ formatTime(row.inTime) }}</template>
        </el-table-column>
        <el-table-column prop="operator" label="操作人" width="90" />
      </el-table>
      <el-pagination
        v-model:current-page="query.pageNum"
        v-model:page-size="query.pageSize"
        layout="total, prev, pager, next"
        :total="total"
        @current-change="loadInbounds"
      />
    </el-card>
  </section>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { listInbounds, createInbound } from '../api/inbounds'
import { listInspects } from '../api/inspects'
import { INSPECT_RESULT_DICT, tagType } from '../utils/dict'
import { useUserStore } from '../stores'

const userStore = useUserStore()
const canInbound = userStore.isAdmin || userStore.role === 'WAREHOUSE'

const inbounds = ref([])
const pendingInspects = ref([])
const total = ref(0)
const loading = ref(false)
const creating = ref(false)
const query = reactive({ pageNum: 1, pageSize: 10, keyword: '' })

function formatTime (value) {
  if (!value) return '-'
  return String(value).replace('T', ' ').slice(0, 16)
}

async function loadInbounds () {
  loading.value = true
  try {
    const res = await listInbounds(query)
    inbounds.value = res.data?.records || []
    total.value = res.data?.total || 0
  } catch (e) { /* 错误提示已由拦截器统一处理 */ } finally { loading.value = false }
}

// 加载待入库检验单：合格/让步接收 且 未生成入库单
async function loadPendingInspects () {
  try {
    const [inspectRes, inboundRes] = await Promise.all([
      listInspects({ pageNum: 1, pageSize: 100 }),
      listInbounds({ pageNum: 1, pageSize: 100 })
    ])
    const inboundInspectIds = new Set((inboundRes.data?.records || []).map((r) => r.inspectId))
    pendingInspects.value = (inspectRes.data?.records || []).filter(
      (r) => ['QUALIFIED', 'DOWNGRADED'].includes(r.result) && !inboundInspectIds.has(r.id)
    )
  } catch (e) { /* 错误提示已由拦截器统一处理 */ }
}

async function create (row) {
  try {
    await ElMessageBox.confirm(
      `确认将检验单「${row.inspectCode}」的 ${row.arrivalQuantity} 吨 ${row.materialName} 入库？`,
      '生成入库单',
      { type: 'info' }
    )
    creating.value = true
    await createInbound({ inspectId: row.id, quantity: row.arrivalQuantity })
    ElMessage.success('入库成功，库存已更新')
    loadPendingInspects()
    loadInbounds()
  } catch (e) { /* 取消或错误均不处理 */ } finally { creating.value = false }
}

onMounted(() => { loadInbounds(); loadPendingInspects() })
</script>

<style scoped>
.pending-card { margin-bottom: 16px; }
.list-card :deep(.el-card__body) { padding-top: 8px; }
</style>
