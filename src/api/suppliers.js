import http from './http'

// 供应商管理（分页、新增、编辑、启停）
export const listSuppliers = (params) => http.get('/suppliers/page', { params })
export const getSupplier = (id) => http.get('/suppliers/' + id)
export const createSupplier = (payload) => http.post('/suppliers', payload)
export const updateSupplier = (id, payload) => http.put('/suppliers/' + id, payload)
export const updateSupplierStatus = (id, status) => http.patch('/suppliers/' + id + '/status', null, { params: { status } })
