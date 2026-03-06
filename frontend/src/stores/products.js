import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/services/api'

export const useProductStore = defineStore('products', () => {
  const products = ref([])
  const alerts = ref([])
  const loading = ref(false)

  async function fetchAll(params = {}) {
    loading.value = true
    try {
      const { data } = await api.get('/products', { params })
      products.value = data.data
    } finally {
      loading.value = false
    }
  }

  async function fetchAlerts() {
    const { data } = await api.get('/products/alerts')
    alerts.value = data.data
    return data.data
  }

  async function create(payload) {
    const { data } = await api.post('/products', payload)
    products.value.push(data.data)
    return data.data
  }

  async function update(id, payload) {
    const { data } = await api.put(`/products/${id}`, payload)
    const idx = products.value.findIndex(p => p.id === id)
    if (idx !== -1) products.value[idx] = data.data
    return data.data
  }

  async function remove(id) {
    await api.delete(`/products/${id}`)
    products.value = products.value.filter(p => p.id !== id)
  }

  async function adjustStock(id, payload) {
    const { data } = await api.post(`/products/${id}/stock`, payload)
    const idx = products.value.findIndex(p => p.id === id)
    if (idx !== -1) products.value[idx] = data.data
    return data.data
  }

  return { products, alerts, loading, fetchAll, fetchAlerts, create, update, remove, adjustStock }
})
