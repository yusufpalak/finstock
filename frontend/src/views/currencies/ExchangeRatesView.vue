<template>
  <div class="exchange-rates-page">
    <div class="page-header">
      <h1 class="page-title">💱 {{ t('currencies.title') }}</h1>
      <p class="last-updated" v-if="lastFetch && canViewRates">{{ t('common.date') }}: {{ lastFetch }}</p>
    </div>

    <!-- Plan Gate -->
    <div v-if="!canViewRates" class="upgrade-gate-card">
      <div class="gate-icon">🔒</div>
      <h2>{{ t('plans.upgrade_required') }}</h2>
      <p>{{ t('plans.upgrade_pro') }}</p>
      <button class="btn btn-primary" @click="showUpgradeModal">{{ t('plans.upgrade_now') }}</button>
    </div>

    <template v-else>
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>{{ t('common.loading') }}</p>
      </div>

      <div class="rates-grid" v-else-if="Object.keys(majorRates).length">
        <div v-for="rate in majorRates" :key="rate.code" class="rate-card">
          <div class="rate-header">
            <span class="currency-code">{{ rate.code }}</span>
            <span class="currency-name">{{ rate.name }}</span>
          </div>
          <div class="rate-values">
            <div class="rate-val">
              <span class="val-label">{{ t('currencies.buying') }}</span>
              <span class="val-num">{{ rate.buying?.toFixed(4) }}</span>
            </div>
            <div class="rate-val">
              <span class="val-label">{{ t('currencies.selling') }}</span>
              <span class="val-num highlight">{{ rate.selling?.toFixed(4) }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="all-rates-card" v-if="Object.keys(rates).length">
        <h3>{{ t('currencies.all_rates') }}</h3>
        <div class="table-card">
          <table class="data-table">
            <thead>
              <tr>
                <th>{{ t('currencies.code') }}</th>
                <th>{{ t('currencies.unit') }}</th>
                <th>{{ t('currencies.currency_name') }}</th>
                <th>{{ t('currencies.buying') }}</th>
                <th>{{ t('currencies.selling') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="rate in rates" :key="rate.code">
                <td><strong>{{ rate.code }}</strong></td>
                <td>{{ rate.unit || 1 }}</td>
                <td>{{ rate.name }}</td>
                <td>{{ rate.buying?.toFixed(4) }}</td>
                <td>{{ rate.selling?.toFixed(4) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useFormatters } from '@/composables/useFormatters'
import { useFeatureFlag } from '@/composables/useFeatureFlag'
import api from '@/services/api'

const { t } = useI18n()
const { formatDate } = useFormatters()
const { canViewRates } = useFeatureFlag()

const loading = ref(true)
const rates = ref({})
const lastFetch = ref('')

const majorRates = computed(() => {
  const codes = ['USD', 'EUR', 'GBP']
  return Object.values(rates.value).filter(r => codes.includes(r.code))
})

async function fetchRates() {
  if (!canViewRates.value) return
  try {
    const res = await api.get('/currencies/rates')
    if (res.data.success) {
      rates.value = res.data.data
      lastFetch.value = formatDate(new Date())
    }
  } catch (err) {
    console.error('Fetch failed', err)
  } finally {
    loading.value = false
  }
}

function showUpgradeModal() {
  alert(t('plans.upgrade_pro'))
}

onMounted(fetchRates)
</script>

<style scoped>
.exchange-rates-page { max-width: 1200px; }
.page-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 24px; }
.page-title { font-size: 24px; font-weight: 700; color: var(--text-main); }
.last-updated { font-size: 12px; color: var(--text-muted); }

.upgrade-gate-card { 
  background: var(--bg-card); 
  border-radius: 16px; 
  padding: 60px 40px; 
  text-align: center; 
  border: 2px dashed var(--border-color);
  max-width: 600px;
  margin: 40px auto;
}
.gate-icon { font-size: 48px; margin-bottom: 20px; }
.upgrade-gate-card h2 { margin-bottom: 12px; color: var(--text-main); }
.upgrade-gate-card p { color: var(--text-muted); margin-bottom: 24px; }

.rates-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; margin-bottom: 32px; }
.rate-card { background: var(--bg-card); border-radius: 12px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border-top: 4px solid var(--primary); }
.rate-header { display: flex; flex-direction: column; margin-bottom: 16px; }
.currency-code { font-size: 20px; font-weight: 700; color: var(--text-main); }
.currency-name { font-size: 12px; color: var(--text-muted); text-transform: uppercase; }

.rate-values { display: flex; justify-content: space-between; align-items: center; }
.rate-val { display: flex; flex-direction: column; }
.val-label { font-size: 11px; color: var(--text-muted); text-transform: uppercase; margin-bottom: 4px; }
.val-num { font-size: 18px; font-weight: 600; color: var(--text-main); }
.val-num.highlight { color: var(--primary); }

.all-rates-card { background: var(--bg-card); border-radius: 12px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
.all-rates-card h3 { margin-bottom: 20px; font-size: 16px; color: var(--text-main); }

.table-card { border-radius: 8px; overflow: hidden; border: 1px solid var(--table-border); }
.data-table { width: 100%; border-collapse: collapse; font-size: 14px; }
.data-table th { padding: 12px 16px; text-align: left; font-size: 12px; text-transform: uppercase; color: var(--text-muted); border-bottom: 1px solid var(--table-border); background: var(--table-header-bg); }
.data-table td { padding: 12px 16px; border-bottom: 1px solid var(--table-border); color: var(--text-main); }

.btn-primary { background: var(--primary); color: white; border: none; border-radius: 8px; padding: 10px 24px; font-weight: 600; cursor: pointer; }

.loading-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px; color: var(--text-muted); }
.spinner { width: 40px; height: 40px; border: 3px solid var(--border-color); border-top-color: var(--primary); border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 12px; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
