<template>
  <div class="transactions-page">
    <div class="page-header">
      <h1 class="page-title">{{ t('transactions.title') }}</h1>
      <div class="header-actions">
        <button class="btn btn-income" @click="openForm('income')">+ {{ t('transactions.add_income') }}</button>
        <button class="btn btn-expense" @click="openForm('expense')">+ {{ t('transactions.add_expense') }}</button>
        <button v-if="canExport" class="btn btn-secondary" @click="exportCSV">⬇ {{ t('common.export') }}</button>
        <span v-else class="pro-lock" @click="showUpgrade = true">🔒 {{ t('common.export') }}</span>
      </div>
    </div>

    <!-- Filters -->
    <div class="filters">
      <input type="date" v-model="filters.startDate" />
      <input type="date" v-model="filters.endDate" />
      <select v-model="filters.type">
        <option value="">{{ t('common.all') }}</option>
        <option value="income">{{ t('transactions.income') }}</option>
        <option value="expense">{{ t('transactions.expense') }}</option>
      </select>
      <button class="btn btn-secondary" @click="loadData">{{ t('common.filter') }}</button>
      <button v-if="filters.startDate || filters.endDate || filters.type" class="btn btn-clear" @click="clearFilters">✕ {{ t('common.clear') }}</button>
    </div>

    <!-- Table -->
    <div class="table-card">
      <table class="data-table">
        <thead>
          <tr>
            <th>{{ t('common.date') }}</th>
            <th>{{ t('common.description') }}</th>
            <th>{{ t('transactions.category') }}</th>
            <th>Type</th>
            <th>{{ t('common.amount') }}</th>
            <th>{{ t('common.total') }} (TRY)</th>
            <th>{{ t('common.actions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="store.loading"><td colspan="7" class="loading-row">{{ t('common.loading') }}</td></tr>
          <tr v-else-if="!store.transactions.length"><td colspan="7" class="empty-row">{{ t('transactions.no_transactions') }}</td></tr>
          <tr v-for="tx in store.transactions" :key="tx.id" :class="tx.type">
            <td>{{ formatDate(tx.transaction_date) }}</td>
            <td>{{ tx.description || '-' }}</td>
            <td><span class="category-tag">{{ tx.category || '-' }}</span></td>
            <td><span class="type-badge" :class="tx.type">{{ t(`transactions.${tx.type}`) }}</span></td>
            <td class="amount-cell" :class="tx.type">{{ formatCurrency(tx.amount, tx.currency) }}</td>
            <td class="amount-cell base">
              <span v-if="tx.currency !== 'TRY'">{{ formatCurrency(convertToTry(tx.amount, tx.currency), 'TRY') }}</span>
              <span v-else>-</span>
            </td>
            <td>
              <button class="icon-btn" @click="openEdit(tx)">✏️</button>
              <button class="icon-btn danger" @click="confirmDelete(tx.id)">🗑️</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Transaction Form Modal -->
    <TransactionFormModal v-if="showForm" :type="formType" :editing="editingItem" @close="showForm = false" @saved="onSaved" />

    <!-- Upgrade Modal -->
    <div v-if="showUpgrade" class="modal-overlay" @click.self="showUpgrade = false">
      <div class="upgrade-modal">
        <h2>🚀 {{ t('plans.upgrade_required') }}</h2>
        <p>{{ t('plans.upgrade_required') }}</p>
        <button class="btn btn-primary" @click="showUpgrade = false">{{ t('plans.upgrade_now') }}</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useTransactionStore } from '@/stores/transactions'
import { useFormatters } from '@/composables/useFormatters'
import { useFeatureFlag } from '@/composables/useFeatureFlag'
import TransactionFormModal from './TransactionFormModal.vue'
import api from '@/services/api'

const { t } = useI18n()
const store = useTransactionStore()
const { formatCurrency, formatDate } = useFormatters()
const { canExport } = useFeatureFlag()

const filters = ref({ startDate: '', endDate: '', type: '' })
const showForm = ref(false)
const formType = ref('income')
const editingItem = ref(null)
const showUpgrade = ref(false)
const rates = ref({})

async function loadData() { await store.fetchAll(filters.value) }

function clearFilters() {
  filters.value = { startDate: '', endDate: '', type: '' }
  loadData()
}

async function fetchRates() {
  try {
    const res = await api.get('/currencies/rates')
    if (res.data.success) rates.value = res.data.data
  } catch (err) { console.error('Rates fetch failed', err) }
}

function convertToTry(amount, currency) {
  if (currency === 'TRY') return amount
  const rate = rates.value[currency]
  return rate ? amount * rate.selling : 0
}

function openForm(type) { formType.value = type; editingItem.value = null; showForm.value = true }
function openEdit(item) { formType.value = item.type; editingItem.value = item; showForm.value = true }
function onSaved() { showForm.value = false; loadData() }

async function confirmDelete(id) {
  if (confirm(t('common.confirm_delete'))) await store.remove(id)
}

async function exportCSV() {
  const res = await api.get('/transactions/export', { responseType: 'blob' })
  const url = URL.createObjectURL(res.data)
  const a = document.createElement('a'); a.href = url; a.download = 'transactions.csv'; a.click()
}

onMounted(() => {
  loadData()
  fetchRates()
})
</script>

<style scoped>
.transactions-page { max-width: 1200px; color: var(--text-main); }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 12px; }
.page-title { font-size: 24px; font-weight: 700; color: var(--text-main); }
.header-actions { display: flex; gap: 8px; flex-wrap: wrap; }
.btn { padding: 8px 16px; border-radius: 8px; border: none; cursor: pointer; font-size: 14px; font-weight: 500; }
.btn-income { background: #22c55e; color: white; }
.btn-expense { background: #ef4444; color: white; }
.btn-secondary { background: var(--bg-app); color: var(--text-main); border: 1px solid var(--border-color); }
.btn-primary { background: var(--primary); color: white; }
.pro-lock { padding: 8px 16px; background: var(--bg-app); color: var(--text-muted); border-radius: 8px; cursor: pointer; font-size: 14px; border: 1px dashed var(--border-color); }
.filters { display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; }
.filters input, .filters select { padding: 8px 12px; border: 1px solid var(--border-color); border-radius: 8px; font-size: 14px; background: var(--input-bg); color: var(--text-main); }
.table-card { background: var(--bg-card); border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
.data-table { width: 100%; border-collapse: collapse; font-size: 14px; }
.data-table th { padding: 12px 16px; text-align: left; font-size: 12px; text-transform: uppercase; color: var(--text-muted); border-bottom: 1px solid var(--table-border); background: var(--table-header-bg); }
.data-table td { padding: 12px 16px; border-bottom: 1px solid var(--table-border); }
.loading-row, .empty-row { text-align: center; color: #9ca3af; padding: 40px !important; }
.type-badge { padding: 3px 10px; border-radius: 99px; font-size: 12px; font-weight: 600; }
.type-badge.income { background: #dcfce7; color: #16a34a; }
.type-badge.expense { background: #fee2e2; color: #dc2626; }
.amount-cell { font-weight: 600; }
.amount-cell.income { color: #16a34a; }
.amount-cell.income { color: #16a34a; }
.amount-cell.expense { color: #dc2626; }
.amount-cell.base { color: var(--text-muted); font-size: 12px; font-weight: 400; }
.category-tag { background: var(--badge-bg); color: var(--badge-text); padding: 2px 8px; border-radius: 4px; font-size: 12px; }
.icon-btn { background: none; border: none; cursor: pointer; font-size: 16px; padding: 4px; border-radius: 4px; color: var(--text-main); }
.icon-btn:hover { background: var(--bg-app); }
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 100; }
.upgrade-modal { background: white; border-radius: 16px; padding: 32px; max-width: 400px; text-align: center; }
.btn-clear { background: transparent; border: 1px solid #ef4444; color: #ef4444; border-radius: 8px; padding: 8px 14px; font-size: 13px; font-weight: 600; cursor: pointer; white-space: nowrap; }
.btn-clear:hover { background: #fef2f2; }
</style>
