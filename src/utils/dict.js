/**
 * 全局字典与工具函数：状态文案、标签类型、物料类别、自动判定逻辑。
 * 自动判定逻辑与后端 InspectService.judge 保持一致。
 */

// 物料类别
export const CATEGORY_DICT = {
  IRON_ORE: '铁矿',
  COKE: '焦炭',
  FLUX: '熔剂',
  SCRAP: '废钢',
  FERROALLOY: '铁合金',
  REFRACTORY: '耐火材料'
}

// 采购计划状态
export const PLAN_STATUS_DICT = {
  DRAFT: { text: '草稿', type: 'info' },
  PENDING: { text: '待审批', type: 'warning' },
  APPROVED: { text: '已审批', type: 'success' },
  CONVERTED: { text: '已转订单', type: 'primary' },
  REJECTED: { text: '已驳回', type: 'danger' }
}

// 采购订单状态
export const ORDER_STATUS_DICT = {
  CREATED: { text: '已下单', type: 'primary' },
  CONFIRMED: { text: '已确认', type: 'success' },
  PARTIAL: { text: '部分到货', type: 'warning' },
  ARRIVED: { text: '全部到货', type: 'info' },
  COMPLETED: { text: '已入库', type: 'success' },
  CLOSED: { text: '已关闭', type: 'danger' }
}

// 检验结果
export const INSPECT_RESULT_DICT = {
  QUALIFIED: { text: '合格', type: 'success' },
  DOWNGRADED: { text: '让步接收', type: 'warning' },
  UNQUALIFIED: { text: '不合格', type: 'danger' }
}

// 供应商状态：1 合作中，0 暂停
export const SUPPLIER_STATUS_DICT = {
  1: { text: '合作中', type: 'success' },
  0: { text: '已暂停', type: 'info' }
}

// 角色
export const ROLE_DICT = {
  ADMIN: '管理员',
  PROCUREMENT: '采购员',
  INSPECTOR: '质检员',
  WAREHOUSE: '库管员'
}

// 标签类型映射（primary 对应 Element Plus 默认类型，不传 type 避免 prop 校验警告）
export const tagType = (type) => (type === 'primary' ? undefined : type)

/**
 * 根据物料标准与实测值自动判定检验结果（与后端一致）：
 * - 全部达标 -> QUALIFIED
 * - 主成分 >= 要求 95% 且硫/磷不超标 -> DOWNGRADED
 * - 其余 -> UNQUALIFIED
 * @param material 物料档案（mainIndexRequired / sMax / pMax / granularity）
 * @param form 实测值（mainIndexActual / sActual / pActual / granularityOk）
 * @returns {string} QUALIFIED | DOWNGRADED | UNQUALIFIED
 */
export function judgeResult (material, form) {
  if (!material) return ''
  const toNum = (v) => (v === null || v === undefined || v === '' ? null : Number(v))
  const main = toNum(material.mainIndexRequired)
  const sMax = toNum(material.sMax)
  const pMax = toNum(material.pMax)
  const mainActual = toNum(form.mainIndexActual)
  const sActual = toNum(form.sActual)
  const pActual = toNum(form.pActual)

  const sOk = sMax === null || (sActual !== null && sActual <= sMax)
  const pOk = pMax === null || (pActual !== null && pActual <= pMax)
  const mainOk = main === null || (mainActual !== null && mainActual >= main)
  const granularityOk = !material.granularity || Number(form.granularityOk) === 1

  if (mainOk && sOk && pOk && granularityOk) return 'QUALIFIED'

  const threshold = main === null ? null : main * 0.95
  const downgradeMain = main === null || (mainActual !== null && mainActual >= threshold)
  if (downgradeMain && sOk && pOk) return 'DOWNGRADED'
  return 'UNQUALIFIED'
}

// 数字保留位数处理（避免浮点显示问题）
export const fmtNum = (value, digits = 2) => {
  if (value === null || value === undefined || value === '') return ''
  const n = Number(value)
  if (Number.isNaN(n)) return ''
  return n.toFixed(digits).replace(/\.?0+$/, '')
}
