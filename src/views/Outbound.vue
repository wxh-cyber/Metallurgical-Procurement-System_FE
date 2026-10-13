<template>
  <section>
    <div class="page-head">
      <div><h2>领用出库</h2><p>车间/高炉领料出库，出库后扣减库存。</p></div>
      <el-button v-if="canOutbound" type="primary" @click="openCreate">新增出库</el-button>
    </div>

    <el-card shadow="never">
      <!-- 搜索：出库单号 + 物料 -->
      <el-form inline @submit.prevent="load">
        <el-form-item>
          <el-input v-model="query.keyword" placeholder="搜索出库单号" clearable style="width: 190px" @clear="load" />
        </el-form-item>
        <el-form-item>
          <el-select v-model="query.materialId" placeholder="全部物料" clearable filterable style="width: 190px" @change="load">
            <el-option v-for="m in materials" :key="m.id" :label="m.materialName" :value="m.id" />
          </el-select>
        </el-form-item>
        <el-button type="primary" @click="load">查询</el-button>
      </el-form>

      <el-table v-loading="loading" :data="rows" empty-text="暂无出库记录">
        <el-table-column prop="outCode" label="出库单号" width="150" />
        <el-table-column prop="materialCode" label="物料编码" width="130" />
        <el-table-column prop="materialName" label="物料名称" min-width="120" />
        <el-table-column label="出库数量(吨)" width="120">
          <template #default="{ row }">{{ row.quantity }}</template>
        </el-table-column>
        <el-table-column prop="dept" label="领用部门/高炉" min-width="120" />
        <el-table-column label="出库时间" width="160">
          <template #default="{ row }">{{ formatTime(row.outTime) }}</template>
        </el-table-column>
        <el-table-column prop="operator" label="操作人" width="90" />
        <el-table-column prop="remark" label="备注" min-width="120">
          <template #default="{ row }">{{ row.remark || '-' }}</template>
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

    <!-- 新增出库弹窗 -->
    <el-dialog v-model="createVisible" title="新增领用出库" width="500px" destroy-on-close>
      <el-form ref="createRef" :model="createForm" :rules="createRules" label-width="110px">
        <el-form-item label="领用物料" prop="materialId">
          <el-select v-model="createForm.materialId" placeholder="请选择物料" filterable style="width: 100%" @change="onMaterialChange">
            <el-option v-for="m in materials" :key="m.id" :label="`${m.materialName}（${m.materialCode}）`" :value="m.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="当前库存">
          <span class="stock" :class="{ low: stockOf(createForm.materialId) < Number(createForm.quantity || 0) }">
            {{ stockOf(createForm.materialId) }} 吨
          </span>
        </el-form-item>
        <el-form-item label="出库数量(吨)" prop="quantity">
          <el-input-number v-model="createForm.quantity" :min="0.01" :precision="2" :max="stockOf(createForm.materialId)" style="width: 100%" />
        </el-form-item>
        <el-form-item label="领用部门" prop="dept">
          <el-input v-model="createForm.dept" placeholder="如：炼铁一车间 / 3号高炉" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="createForm.remark" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="saveCreate">出库</el-button>
      </template>
    </el-dialog>
  </section>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { listOutbounds, createOutbound } from '../api/outbounds'
import { listMaterials } from '../api/materials'
import { listInventory } from '../api/inventory'
import { useUserStore } from '../stores'

const userStore = useUserStore()
const canOutbound = userStore.isAdmin || userStore.role === 'WAREHOUSE'

const rows = ref([])
const total = ref(0)
const loading = ref(false)
const saving = ref(false)
const materials = ref([])
const stockMap = ref({})
const query = reactive({ pageNum: 1, pageSize: 10, keyword: '', materialId: null })

const createVisible = ref(false)
const createRef = ref()
const createForm = reactive({ materialId: null, quantity: null, dept: '', remark: '' })
const createRules = {
  materialId: [{ required: true, message: '请选择领用物料', trigger: 'change' }],
  quantity: [{ required: true, message: '请输入出库数量', trigger: 'blur' }],
  dept: [{ required: true, message: '请输入领用部门', trigger: 'blur' }]
}

function formatTime (value) {
  if (!value) return '-'
  return String(value).replace('T', ' ').slice(0, 16)
}

// 当前库存（吨）
function stockOf (materialId) {
  return Number(stockMap.value[materialId] ?? 0)
}

async function load () {
  loading.value = true
  try {
    const res = await listOutbounds(query)
    rows.value = res.data?.records || []
    total.value = res.data?.total || 0
  } catch (e) { /* 错误提示已由拦截器统一处理 */ } finally { loading.value = false }
}

async function loadMaterials () {
  const res = await listMaterials({ pageNum: 1, pageSize: 100 }).catch(() => ({ data: { records: [] } }))
  materials.value = res.data?.records || []
}

// 加载库存映射（物料 -> 当前库存）
async function loadStock () {
  const res = await listInventory({ pageNum: 1, pageSize: 100 }).catch(() => ({ data: { records: [] } }))
  const map = {}
  ;(res.data?.records || []).forEach((item) => { map[item.materialId] = item.quantity })
  stockMap.value = map
}

function onMaterialChange () {
  createForm.quantity = null
}

function openCreate () {
  Object.assign(createForm, { materialId: null, quantity: null, dept: '', remark: '' })
  createVisible.value = true
}

async function saveCreate () {
  const ok = await createRef.value.validate().catch(() => false)
  if (!ok) return
  // 前端校验出库数量不得超过当前库存
  if (Number(createForm.quantity) > stockOf(createForm.materialId)) {
    ElMessage.error(`库存不足，当前库存仅 ${stockOf(createForm.materialId)} 吨`)
    return
  }
  saving.value = true
  try {
    const res = await createOutbound(createForm)
    ElMessage.success(`出库单 ${res.data?.outCode || ''} 生成成功`)
    createVisible.value = false
    load(); loadStock()
  } catch (e) { /* 错误提示已由拦截器统一处理 */ } finally { saving.value = false }
}

onMounted(() => { load(); loadMaterials(); loadStock() })
</script>

<style scoped>
.stock { font-weight: 700; color: #67c23a; }
.stock.low { color: #f56c6c; }
</style>
