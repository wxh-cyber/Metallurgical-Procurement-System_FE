import http from './http'

// 采购订单（分页、详情、手工创建、确认、关闭）
export const listOrders = (params) => http.get('/orders/page', { params })
export const getOrder = (id) => http.get('/orders/' + id)
export const createOrder = (payload) => http.post('/orders', payload)
export const confirmOrder = (id) => http.post('/orders/' + id + '/confirm')
export const closeOrder = (id) => http.post('/orders/' + id + '/close')
