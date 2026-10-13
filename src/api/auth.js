import http from './http'

// 账号密码登录，后端签发 JWT
export const login = (payload) => http.post('/auth/login', payload)
