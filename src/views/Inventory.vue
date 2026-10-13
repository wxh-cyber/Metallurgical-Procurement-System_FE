<template>
  <section>
    <div class="page-head">
      <div><h2>库存台账</h2><p>当前库存与安全库存对比，低于安全库存整行标红预警。</p></div>
      <el-button @click="load">刷新</el-button>
    </div>

    <el-card shadow="never">
      <el-form inline @submit.prevent="load">
        <el-form-item>
          <el-input v-model="query.keyword" placeholder="搜索物料名称/编码" clearable style="width: 220px" @clear="load" />
        </el-form-item>
        <el-button type="primary" @click="load">查询</el-button>
        <el-tag type="danger" effect="plain" class="tip-tag">红色行表示库存低于安全库存，请及时提交采购计划</el-tag>
      </el-form>

      <el-table
        v-loading="loading"
        :data="rows"
        :row-class-name="rowClass"
        empty-text="暂无库存数据"
      >
        <el-table-column prop="materialCode" label="物料编码" width="140" />
        <el-table-column prop="materialName" label="物料名称" min-width="140" />
        <el-table-column prop="unit" label="单位" width="80" />
        <el-table-column label="当前库存" width="130">
          <template #default="{ row }">
            <span :class="{ 'stock-warn': row.warning }">{{ row.quantity }}</span>
          </template>
        </el-table-column>
        <el-table-column label="安全库存" width="130">
          <template #default="{ row }">{{ row.safetyStock }}</template>
        </el-table-column>
        <el-table-column label="预警状态" width="120">
          <template #default="{ row }">
            <el-tag v-if="row.warning" type="danger" size="small">库存预警</el-tag>
            <el-tag v-else type="success" size="small">正常</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="缺口(吨)" width="120">
          <template #default="{ row }">
            <span v-if="row.warning" class="gap">{{ row.shortage }}</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="建议" min-width="200">
          <template #default="{ row }">
            <span v-if="row.warning" class="advice">建议该车间提交采购计划</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="最近更新时间" width="170">
          <template #default="{ row }">{{ formatTime(row.updateTime) }}</template>
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
  </section>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { listInventory } from '../api/inventory'

const rows = ref([])
const total = ref(0)
const loading = ref(false)
const query = reactive({ pageNum: 1, pageSize: 10, keyword: '' })

function formatTime (value) {
  if (!value) return '-'
  return String(value).replace('T', ' ').slice(0, 16)
}

// 预警行标红
function rowClass ({ row }) {
  return row.warning ? 'warning-row' : ''
}

async function load () {
  loading.value = true
  try {
    const res = await listInventory(query)
    rows.value = res.data?.records || []
    total.value = res.data?.total || 0
  } catch (e) { /* 错误提示已由拦截器统一处理 */ } finally { loading.value = false }
}

onMounted(load)
</script>

<style scoped>
.tip-tag { margin-left: 12px; vertical-align: middle; }
.stock-warn { color: #f56c6c; font-weight: 700; }
.gap { color: #e6a23c; font-weight: 700; }
.advice { color: #e6a23c; }
</style>

<style>
.el-table .warning-row { --el-table-tr-bg-color: #fef0f0; }
</style>
