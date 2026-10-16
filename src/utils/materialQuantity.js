export function normalizePurchaseQuantity (value) {
  if (value == null || value === '') return 0

  const quantity = Number(value)
  if (!Number.isFinite(quantity) || quantity < 0) throw new Error('采购数量必须为非负数。')
  if (Math.abs(quantity * 100 - Math.round(quantity * 100)) > 1e-8) throw new Error('采购数量最多保留两位小数。')

  return quantity
}

export function buildPurchaseQuantityIndex (rows) {
  if (!Array.isArray(rows)) throw new Error('采购报表返回格式无法识别。')

  const index = {}
  rows.forEach(row => {
    const quantity = Number(row?.quantity ?? row?.purchaseQuantity ?? row?.totalQuantity)
    if (!Number.isFinite(quantity) || quantity < 0) return

    const materialId = row?.materialId ?? row?.id
    const materialCode = row?.materialCode ?? row?.code
    if (materialId != null) index['id:' + materialId] = (index['id:' + materialId] || 0) + quantity
    if (materialCode) index['code:' + materialCode] = (index['code:' + materialCode] || 0) + quantity
  })
  return index
}

export function getPurchaseQuantity (material, index) {
  return index['id:' + material.id] ?? index['code:' + material.materialCode] ?? 0
}

export function createMaterialPayload (form) {
  return {
    materialCode: form.materialCode,
    materialName: form.materialName,
    category: form.category,
    unit: form.unit,
    purchaseQuantity: normalizePurchaseQuantity(form.purchaseQuantity)
  }
}
