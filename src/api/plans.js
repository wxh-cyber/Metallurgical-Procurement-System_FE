import http from './http'

// 采购计划（分页、新增、提交审批、审批、转订单）
export const listPlans = (params) => http.get('/plans/page', { params })
export const getPlan = (id) => http.get('/plans/' + id)
export const createPlan = (payload) => http.post('/plans', payload)
export const submitPlan = (id) => http.post('/plans/' + id + '/submit')
export const approvePlan = (id, payload) => http.post('/plans/' + id + '/approve', payload)
export const createOrderFromPlan = (id, payload) => http.post('/plans/' + id + '/order', payload)
