import http from './http'

// 库存台账与预警
export const listInventory = (params) => http.get('/inventory/page', { params })
export const listWarnings = () => http.get('/inventory/warnings')
