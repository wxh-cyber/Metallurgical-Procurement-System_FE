import http from './http'

// 到货检验（分页、详情、新增、人工修正结果）
export const listInspects = (params) => http.get('/inspects/page', { params })
export const getInspect = (id) => http.get('/inspects/' + id)
export const createInspect = (payload) => http.post('/inspects', payload)
export const updateInspectResult = (id, result) => http.put('/inspects/' + id + '/result', { result })
