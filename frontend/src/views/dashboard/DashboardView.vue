<template>
  <div class="dashboard">
    <h1 class="page-title">{{ t('dashboard.title') }}</h1>

    <!-- KPI Cards -->
    <div class="kpi-grid" v-if="!loading">
      <div class="kpi-card income">
        <div class="kpi-icon">💰</div>
        <div class="kpi-body">
          <span class="kpi-label">{{ t('dashboard.month_income') }}</span>
          <span class="kpi-value">{{ formatCurrency(stats?.month?.month_income) }}</span>
        </div>
      </div>
      <div class="kpi-card expense">
        <div class="kpi-icon">💸</div>
        <div class="kpi-body">
          <span class="kpi-label">{{ t('dashboard.month_expense') }}</span>
          <span class="kpi-value">{{ formatCurrency(stats?.month?.month_expense) }}</span>
        </div>
      </div>
      <div class="kpi-card profit">
        <div class="kpi-icon">📈</div>
        <div class="kpi-body">
          <span class="kpi-label">{{ t('dashboard.month_profit') }}</span>
          <span class="kpi-value" :class="monthProfit >= 0 ? 'positive' : 'negative'">
            {{ formatCurrency(monthProfit) }}
          </span>
        </div>
      </div>
      <div class="kpi-card alert" @click="router.push({ name: 'stock-alerts', params: { locale } })">
        <div class="kpi-icon">⚠️</div>
        <div class="kpi-body">
          <span class="kpi-label">{{ t('dashboard.stock_alerts') }}</span>
          <span class="kpi-value alert-count">{{ stats?.stock?.alert_count || 0 }}</span>
        </div>
      </div>
    </div>

    <!-- Receivables Summary -->
    <div class="section-title" v-if="!loading && receivablesSummary.length">{{ t('nav.receivables') }}</div>
    <div class="kpi-grid receivables-grid" v-if="!loading && receivablesSummary.length">
      <div v-for="s in receivablesSummary" :key="s.currency" class="kpi-card receivable-outstanding">
        <div class="kpi-icon">📄</div>
        <div class="kpi-body">
          <span class="kpi-label">{{ s.currency }} — {{ t('receivables.outstanding') }}</span>
          <span class="kpi-value">{{ formatCurrency(s.outstanding, s.currency) }}</span>
          <span v-if="s.overdue_count > 0" class="kpi-sub overdue-sub">
            ⏰ {{ s.overdue_count }} {{ t('receivables.overdue') }}
          </span>
        </div>
      </div>
    </div>

    <!-- Cash Flow Chart -->
    <div class="chart-card">
      <h2 class="card-title">{{ t('dashboard.cashflow_chart') }}</h2>
      <CashFlowChart :data="cashflowData" />
    </div>

    <!-- Overdue Receivables Banner -->
    <div v-if="stats?.receivables?.overdue_count > 0" class="overdue-banner">
      ⚠️ {{ stats.receivables.overdue_count }} {{ t('dashboard.overdue_receivables') }} —
      <RouterLink :to="{ name: 'receivables', params: { locale } }">{{ t('nav.receivables') }}</RouterLink>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useFormatters } from '@/composables/useFormatters'
import { useTransactionStore } from '@/stores/transactions'
import api from '@/services/api'
import CashFlowChart from '@/components/charts/CashFlowChart.vue'

const { t, locale } = useI18n()
const router = useRouter()
const { formatCurrency } = useFormatters()
const txStore = useTransactionStore()

const stats = ref(null)
const loading = ref(true)
const cashflowData = ref([])
const receivablesSummary = ref([])

const monthProfit = computed(() => {
  if (!stats.value?.month) return 0
  return (stats.value.month.month_income || 0) - (stats.value.month.month_expense || 0)
})

onMounted(async () => {
  try {
    const [dashRes, , recRes] = await Promise.all([
      api.get('/analytics/dashboard'),
      txStore.fetchCashflow({ period: 'daily' }),
      api.get('/receivables/summary')
    ])
    stats.value = dashRes.data.data
    cashflowData.value = txStore.cashflow
    receivablesSummary.value = (recRes.data.data || []).filter(s => s.outstanding > 0)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.dashboard { max-width: 1200px; color: var(--text-main); }
.page-title { font-size: 24px; font-weight: 700; color: var(--text-main); margin-bottom: 24px; }
.kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 24px; }
.kpi-card { background: var(--bg-card); border-radius: 12px; padding: 20px; display: flex; align-items: center; gap: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); cursor: default; border-left: 4px solid transparent; color: var(--text-main); }
.kpi-card.income { border-color: #22c55e; }
.kpi-card.expense { border-color: #ef4444; }
.kpi-card.profit { border-color: #3b82f6; }
.kpi-card.alert { border-color: #f59e0b; cursor: pointer; }
.kpi-card.alert:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.12); }
.kpi-icon { font-size: 32px; }
.kpi-body { display: flex; flex-direction: column; gap: 4px; }
.kpi-label { font-size: 12px; color: var(--text-muted); font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; }
.kpi-value { font-size: 22px; font-weight: 700; color: var(--text-main); }
.kpi-value.positive { color: #22c55e; }
.kpi-value.negative { color: #ef4444; }
.alert-count { color: #f59e0b; }
.chart-card { background: var(--bg-card); border-radius: 12px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); margin-bottom: 16px; }
.card-title { font-size: 16px; font-weight: 600; color: var(--text-main); margin-bottom: 16px; }
.overdue-banner { background: #fef3c7; border: 1px solid #fbbf24; border-radius: 8px; padding: 12px 16px; font-size: 14px; color: #92400e; }
.overdue-banner a { color: #1e3a5f; font-weight: 600; }
.section-title { font-size: 12px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; margin: 4px 0 12px; }
.receivables-grid { margin-bottom: 24px; }
.kpi-card.receivable-outstanding { border-color: #8b5cf6; }
.kpi-card.receivable-overdue { border-color: #f59e0b; cursor: pointer; }
.kpi-card.receivable-overdue:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.12); }
.overdue-val { color: #f59e0b; }
.kpi-sub { font-size: 11px; color: var(--text-muted); margin-top: 2px; }
.overdue-sub { color: #f59e0b; font-weight: 600; }
</style>
