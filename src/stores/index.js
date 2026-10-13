import { defineStore } from 'pinia'
import { login as loginRequest } from '../api/auth'

const TOKEN_KEY = 'token'
const USER_KEY = 'user'

export const useUserStore = defineStore('user', {
  state: () => ({
    user: null,
    token: localStorage.getItem(TOKEN_KEY)
  }),
  getters: {
    role: (state) => state.user?.role || '',
    realName: (state) => state.user?.realName || state.user?.username || '',
    isAdmin: (state) => state.user?.role === 'ADMIN'
  },
  actions: {
    // 登录成功后写入 token 与用户信息
    setSession (token, user) {
      this.token = token
      this.user = user || null
      localStorage.setItem(TOKEN_KEY, token)
      if (user) localStorage.setItem(USER_KEY, JSON.stringify(user))
    },
    // 页面刷新时从本地恢复用户信息（token 已由后端签发，无需再次请求）
    restore () {
      const raw = localStorage.getItem(USER_KEY)
      if (raw) {
        try { this.user = JSON.parse(raw) } catch (e) { this.user = null }
      }
      return this.user
    },
    clear () {
      this.user = null
      this.token = null
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
    },
    async signIn (payload) {
      const res = await loginRequest(payload)
      const data = res.data
      if (!data || !data.token) throw new Error(res.msg || '登录接口未返回 token')
      this.setSession(data.token, data.user || null)
      return data
    },
    async signOut () {
      this.clear()
    }
  }
})
