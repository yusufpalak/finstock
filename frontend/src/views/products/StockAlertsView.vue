<template>
  <div class="alerts-page">
    <div class="page-header">
      <h1 class="page-title">⚠️ {{ t('products.alerts_title') }}</h1>
      <RouterLink :to="{ name: 'products', params: { locale } }" class="btn btn-secondary">← {{ t('products.title') }}</RouterLink>
    </div>

    <div v-if="loading" class="loading">{{ t('common.loading') }}</div>
    <div v-else-if="!alerts.length" class="empty-state">
      <span class="empty-icon">✅</span>
      <p>{{ t('products.no_alerts') }}</p>
    </div>

    <div v-else class="alerts-grid">
      <div v-for="product in alerts" :key="product.id" class="alert-card">
        <div class="alert-header">
          <span class="alert-badge">⚠️ Critical</span>
          <span class="product-name">{{ product.name }}</span>
        </div>
        <div class="alert-stats">
          <div class="stat">
            <span class="stat-label">{{ t('products.current_stock') }}</span>
            <span class="stat-value critical">{{ product.stock_quantity }} {{ product.unit }}</span>
          </div>
          <div class="stat">
            <span class="stat-label">{{ t('products.threshold') }}</span>
            <span class="stat-value">{{ product.stock_alert_threshold }} {{ product.unit }}</span>
          </div>
          <div class="stat">
            <span class="stat-label">{{ t('products.sku') }}</span>
            <span class="stat-value">{{ product.sku || '-' }}</span>
          </div>
        </div>
        <button class="btn-restock" @click="openRestock(product)">📦 {{ t('products.restock') }}</button>
      </div>
    </div>

    <!-- Restock Modal -->
    <div v-if="restocking" class="modal-overlay" @click.self="restocking = null">
      <div class="modal">
        <h2>{{ t('products.restock') }}: {{ restocking.name }}</h2>
        <div class="form-group">
          <label>{{ t('products.quantity_to_add') }}</label>
          <input v-model.number="restockQty" type="number" min="1" />
        </div>
        <div class="modal-actions">
          <button @click="restocking = null" class="btn-cancel">{{ t('common.cancel') }}</button>
          <button @click="confirmRestock" class="btn-confirm">{{ t('common.confirm') }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useProductStore } from '@/stores/products'

const { t, locale } = useI18n()
const store = useProductStore()
const alerts = ref([])
const loading = ref(true)
const restocking = ref(null)
const restockQty = ref(10)

onMounted(async () => {
  try { alerts.value = await store.fetchAlerts() }
  finally { loading.value = false }
})

function openRestock(product) { restocking.value = product; restockQty.value = 10 }

async function confirmRestock() {
  await store.adjustStock(restocking.value.id, { type: 'in', quantity: restockQty.value, notes: 'Manual restock' })
  alerts.value = await store.fetchAlerts()
  restocking.value = null
}
</script>

<style scoped>
.alerts-page { max-width: 1200px; color: var(--text-main); }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.page-title { font-size: 24px; font-weight: 700; color: var(--text-main); }
.btn { padding: 8px 16px; border-radius: 8px; border: none; cursor: pointer; font-size: 14px; font-weight: 500; text-decoration: none; background: var(--bg-app); color: var(--text-main); border: 1px solid var(--border-color); }
.empty-state { text-align: center; padding: 80px; color: var(--text-muted); }
.empty-icon { font-size: 48px; display: block; margin-bottom: 12px; }
.alerts-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
.alert-card { background: var(--bg-card); border-radius: 12px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); border-top: 3px solid #f59e0b; color: var(--text-main); }
.alert-header { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; }
.alert-badge { background: #fef3c7; color: #92400e; padding: 3px 10px; border-radius: 99px; font-size: 12px; font-weight: 600; }
.product-name { font-weight: 600; font-size: 15px; }
.alert-stats { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-bottom: 16px; }
.stat { display: flex; flex-direction: column; gap: 2px; }
.stat-label { font-size: 11px; color: var(--text-muted); text-transform: uppercase; }
.stat-value { font-size: 15px; font-weight: 600; color: var(--text-main); }
.stat-value.critical { color: #dc2626; }
.btn-restock { width: 100%; padding: 8px; background: var(--primary); color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 14px; }
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 100; }
.modal { background: var(--bg-card); border-radius: 16px; padding: 28px; width: 360px; color: var(--text-main); }
.modal h2 { margin-bottom: 16px; font-size: 18px; }
.form-group { margin-bottom: 16px; }
.form-group label { display: block; font-size: 13px; margin-bottom: 6px; color: var(--text-muted); }
.form-group input { width: 100%; padding: 9px 12px; border: 1px solid var(--border-color); border-radius: 8px; font-size: 14px; background: var(--input-bg); color: var(--text-main); }
.modal-actions { display: flex; gap: 10px; justify-content: flex-end; }
.btn-cancel { padding: 8px 16px; background: var(--bg-app); border: 1px solid var(--border-color); border-radius: 8px; cursor: pointer; color: var(--text-main); }
.btn-confirm { padding: 8px 16px; background: #22c55e; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; }
</style>
