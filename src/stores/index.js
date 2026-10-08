import { defineStore } from 'pinia'
export const useUserStore = defineStore('user', { state: () => ({ user: null, token: localStorage.getItem('token') }), actions: { clear () { this.user = null; this.token = null; localStorage.removeItem('token') } } })
