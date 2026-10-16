import test from 'node:test'
import assert from 'node:assert/strict'
import { buildPurchaseQuantityIndex, createMaterialPayload, getPurchaseQuantity, normalizePurchaseQuantity } from '../src/utils/materialQuantity.js'

test('empty purchase quantity is normalized to zero', () => {
  assert.equal(normalizePurchaseQuantity(''), 0)
  assert.equal(normalizePurchaseQuantity(null), 0)
  assert.equal(createMaterialPayload({ purchaseQuantity: '' }).purchaseQuantity, 0)
})

test('material payload includes purchase quantity as a number', () => {
  const payload = createMaterialPayload({ materialCode: 'ORE-1', materialName: '铁矿', category: '矿石', unit: '吨', purchaseQuantity: '12.5' })

  assert.deepEqual(payload, { materialCode: 'ORE-1', materialName: '铁矿', category: '矿石', unit: '吨', purchaseQuantity: 12.5 })
})

test('purchase quantity accepts non-negative values with at most two decimals', () => {
  assert.equal(normalizePurchaseQuantity('12.34'), 12.34)
  assert.throws(() => normalizePurchaseQuantity(-1), /非负/)
  assert.throws(() => normalizePurchaseQuantity(1.234), /两位小数/)
})

test('purchase quantity index supports material id and code matching', () => {
  const index = buildPurchaseQuantityIndex([
    { materialId: 7, materialCode: 'ORE-7', quantity: 12.5 },
    { materialCode: 'ORE-8', purchaseQuantity: 3 }
  ])

  assert.equal(getPurchaseQuantity({ id: 7, materialCode: 'ORE-7' }, index), 12.5)
  assert.equal(getPurchaseQuantity({ id: 8, materialCode: 'ORE-8' }, index), 3)
  assert.equal(getPurchaseQuantity({ id: 9, materialCode: 'ORE-9' }, index), 0)
})
