<template>
  <section>
    <div class="page-head">
      <div><h2>仪表盘</h2><p>采购业务总览与库存预警提醒。</p></div>
    </div>

    <!-- 4 个统计卡片 -->
    <el-row :gutter="16">
      <el-col :xs="12" :sm="12" :md="6" v-for="card in cards" :key="card.label">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-icon" :style="{ background: card.bg, color: card.color }">
            <el-icon :size="22"><component :is="card.icon" /></el-icon>
          </div>
          <div class="stat-body">
            <div class="stat-value">{{ card.value }}</div>
            <div class="stat-label">{{ card.label }}</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 库存预警物料列表 -->
    <el-card shadow="never" class="warn-card">
      <template #header>
        <div class="warn-header">
          <span><el-icon color="#e6a23c"><Warning /></el-icon> 库存预警物料</span>
          <el-button link type="primary" @click="goInventory">查看库存台账</el-button>
        </div>
      </template>
      <el-table :data="warnings" empty-text="暂无库存预警物料，库存均处于安全水平">
        <el-table-column prop="materialCode" label="物料编码" width="140" />
        <el-table-column prop="materialName" label="物料名称" />
        <el-table-column prop="unit" label="单位" width="80" />
        <el-table-column label="当前库存" width="120">
          <template #default="{ row }"><span class="warn-stock">{{ row.quantity }}</span></template>
        </el-table-column>
        <el-table-column label="安全库存" width="120">
          <template #default="{ row }">{{ row.safetyStock }}</template>
        </el-table-column>
        <el-table-column label="缺口" width="120">
          <template #default="{ row }"><span class="warn-gap">{{ row.shortage }}</span></template>
        </el-table-column>
        <el-table-column label="建议" min-width="180">
          <template #default>建议该车间提交采购计划</template>
        </el-table-column>
      </el-table>
    </el-card>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { getDashboard } from '../../api/stats'
import { listWarnings } from '../../api/inventory'

const router = useRouter()
const summary = ref({ monthPurchaseAmount: 0, pendingPlanCount: 0, pendingInspectCount: 0, warningMaterialCount: 0 })
const warnings = ref([])

const cards = computed(() => [
  { label: '本月采购金额（元）', value: formatAmount(summary.value.monthPurchaseAmount), icon: 'Money', bg: '#ecf5ff', color: '#409eff' },
  { label: '待审批计划数', value: summary.value.pendingPlanCount, icon: 'Document', bg: '#fdf6ec', color: '#e6a23c' },
  { label: '待检验到货数', value: summary.value.pendingInspectCount, icon: 'View', bg: '#f0f9eb', color: '#67c23a' },
  { label: '库存预警物料数', value: summary.value.warningMaterialCount, icon: 'Warning', bg: '#fef0f0', color: '#f56c6c' }
])

function formatAmount (value) {
  const n = Number(value || 0)
  return n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function goInventory () {
  router.push('/inventory')
}

async function load () {
  try {
    const res = await getDashboard()
    summary.value = res.data || summary.value
  } catch (e) { /* 错误提示已由拦截器统一处理 */ }
  try {
    const res = await listWarnings()
    warnings.value = res.data || []
  } catch (e) { /* 错误提示已由拦截器统一处理 */ }
}

onMounted(load)
</script>

<style scoped>
.stat-card :deep(.el-card__body) { display: flex; align-items: center; gap: 14px; }
.stat-icon { width: 48px; height: 48px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.stat-value { font-size: 24px; font-weight: 700; color: #303133; line-height: 1.2; }
.stat-label { font-size: 13px; color: #909399; margin-top: 2px; }
.warn-card { margin-top: 16px; }
.warn-header { display: flex; justify-content: space-between; align-items: center; }
.warn-header span { display: inline-flex; align-items: center; gap: 6px; }
.warn-stock { color: #f56c6c; font-weight: 700; }
.warn-gap { color: #e6a23c; font-weight: 700; }
</style>
