import http from './http'

// 物料档案（分页、新增、编辑、删除）
export const listMaterials = (params) => http.get('/materials/page', { params })
export const getMaterial = (id) => http.get('/materials/' + id)
export const createMaterial = (payload) => http.post('/materials', payload)
export const updateMaterial = (id, payload) => http.put('/materials/' + id, payload)
export const deleteMaterial = (id) => http.delete('/materials/' + id)
