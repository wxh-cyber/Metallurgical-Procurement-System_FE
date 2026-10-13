import axios from 'axios'
import { ElMessage } from 'element-plus'

// Axios 实例：统一 /api 前缀，请求自动携带 JWT，响应统一处理后端返回结构
const http = axios.create({ baseURL: '/api', timeout: 15000 })

// 请求拦截：附加 Bearer Token
http.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// 清空登录态并跳转登录页
function toLogin() {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  if (!window.location.pathname.startsWith('/login')) {
    window.location.href = '/login'
  }
}

// 响应拦截：
// 后端业务异常（HTTP 200，body.code != 200）与鉴权异常（HTTP 401/403）统一在此提示
http.interceptors.response.use(
  (response) => {
    const body = response.data
    // 非统一结构直接透传
    if (!body || body.code === undefined) return body
    if (body.code === 200) return body
    if (body.code === 401) {
      toLogin()
      ElMessage.error(body.msg || '登录已失效，请重新登录')
      return Promise.reject(body)
    }
    ElMessage.error(body.msg || '操作失败')
    return Promise.reject(body)
  },
  (error) => {
    const status = error.response?.status
    const msg = error.response?.data?.msg || error.message || '网络异常'
    if (status === 401) {
      toLogin()
      ElMessage.error(msg || '登录已失效，请重新登录')
    } else if (status !== 403 || error.config?.show403 !== false) {
      ElMessage.error(msg)
    }
    return Promise.reject(error)
  }
)

export default http
