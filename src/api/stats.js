import http from './http'

// 仪表盘与统计报表
export const getDashboard = () => http.get('/stats/dashboard')
export const purchaseByMaterial = () => http.get('/stats/purchase-by-material')
export const supplierAmount = () => http.get('/stats/supplier-amount')
export const monthlyAmount = () => http.get('/stats/monthly-amount')
export const inspectRate = () => http.get('/stats/inspect-rate')
