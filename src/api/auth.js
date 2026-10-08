import http from './http'
export const login = (payload) => http.post('/auth/login', payload)
export const register = (payload) => http.post('/auth/register', payload)
export const getCurrentUser = () => http.get('/auth/me')
export const logout = () => http.post('/auth/logout')
