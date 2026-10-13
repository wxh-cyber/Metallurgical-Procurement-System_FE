import http from './http'
export const login = (payload) => http.post('/auth/login', payload)
export const register = ({ username, email, password }) => http.post('/auth/register', {
  username: username?.trim(),
  email: email?.trim(),
  password
})
export const getCurrentUser = () => http.get('/auth/me')
export const logout = () => http.post('/auth/logout')
