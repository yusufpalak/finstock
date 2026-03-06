import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/services/api'

export const useTransactionStore = defineStore('transactions', () => {
  const transactions = ref([])
  const loading = ref(false)
  const cashflow = ref([])
  const profitability = ref(null)

  async function fetchAll(filters = {}) {
    loading.value = true
    try {
      const { data } = await api.get('/transactions', { params: filters })
      transactions.value = data.data
    } finally {
      loading.value = false
    }
  }

  async function create(payload) {
    const { data } = await api.post('/transactions', payload)
    transactions.value.unshift(data.data)
    return data.data
  }

  async function update(id, payload) {
    const { data } = await api.put(`/transactions/${id}`, payload)
    const idx = transactions.value.findIndex(t => t.id === id)
    if (idx !== -1) transactions.value[idx] = data.data
    return data.data
  }

  async function remove(id) {
    await api.delete(`/transactions/${id}`)
    transactions.value = transactions.value.filter(t => t.id !== id)
  }

  async function fetchCashflow(params = {}) {
    const { data } = await api.get('/transactions/summary/cashflow', { params })
    cashflow.value = data.data
    return data.data
  }

  async function fetchProfitability(params = {}) {
    const { data } = await api.get('/transactions/summary/profitability', { params })
    profitability.value = data.data
    return data.data
  }

  return { transactions, loading, cashflow, profitability, fetchAll, create, update, remove, fetchCashflow, fetchProfitability }
})
