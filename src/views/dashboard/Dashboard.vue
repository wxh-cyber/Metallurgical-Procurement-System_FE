<template>
  <section class="dashboard-page">
    <header class="dashboard-heading">
      <div>
        <div class="eyebrow"><span class="eyebrow-line" /> OPERATIONS / OVERVIEW</div>
        <h1>采购概览</h1>
        <p>按物料查看本年度采购数量分布与构成。</p>
      </div>
      <div class="heading-meta"><span class="meta-label">统计周期</span><strong>{{ year }} 年度</strong><span class="meta-dates">{{ year }}.01.01 — {{ year }}.12.31</span></div>
    </header>

    <div class="report-strip">
      <div class="report-strip-mark"><el-icon><DataAnalysis /></el-icon></div>
      <div class="report-strip-copy"><strong>物料采购数量分析</strong><span>已按采购数量降序排列 · 悬停查看详细数据</span></div>
      <div class="report-strip-total"><span>年度采购总量</span><strong>{{ formatNumber(totalQuantity) }}<small v-if="commonUnit"> {{ commonUnit }}</small></strong></div>
      <el-button class="refresh-button" text :loading="loading" aria-label="刷新采购统计" @click="loadReport"><el-icon><Refresh /></el-icon></el-button>
    </div>

    <div v-if="loading && !hasLoaded" class="state-card loading-state"><el-icon class="state-spinner"><Loading /></el-icon><span>正在读取采购统计…</span></div>
    <div v-else-if="errorMessage" class="state-card error-state">
      <div class="state-icon error-icon"><el-icon><WarningFilled /></el-icon></div><strong>采购统计暂时不可用</strong><p>{{ errorMessage }}</p>
      <el-button type="primary" plain :loading="loading" @click="loadReport">重新加载</el-button>
    </div>
    <div v-else-if="hasLoaded && !chartData.length" class="state-card empty-state">
      <div class="empty-orbit"><el-icon><PieChart /></el-icon></div><strong>本年度暂无采购数据</strong><p>当年度产生采购记录后，物料统计图表会显示在这里。</p>
    </div>
    <div v-else class="charts-grid" :class="{ 'is-refreshing': loading }">
      <el-card class="chart-card ranking-card" shadow="never">
        <div class="chart-card-heading"><div><span class="chart-kicker">QUANTITY / RANKING</span><h2>各物料采购数量</h2><p>横向比较各物料的年度采购总量</p></div><span class="chart-index">01</span></div>
        <div ref="barChartElement" class="chart-canvas bar-canvas" role="img" aria-label="各物料年度采购数量横向柱状图" />
        <div class="chart-footnote"><span class="legend-swatch" />采购数量<span class="footnote-hint">悬停图表查看数量与占比</span></div>
      </el-card>
      <el-card class="chart-card composition-card" shadow="never">
        <div class="chart-card-heading"><div><span class="chart-kicker">COMPOSITION / SHARE</span><h2>采购数量构成</h2><p>各物料占年度采购总量的比例</p></div><span class="chart-index">02</span></div>
        <div class="donut-wrap"><div ref="donutChartElement" class="chart-canvas donut-canvas" role="img" aria-label="各物料年度采购数量构成环形图" /><div class="donut-center" aria-hidden="true"><span>采购总量</span><strong>{{ formatCompactNumber(totalQuantity) }}</strong><small>{{ commonUnit || '数量' }}</small></div></div>
        <div class="composition-legend" aria-label="物料数量图例">
          <div v-for="item in chartData.slice(0, 6)" :key="item.key" class="legend-item"><span class="legend-dot" :style="{ background: item.color }" /><span class="legend-name" :title="item.name">{{ item.name }}</span><strong>{{ formatPercent(item.share) }}</strong></div>
          <div v-if="chartData.length > 6" class="legend-more">另有 {{ chartData.length - 6 }} 种物料，可悬停环图查看</div>
        </div>
      </el-card>
    </div>
    <footer class="dashboard-footer"><span class="footer-rule" />数据来自采购报表 · 数值以系统记录为准<span class="footer-year">{{ year }} / PROCUREMENT</span></footer>
  </section>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import * as echarts from 'echarts/core'
import { BarChart, PieChart as PieSeriesChart } from 'echarts/charts'
import { GridComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { ElMessage } from 'element-plus'
import { DataAnalysis, Loading, PieChart, Refresh, WarningFilled } from '@element-plus/icons-vue'
import { getPurchaseReport } from '../../api/reports'

echarts.use([BarChart, PieSeriesChart, GridComponent, TooltipComponent, CanvasRenderer])

const year = new Date().getFullYear()
const barChartElement = ref(null)
const donutChartElement = ref(null)
const loading = ref(true)
const hasLoaded = ref(false)
const errorMessage = ref('')
const chartData = ref([])
let barChart
let donutChart
let resizeObserver
let chartsLinked = false
const totalQuantity = computed(() => chartData.value.reduce((sum, item) => sum + item.quantity, 0))
const commonUnit = computed(() => {
  const units = new Set(chartData.value.map(item => item.unit).filter(Boolean))
  return units.size === 1 ? [...units][0] : ''
})
const palette = ['#c58a43', '#4f7180', '#8d9a74', '#c27558', '#7187a5', '#9b795a', '#62a094', '#a67e9a', '#b39a57', '#607b68']

function extractMaterialRows (response) {
  const payload = response?.data ?? response
  if (Array.isArray(payload)) return payload
  const candidates = [payload?.byMaterial, payload?.materials, payload?.records, payload?.items, response?.byMaterial]
  return candidates.find(Array.isArray) || null
}

function normalizeRows (response) {
  const rows = extractMaterialRows(response)
  if (!rows) throw new Error('采购报表返回格式无法识别，请检查接口数据结构。')
  const normalized = rows.map((row, index) => {
    const quantity = Number(row?.quantity ?? row?.purchaseQuantity ?? row?.totalQuantity)
    const name = String(row?.materialName || row?.name || row?.materialCode || ('物料 ' + (index + 1)))
    return { key: String(row?.materialId ?? row?.id ?? row?.materialCode ?? name), name, code: row?.materialCode || '', quantity, unit: row?.unit || '', color: palette[index % palette.length] }
  }).filter(row => Number.isFinite(row.quantity) && row.quantity >= 0)
  normalized.sort((a, b) => b.quantity - a.quantity)
  const total = normalized.reduce((sum, row) => sum + row.quantity, 0)
  return normalized.map(row => ({ ...row, share: total ? row.quantity / total : 0 }))
}

function formatNumber (value) { return new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 2 }).format(value) }
function formatCompactNumber (value) { return new Intl.NumberFormat('zh-CN', { notation: value >= 100000 ? 'compact' : 'standard', maximumFractionDigits: 1 }).format(value) }
function formatPercent (value) { return (value * 100).toFixed(1) + '%' }
function escapeHtml (value) { return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]) }

function tooltipContent (item) {
  const quantity = formatNumber(item.quantity) + (item.unit ? ' ' + escapeHtml(item.unit) : '')
  const code = item.code ? '<div class="tooltip-code">' + escapeHtml(item.code) + '</div>' : ''
  return '<div class="chart-tooltip"><div class="tooltip-title"><i style="background:' + item.color + '"></i>' + escapeHtml(item.name) + '</div>' + code + '<div class="tooltip-row"><span>采购数量</span><strong>' + quantity + '</strong></div><div class="tooltip-row"><span>占比</span><strong>' + formatPercent(item.share) + '</strong></div></div>'
}

function createBarOption () {
  return {
    animationDuration: 750, animationDurationUpdate: 450, animationEasing: 'cubicOut', animationEasingUpdate: 'cubicOut',
    grid: { left: 12, right: 34, top: 8, bottom: 12, containLabel: true },
    tooltip: { trigger: 'item', confine: true, backgroundColor: 'transparent', borderWidth: 0, padding: 0, extraCssText: 'box-shadow:none', formatter: params => tooltipContent(chartData.value[params.dataIndex]) },
    xAxis: { type: 'value', axisLine: { show: false }, axisTick: { show: false }, splitLine: { lineStyle: { color: '#edf0f1', type: 'dashed' } }, axisLabel: { color: '#9aa6ad', fontSize: 10, formatter: value => formatNumber(value) } },
    yAxis: { type: 'category', data: chartData.value.map(item => item.name), inverse: true, axisLine: { show: false }, axisTick: { show: false }, axisLabel: { color: '#536675', fontSize: 11, width: 118, overflow: 'truncate', margin: 14 } },
    series: [{ type: 'bar', data: chartData.value.map(item => ({ value: item.quantity, itemStyle: { color: new echarts.graphic.LinearGradient(1, 0, 0, 0, [{ offset: 0, color: item.color }, { offset: 1, color: item.color + '99' }]) } })), barMaxWidth: 20, barMinHeight: 2, showBackground: true, backgroundStyle: { color: '#f2f4f3', borderRadius: [0, 6, 6, 0] }, itemStyle: { borderRadius: [0, 6, 6, 0] }, label: { show: true, position: 'right', color: '#72828d', fontSize: 10, distance: 8, formatter: params => formatNumber(params.value) }, emphasis: { focus: 'self', itemStyle: { shadowBlur: 12, shadowColor: 'rgba(39,59,73,.18)' } }, blur: { itemStyle: { opacity: 0.24 }, label: { color: '#aab2b6' } }, select: { disabled: true } }]
  }
}

function createDonutOption () {
  return {
    animationDuration: 850, animationDurationUpdate: 500, animationEasing: 'cubicOut',
    tooltip: { trigger: 'item', confine: true, backgroundColor: 'transparent', borderWidth: 0, padding: 0, extraCssText: 'box-shadow:none', formatter: params => tooltipContent(chartData.value[params.dataIndex]) },
    series: [{ type: 'pie', radius: ['59%', '78%'], center: ['50%', '50%'], avoidLabelOverlap: true, minAngle: 2, itemStyle: { borderColor: '#fff', borderWidth: 3, borderRadius: 5 }, label: { show: false }, labelLine: { show: false }, emphasis: { scale: true, scaleSize: 8, itemStyle: { shadowBlur: 16, shadowColor: 'rgba(35,55,70,.22)' } }, blur: { itemStyle: { opacity: 0.24 } }, data: chartData.value.map(item => ({ name: item.name, value: item.quantity, itemStyle: { color: item.color } })) }]
  }
}

function linkHover (source, target) {
  source.on('mouseover', params => {
    source.dispatchAction({ type: 'highlight', seriesIndex: 0, dataIndex: params.dataIndex })
    target.dispatchAction({ type: 'downplay', seriesIndex: 0 })
    target.dispatchAction({ type: 'highlight', seriesIndex: 0, dataIndex: params.dataIndex })
  })
  source.on('globalout', () => { source.dispatchAction({ type: 'downplay', seriesIndex: 0 }); target.dispatchAction({ type: 'downplay', seriesIndex: 0 }) })
}

function renderCharts () {
  if (!chartData.value.length || !barChart || !donutChart) return
  barChart.setOption(createBarOption(), true)
  donutChart.setOption(createDonutOption(), true)
}

function initializeCharts () {
  if (!barChart && barChartElement.value) barChart = echarts.init(barChartElement.value)
  if (!donutChart && donutChartElement.value) donutChart = echarts.init(donutChartElement.value)
  if (barChart && donutChart && !chartsLinked) {
    linkHover(barChart, donutChart)
    linkHover(donutChart, barChart)
    chartsLinked = true
  }
  if (typeof ResizeObserver !== 'undefined' && !resizeObserver) {
    resizeObserver = new ResizeObserver(resizeCharts)
    if (barChartElement.value) resizeObserver.observe(barChartElement.value)
    if (donutChartElement.value) resizeObserver.observe(donutChartElement.value)
  } else if (!resizeObserver) window.addEventListener('resize', resizeCharts)
}

function disposeCharts () {
  resizeObserver?.disconnect()
  resizeObserver = null
  window.removeEventListener('resize', resizeCharts)
  barChart?.dispose()
  donutChart?.dispose()
  barChart = null
  donutChart = null
  chartsLinked = false
}

async function loadReport () {
  loading.value = true
  errorMessage.value = ''
  try {
    const response = await getPurchaseReport({ year })
    chartData.value = normalizeRows(response)
    hasLoaded.value = true
  } catch (error) {
    errorMessage.value = error.response?.data?.msg || error.message || '加载采购统计失败，请稍后重试。'
    chartData.value = []
    hasLoaded.value = true
    ElMessage.error('采购统计加载失败')
  } finally {
    loading.value = false
    await nextTick()
    if (chartData.value.length) {
      initializeCharts()
      renderCharts()
    } else disposeCharts()
  }
}

onMounted(loadReport)
function resizeCharts () { barChart?.resize(); donutChart?.resize() }
onBeforeUnmount(disposeCharts)
</script>

<style>
.chart-tooltip { min-width: 176px; padding: 12px 14px; border: 1px solid rgba(230,236,238,.92); border-radius: 10px; color: #344858; background: rgba(255,255,255,.97); box-shadow: 0 12px 34px rgba(29,49,64,.16); font-family: inherit; }
.tooltip-title { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; font-size: 12px; font-weight: 700; }
.tooltip-title i { width: 8px; height: 8px; border-radius: 3px; }
.tooltip-code { margin: 0 0 8px 16px; color: #9aa6ac; font-size: 9px; letter-spacing: .04em; }
.tooltip-row { display: flex; justify-content: space-between; gap: 18px; margin-top: 7px; color: #87959d; font-size: 10px; }
.tooltip-row strong { color: #344858; font-size: 11px; }
</style>

<style scoped>
.dashboard-page { max-width: 1240px; margin: 0 auto; color: #263a4b; animation: dashboard-enter 420ms ease both; }
.dashboard-heading { display: flex; justify-content: space-between; align-items: flex-end; margin: 1px 0 23px; }
.eyebrow { display: flex; align-items: center; gap: 9px; color: #a17b49; font-size: 9px; font-weight: 700; letter-spacing: .19em; }
.eyebrow-line { width: 21px; height: 1px; background: #d9a75d; }
.dashboard-heading h1 { margin: 10px 0 6px; color: #243848; font-size: 27px; letter-spacing: -.04em; }
.dashboard-heading p { margin: 0; color: #82909b; font-size: 13px; }
.heading-meta { display: grid; grid-template-columns: auto auto; align-items: baseline; column-gap: 10px; padding: 10px 14px; border: 1px solid #e1e7e9; border-radius: 9px; background: rgba(255,255,255,.66); }
.meta-label { color: #96a3a9; font-size: 10px; }
.heading-meta strong { color: #425969; font-size: 12px; }
.meta-dates { grid-column: 1 / -1; margin-top: 4px; color: #a4afb4; font-size: 9px; letter-spacing: .08em; }
.report-strip { display: flex; align-items: center; gap: 13px; margin-bottom: 19px; padding: 14px 18px; border: 1px solid #e4e9e9; border-radius: 12px; background: linear-gradient(100deg,#fff 0%,#fbfaf7 100%); box-shadow: 0 5px 17px rgba(30,52,68,.025); }
.report-strip-mark { display: grid; flex: 0 0 38px; place-items: center; width: 38px; height: 38px; border: 1px solid #efe4d3; border-radius: 11px; color: #aa8049; background: #fbf6ec; font-size: 17px; }
.report-strip-copy { display: flex; flex: 1; flex-direction: column; gap: 4px; }
.report-strip-copy strong { color: #354a59; font-size: 13px; }
.report-strip-copy span { color: #98a4a9; font-size: 10px; }
.report-strip-total { display: flex; flex-direction: column; align-items: flex-end; gap: 2px; padding-left: 20px; border-left: 1px solid #e8ecec; }
.report-strip-total span { color: #97a3a9; font-size: 9px; }
.report-strip-total strong { color: #30495a; font-family: Georgia,serif; font-size: 20px; font-weight: 600; letter-spacing: -.02em; }
.report-strip-total small { color: #8b999f; font-family: inherit; font-size: 10px; font-weight: 400; }
.refresh-button { width: 31px; height: 31px; margin-left: 3px; color: #8999a2; }
.refresh-button:hover { color: #a77a3f; background: #f8f2e8; }
.charts-grid { display: grid; grid-template-columns: minmax(0,1.42fr) minmax(330px,.88fr); gap: 19px; transition: opacity 220ms ease; }
.charts-grid.is-refreshing { opacity: .64; pointer-events: none; }
.chart-card { min-width: 0; min-height: 440px; border: 1px solid #e2e8e9; border-radius: 13px; background: rgba(255,255,255,.94); box-shadow: 0 7px 25px rgba(30,52,68,.035); }
.chart-card :deep(.el-card__body) { height: 100%; box-sizing: border-box; padding: 22px 23px 17px; }
.chart-card-heading { display: flex; justify-content: space-between; align-items: flex-start; }
.chart-kicker { color: #a0aaae; font-size: 8px; letter-spacing: .17em; }
.chart-card-heading h2 { margin: 6px 0 4px; color: #2d4353; font-size: 16px; }
.chart-card-heading p { margin: 0; color: #9aa6ac; font-size: 10px; }
.chart-index { color: #c3a779; font-family: Georgia,serif; font-size: 17px; }
.chart-canvas { width: 100%; }
.bar-canvas { height: 320px; margin-top: 16px; }
.chart-footnote { display: flex; align-items: center; gap: 7px; padding-top: 11px; border-top: 1px solid #eff1f1; color: #89989f; font-size: 9px; }
.legend-swatch { width: 8px; height: 8px; border-radius: 2px; background: #c58a43; }
.footnote-hint { margin-left: auto; color: #a5afb3; }
.composition-card :deep(.el-card__body) { display: flex; flex-direction: column; }
.donut-wrap { position: relative; width: min(100%,270px); height: 250px; margin: 4px auto 0; }
.donut-canvas { height: 100%; }
.donut-center { position: absolute; top: 50%; left: 50%; display: flex; align-items: center; flex-direction: column; gap: 2px; transform: translate(-50%,-50%); pointer-events: none; }
.donut-center span { color: #9aa6ab; font-size: 9px; }
.donut-center strong { color: #304758; font-family: Georgia,serif; font-size: 24px; font-weight: 600; letter-spacing: -.04em; }
.donut-center small { color: #a2adb1; font-size: 9px; }
.composition-legend { display: grid; grid-template-columns: 1fr 1fr; gap: 9px 14px; margin-top: auto; padding-top: 13px; border-top: 1px solid #eff1f1; }
.legend-item { display: flex; min-width: 0; align-items: center; gap: 6px; color: #7e8e97; font-size: 9px; }
.legend-dot { flex: 0 0 7px; width: 7px; height: 7px; border-radius: 2px; }
.legend-name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.legend-item strong { color: #536978; font-size: 9px; font-weight: 600; }
.legend-more { grid-column: 1 / -1; color: #a1acb0; font-size: 9px; }
.state-card { display: flex; min-height: 340px; align-items: center; justify-content: center; flex-direction: column; padding: 28px; border: 1px solid #e4e9ea; border-radius: 13px; background: rgba(255,255,255,.88); text-align: center; }
.state-card strong { margin-top: 12px; color: #354a59; font-size: 14px; }
.state-card p { max-width: 440px; margin: 7px 0 17px; color: #96a2a8; font-size: 11px; line-height: 1.7; }
.loading-state { gap: 11px; color: #8b999f; font-size: 11px; }
.state-spinner { color: #b1844a; font-size: 21px; animation: spin 1.1s linear infinite; }
.state-icon { display: grid; width: 42px; height: 42px; place-items: center; border-radius: 13px; font-size: 18px; }
.error-icon { color: #b96553; background: #fbece8; }
.empty-orbit { display: grid; width: 66px; height: 66px; place-items: center; border: 1px solid #e9e2d6; border-radius: 50%; color: #b18b55; background: radial-gradient(circle,#fbf6eb,#fff 72%); font-size: 25px; box-shadow: 0 0 0 8px rgba(236,228,214,.2); }
.dashboard-footer { display: flex; align-items: center; gap: 9px; margin-top: 18px; color: #9ca8ad; font-size: 9px; }
.footer-rule { width: 22px; height: 1px; background: #d4b579; }
.footer-year { margin-left: auto; color: #aab4b8; font-size: 8px; letter-spacing: .16em; }
@keyframes dashboard-enter { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
@keyframes spin { to { transform: rotate(360deg); } }
@media (max-width: 980px) { .charts-grid { grid-template-columns: 1fr; } .chart-card { min-height: 400px; } .composition-card { min-height: 440px; } }
@media (max-width: 560px) { .dashboard-heading { align-items: flex-start; flex-direction: column; gap: 15px; } .report-strip { gap: 9px; padding: 12px; } .report-strip-total { padding-left: 10px; } .report-strip-total strong { font-size: 16px; } .report-strip-copy span { max-width: 150px; line-height: 1.5; } .chart-card :deep(.el-card__body) { padding: 19px 15px 15px; } .bar-canvas { height: 300px; } .donut-wrap { height: 230px; } .composition-legend { gap: 9px; } }
</style>
