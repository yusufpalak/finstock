<template>
  <div class="analytics-page">
    <div class="page-header">
      <h1 class="page-title">📈 {{ t('nav.analytics') }}</h1>
      <div class="header-actions">
        <select v-model="selectedYear" class="year-select">
          <option v-for="y in years" :key="y" :value="y">{{ y }}</option>
        </select>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <span class="stat-label">{{ t('dashboard.today_income') }}</span>
        <span class="stat-value income">{{ formatCurrency(profitability?.total_income) }}</span>
      </div>
      <div class="stat-card">
        <span class="stat-label">{{ t('dashboard.today_expense') }}</span>
        <span class="stat-value expense">{{ formatCurrency(profitability?.total_expense) }}</span>
      </div>
      <div class="stat-card">
        <span class="stat-label">{{ t('dashboard.month_profit') }}</span>
        <span class="stat-value profit" :class="{ negative: profitability?.net_profit < 0 }">
          {{ formatCurrency(profitability?.net_profit) }}
        </span>
      </div>
    </div>

    <div class="charts-grid">
      <div class="chart-card large">
        <h3>{{ t('dashboard.cashflow_chart') }}</h3>
        <CashFlowChart :data="cashflowData" />
      </div>
      
      <div class="chart-card">
        <h3>{{ t('dashboard.income_categories') }}</h3>
        <div class="category-list">
          <div v-for="cat in incomeCategories" :key="cat.category" class="cat-item">
            <div class="cat-info">
              <span class="cat-name">{{ cat.category || t('common.other') }}</span>
              <span class="cat-count">{{ cat.count }} {{ t('common.transactions') }}</span>
            </div>
            <span class="cat-amount">{{ formatCurrency(cat.total) }}</span>
          </div>
        </div>
      </div>

      <div class="chart-card">
        <h3>{{ t('dashboard.expense_categories') }}</h3>
        <div class="category-list">
          <div v-for="cat in expenseCategories" :key="cat.category" class="cat-item">
            <div class="cat-info">
              <span class="cat-name">{{ cat.category || t('common.other') }}</span>
              <span class="cat-count">{{ cat.count }} {{ t('common.transactions') }}</span>
            </div>
            <span class="cat-amount expense">{{ formatCurrency(cat.total) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Receivables Section -->
    <div class="section-header">
      <h2 class="section-title">📋 {{ t('nav.receivables') }}</h2>
    </div>
    <div class="receivables-summary" v-if="receivablesSummary.length">
      <div v-for="s in receivablesSummary" :key="s.currency" class="rec-card">
        <div class="rec-currency">{{ s.currency }}</div>
        <div class="rec-stats">
          <div class="rec-stat">
            <span class="rec-label">{{ t('receivables.outstanding') }}</span>
            <span class="rec-val outstanding">{{ formatCurrency(s.outstanding, s.currency) }}</span>
          </div>
          <div class="rec-stat">
            <span class="rec-label">{{ t('receivables.paid') }}</span>
            <span class="rec-val collected">{{ formatCurrency(s.collected, s.currency) }}</span>
          </div>
          <div class="rec-stat" v-if="s.overdue_count > 0">
            <span class="rec-label">{{ t('receivables.overdue') }}</span>
            <span class="rec-val overdue">{{ s.overdue_count }}</span>
          </div>
        </div>
      </div>
    </div>
    <div v-else-if="!loading" class="empty-rec">{{ t('receivables.no_receivables') }}</div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useFormatters } from '@/composables/useFormatters'
import api from '@/services/api'
import CashFlowChart from '@/components/charts/CashFlowChart.vue'

const { t } = useI18n()
const { formatCurrency } = useFormatters()

const loading = ref(true)
const selectedYear = ref(new Date().getFullYear())
const years = [2024, 2025, 2026]

const profitability = ref(null)
const cashflowData = ref([])
const incomeCategories = ref([])
const expenseCategories = ref([])
const receivablesSummary = ref([])

async function fetchAnalytics() {
  loading.value = true
  try {
    const [profRes, cfRes, icatRes, ecatRes, recRes] = await Promise.all([
      api.get('/transactions/summary/profitability'),
      api.get('/transactions/summary/cashflow?period=monthly'),
      api.get('/transactions/summary/category-breakdown?type=income'),
      api.get('/transactions/summary/category-breakdown?type=expense'),
      api.get('/receivables/summary')
    ])
    
    profitability.value = profRes.data.data
    cashflowData.value = cfRes.data.data
    incomeCategories.value = icatRes.data.data
    expenseCategories.value = ecatRes.data.data
    receivablesSummary.value = recRes.data.data
  } catch (err) {
    console.error('Analytics fetch failed', err)
  } finally {
    loading.value = false
  }
}

onMounted(fetchAnalytics)
watch(selectedYear, fetchAnalytics)

</script>

<style scoped>
.analytics-page { max-width: 1240px; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.page-title { font-size: 24px; font-weight: 700; color: var(--text-main); }
.year-select { padding: 8px 12px; border: 1px solid var(--border-color); border-radius: 8px; background: var(--bg-card); color: var(--text-main); }

.stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; margin-bottom: 24px; }
.stat-card { background: var(--bg-card); border-radius: 12px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); display: flex; flex-direction: column; gap: 8px; }
.stat-label { font-size: 12px; color: var(--text-muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
.stat-value { font-size: 24px; font-weight: 700; color: var(--text-main); }
.stat-value.income { color: #22c55e; }
.stat-value.expense { color: #ef4444; }
.stat-value.profit { color: var(--primary); }
.stat-value.profit.negative { color: #ef4444; }

.charts-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px; }
.chart-card { background: var(--bg-card); border-radius: 16px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
.chart-card.large { grid-column: span 2; }
.chart-card h3 { font-size: 16px; font-weight: 600; margin-bottom: 20px; color: var(--text-main); }

.category-list { display: flex; flex-direction: column; gap: 12px; }
.cat-item { display: flex; justify-content: space-between; align-items: center; padding-bottom: 12px; border-bottom: 1px solid var(--table-border); }
.cat-info { display: flex; flex-direction: column; }
.cat-name { font-weight: 600; color: var(--text-main); font-size: 14px; }
.cat-count { font-size: 12px; color: var(--text-muted); }
.cat-amount { font-weight: 700; color: #22c55e; }
.cat-amount.expense { color: #ef4444; }

.section-header { display: flex; align-items: center; margin: 28px 0 16px; }
.section-title { font-size: 18px; font-weight: 700; color: var(--text-main); }

.receivables-summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; margin-bottom: 24px; }
.rec-card { background: var(--bg-card); border-radius: 12px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); border-left: 4px solid #8b5cf6; }
.rec-currency { font-size: 20px; font-weight: 800; color: var(--text-main); margin-bottom: 14px; }
.rec-stats { display: flex; flex-direction: column; gap: 10px; }
.rec-stat { display: flex; justify-content: space-between; align-items: center; }
.rec-label { font-size: 12px; color: var(--text-muted); font-weight: 500; text-transform: uppercase; }
.rec-val { font-weight: 700; font-size: 16px; color: var(--text-main); }
.rec-val.outstanding { color: #8b5cf6; }
.rec-val.collected { color: #22c55e; }
.rec-val.overdue { color: #f59e0b; }
.empty-rec { text-align: center; padding: 24px; color: var(--text-muted); font-size: 14px; background: var(--bg-card); border-radius: 12px; }

@media (max-width: 900px) {
  .charts-grid { grid-template-columns: 1fr; }
  .chart-card.large { grid-column: span 1; }
}
</style>
