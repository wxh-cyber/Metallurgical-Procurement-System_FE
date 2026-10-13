<template>
  <section>
    <div class="page-head">
      <div><h2>统计报表</h2><p>年度采购量、供应商供货占比、月度采购金额与检验合格率。</p></div>
      <el-button :loading="loading" @click="loadAll">刷新</el-button>
    </div>

    <el-row :gutter="16">
      <!-- ① 各物料年度采购量柱状图 -->
      <el-col :xs="24" :md="12">
        <el-card shadow="never" class="chart-card">
          <template #header><span>各物料年度采购量（吨）</span></template>
          <div ref="barRef" class="chart" />
        </el-card>
      </el-col>
      <!-- ② 供应商供货金额占比饼图 -->
      <el-col :xs="24" :md="12">
        <el-card shadow="never" class="chart-card">
          <template #header><span>供应商供货金额占比</span></template>
          <div ref="pieRef" class="chart" />
        </el-card>
      </el-col>
      <!-- ③ 近12个月采购金额折线图 -->
      <el-col :xs="24" :md="12">
        <el-card shadow="never" class="chart-card">
          <template #header><span>近12个月采购金额（元）</span></template>
          <div ref="lineRef" class="chart" />
        </el-card>
      </el-col>
      <!-- ④ 检验合格率统计表 -->
      <el-col :xs="24" :md="12">
        <el-card shadow="never" class="chart-card">
          <template #header><span>检验合格率统计</span></template>
          <el-table :data="rateRows" size="small" empty-text="暂无检验统计数据">
            <el-table-column prop="materialName" label="物料" min-width="110" />
            <el-table-column label="检验总数" width="80">
              <template #default="{ row }">{{ row.total }}</template>
            </el-table-column>
            <el-table-column label="合格" width="70">
              <template #default="{ row }">{{ row.qualified }}</template>
            </el-table-column>
            <el-table-column label="让步接收" width="80">
              <template #default="{ row }">{{ row.downgraded }}</template>
            </el-table-column>
            <el-table-column label="不合格" width="70">
              <template #default="{ row }">{{ row.unqualified }}</template>
            </el-table-column>
            <el-table-column label="合格率" width="90">
              <template #default="{ row }">{{ row.passRate }}%</template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </section>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import * as echarts from 'echarts'
import { purchaseByMaterial, supplierAmount, monthlyAmount, inspectRate } from '../api/stats'

const loading = ref(false)
const barRef = ref(null)
const pieRef = ref(null)
const lineRef = ref(null)
const rateRows = ref([])

const charts = []

function initChart (refEl, option) {
  if (!refEl.value) return
  const chart = echarts.init(refEl.value)
  chart.setOption(option)
  charts.push(chart)
}

function renderBar (data) {
  initChart(barRef, {
    tooltip: { trigger: 'axis' },
    grid: { left: 50, right: 20, top: 30, bottom: 50 },
    xAxis: { type: 'category', data: data.map((d) => d.materialName), axisLabel: { interval: 0, rotate: 25 } },
    yAxis: { type: 'value', name: '吨' },
    series: [{ type: 'bar', data: data.map((d) => d.quantity), itemStyle: { color: '#409eff' }, barMaxWidth: 42 }]
  })
}

function renderPie (data) {
  initChart(pieRef, {
    tooltip: { trigger: 'item', formatter: '{b}: {c} 元 ({d}%)' },
    legend: { bottom: 0, type: 'scroll' },
    series: [{
      type: 'pie',
      radius: ['40%', '65%'],
      center: ['50%', '45%'],
      data: data.map((d) => ({ name: d.supplierName, value: d.amount })),
      label: { formatter: '{b}\n{d}%' }
    }]
  })
}

function renderLine (data) {
  initChart(lineRef, {
    tooltip: { trigger: 'axis' },
    grid: { left: 70, right: 20, top: 30, bottom: 30 },
    xAxis: { type: 'category', data: data.map((d) => d.month) },
    yAxis: { type: 'value', name: '元' },
    series: [{
      type: 'line',
      smooth: true,
      data: data.map((d) => d.amount),
      itemStyle: { color: '#67c23a' },
      areaStyle: { color: 'rgba(103,194,58,0.15)' }
    }]
  })
}

async function loadAll () {
  loading.value = true
  try {
    const [bar, pie, line, rate] = await Promise.all([
      purchaseByMaterial(), supplierAmount(), monthlyAmount(), inspectRate()
    ])
    renderBar(bar.data || [])
    renderPie(pie.data || [])
    renderLine(line.data || [])
    rateRows.value = rate.data || []
  } catch (e) { /* 错误提示已由拦截器统一处理 */ } finally { loading.value = false }
}

// 窗口变化时自适应
function onResize () {
  charts.forEach((c) => c.resize())
}

onMounted(() => {
  loadAll()
  window.addEventListener('resize', onResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', onResize)
  charts.forEach((c) => c.dispose())
  charts.length = 0
})
</script>

<style scoped>
.chart-card { margin-bottom: 16px; }
.chart { height: 320px; }
</style>
