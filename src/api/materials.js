import http from './http'
export const listMaterials = (params) => http.get('/materials', { params })
export const createMaterial = (payload) => http.post('/materials', payload)
export const updateMaterial = (id, payload) => http.put('/materials/' + id, payload)
export const deleteMaterial = (id) => http.delete('/materials/' + id)
