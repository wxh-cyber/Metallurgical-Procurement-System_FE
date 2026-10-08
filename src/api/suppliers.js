import http from './http'
export const listSuppliers = (params) => http.get('/suppliers', { params })
export const createSupplier = (payload) => http.post('/suppliers', payload)
export const updateSupplier = (id, payload) => http.put('/suppliers/' + id, payload)
export const updateSupplierStatus = (id, status) => http.patch('/suppliers/' + id + '/status', { status })
