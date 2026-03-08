import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'

const BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('access_token') || null)
  const refreshToken = ref(localStorage.getItem('refresh_token') || null)
  const user = ref(JSON.parse(localStorage.getItem('user') || 'null'))

  const isLoggedIn = computed(() => !!token.value)
  const isPro = computed(() => user.value?.plan === 'pro')
  const isTrial = computed(() => user.value?.plan === 'trial')

  const trialDaysLeft = computed(() => {
    if (!user.value?.trial_end) return 0
    const diff = new Date(user.value.trial_end) - new Date()
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
  })

  async function login(email, password) {
    const { data } = await axios.post(`${BASE}/auth/login`, { email, password })
    setSession(data.data)
    await fetchMe()      // fetch full profile (incl. plan) right after login
    return data.data
  }

  async function register(payload) {
    const { data } = await axios.post(`${BASE}/auth/register`, payload)
    return data
  }

  async function fetchMe() {
    const { data } = await axios.get(`${BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${token.value}` }
    })
    user.value = data.data
    localStorage.setItem('user', JSON.stringify(data.data))
    return data.data
  }

  async function refreshAccessToken() {
    const { data } = await axios.post(`${BASE}/auth/refresh`, { refreshToken: refreshToken.value })
    token.value = data.data.accessToken
    localStorage.setItem('access_token', token.value)
  }

  function setSession({ accessToken, refreshToken: rt, user: u }) {
    token.value = accessToken
    refreshToken.value = rt
    user.value = u
    localStorage.setItem('access_token', accessToken)
    localStorage.setItem('refresh_token', rt)
    localStorage.setItem('user', JSON.stringify(u))
  }

  function logout() {
    token.value = null
    refreshToken.value = null
    user.value = null
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user')
  }

  return { token, refreshToken, user, isLoggedIn, isPro, isTrial, trialDaysLeft, login, register, fetchMe, refreshAccessToken, logout }
})
