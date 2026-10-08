import { defineStore } from 'pinia'
import { getCurrentUser, login as loginRequest, logout as logoutRequest } from '../api/auth'
const TOKEN_KEY = 'token'
export const useUserStore = defineStore('user', {
  state: () => ({ user: null, token: localStorage.getItem(TOKEN_KEY), initialized: false }),
  getters: { roles: (state) => state.user?.roles || (state.user?.role ? [state.user.role] : []), permissions: (state) => state.user?.permissions || [] },
  actions: {
    setSession (token, user) { this.token = token; this.user = user; localStorage.setItem(TOKEN_KEY, token) },
    clear () { this.user = null; this.token = null; localStorage.removeItem(TOKEN_KEY) },
    async signIn (payload) { const response = await loginRequest(payload); const data = response?.data || {}; if (!data.token) throw new Error(response?.msg || '登录接口未返回 token'); this.setSession(data.token, data.user || null); return data },
    async restore () { if (!this.token) { this.initialized = true; return null }; try { const response = await getCurrentUser(); this.user = response?.data?.user || response?.data || null; return this.user } catch (error) { this.clear(); throw error } finally { this.initialized = true } },
    async signOut () { try { if (this.token) await logoutRequest() } finally { this.clear() } },
    can (permission) { return this.roles.includes('ADMIN') || this.permissions.includes(permission) }
  }
})
