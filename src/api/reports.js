import http from './http'

export const getPurchaseReport = (params) => http.get('/reports/purchase', { params })
