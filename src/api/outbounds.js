import http from './http'

// 领用出库（分页、详情、新增）
export const listOutbounds = (params) => http.get('/outbounds/page', { params })
export const getOutbound = (id) => http.get('/outbounds/' + id)
export const createOutbound = (payload) => http.post('/outbounds', payload)
