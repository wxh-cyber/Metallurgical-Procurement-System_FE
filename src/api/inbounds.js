import http from './http'

// 入库管理（分页、详情、从检验单生成入库单）
export const listInbounds = (params) => http.get('/inbounds/page', { params })
export const getInbound = (id) => http.get('/inbounds/' + id)
export const createInbound = (payload) => http.post('/inbounds', payload)
