<template>
  <div class="receivables-page">
    <div class="page-header">
      <h1 class="page-title">📋 {{ t('receivables.title') }}</h1>
      <button class="btn btn-primary" @click="openModal()">+ {{ t('common.add') }}</button>
    </div>

    <div class="summary-cards">
      <div v-for="s in filteredSummary" :key="s.currency" class="summary-card">
        <div class="sum-header">
          <span class="sum-currency">{{ s.currency }}</span>
        </div>
        <div class="sum-body">
          <div class="sum-item">
            <span class="sum-label">{{ t('receivables.outstanding') }}</span>
            <span class="sum-val">{{ formatCurrency(s.outstanding, s.currency) }}</span>
          </div>
          <div class="sum-item" v-if="s.overdue_count > 0">
            <span class="sum-label overdue">{{ t('receivables.overdue') }}</span>
            <span class="sum-val overdue">{{ s.overdue_count }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="filters">
      <input v-model="filters.search" :placeholder="t('common.search')" class="search-input" />
      <select v-model="filters.status" class="status-select">
        <option value="">{{ t('common.all') }}</option>
        <option value="pending">{{ t('receivables.pending') }}</option>
        <option value="partial">{{ t('receivables.partial') }}</option>
        <option value="paid">{{ t('receivables.paid') }}</option>
        <option value="overdue">{{ t('receivables.overdue') }}</option>
      </select>
    </div>

    <div class="table-card">
      <table class="data-table">
        <thead>
          <tr>
            <th>{{ t('receivables.customer') }}</th>
            <th>{{ t('common.amount') }}</th>
            <th>{{ t('receivables.due_date') }}</th>
            <th>{{ t('common.status') }}</th>
            <th>{{ t('common.actions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in filteredReceivables" :key="item.id">
            <td><strong>{{ item.customer_name }}</strong></td>
            <td>
              <div>{{ formatCurrency(item.amount, item.currency) }}</div>
              <div v-if="item.paid_amount > 0" class="paid-info">{{ t('receivables.paid_so_far') }}: {{ formatCurrency(item.paid_amount, item.currency) }}</div>
            </td>
            <td :class="{ overdue: isOverdue(item) }">{{ formatDate(item.due_date) }}</td>
            <td>
              <span class="status-badge" :class="item.status">
                {{ t(`receivables.${item.status}`) }}
              </span>
            </td>
            <td class="actions">
              <button v-if="item.status !== 'paid'" class="btn-icon btn-payment" @click="openPayment(item)" :title="t('receivables.enter_payment')">💳</button>
              <button v-if="item.status !== 'paid'" class="btn-icon" @click="markAsPaid(item)" :title="t('receivables.mark_paid')">✅</button>
              <button class="btn-icon" @click="openModal(item)">✏️</button>
              <button class="btn-icon delete" @click="handleDelete(item)">🗑️</button>
            </td>
          </tr>
          <tr v-if="!filteredReceivables.length" class="empty-row">
            <td colspan="5">{{ t('receivables.no_receivables') }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modals -->
    <ReceivableFormModal v-if="showModal" :editing="editingItem" @close="showModal = false" @saved="onSaved" />
    <PaymentModal v-if="paymentItem" :item="paymentItem" @close="paymentItem = null" @saved="onSaved" />
  </div>
</template>

<script setup>
import { ref, onMounted, computed, reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import { useFormatters } from '@/composables/useFormatters'
import api from '@/services/api'
import ReceivableFormModal from './ReceivableFormModal.vue'
import PaymentModal from './PaymentModal.vue'

const { t } = useI18n()
const { formatCurrency, formatDate } = useFormatters()

const receivables = ref([])
const summary = ref([])
const loading = ref(false)
const showModal = ref(false)
const editingItem = ref(null)
const paymentItem = ref(null)

const filters = reactive({
  search: '',
  status: ''
})

const filteredReceivables = computed(() => {
  return receivables.value.filter(item => {
    const matchesSearch = item.customer_name.toLowerCase().includes(filters.search.toLowerCase())
    // Overdue: match both stored status='overdue' AND items where due_date has passed but status is still pending/partial
    let matchesStatus = true
    if (filters.status === 'overdue') {
      matchesStatus = item.status === 'overdue' || (item.status !== 'paid' && new Date(item.due_date) < new Date())
    } else {
      matchesStatus = !filters.status || item.status === filters.status
    }
    return matchesSearch && matchesStatus
  })
})

const filteredSummary = computed(() => {
  return summary.value.filter(s => s.outstanding > 0)
})

async function fetchData() {
  try {
    const [listRes, sumRes] = await Promise.all([
      api.get('/receivables'),
      api.get('/receivables/summary')
    ])
    receivables.value = listRes.data.data
    summary.value = sumRes.data.data
  } catch (err) {
    console.error('Fetch failed', err)
  }
}

// function formatDate(date) { return new Date(date).toLocaleDateString() }
// function formatCurrency(val, cur) { return new Intl.NumberFormat(undefined, { style: 'currency', currency: cur }).format(val) }
function isOverdue(item) { return item.status !== 'paid' && new Date(item.due_date) < new Date() }

async function markAsPaid(item) {
  if (confirm(t('common.confirm_payment'))) {
     try {
       await api.put(`/receivables/${item.id}`, { 
         paid_at: new Date().toISOString().slice(0, 10), 
         status: 'paid' 
       })
       fetchData()
     } catch (err) { alert(t('common.error')) }
  }
}

async function handleDelete(item) {
  if (confirm(t('common.confirm_delete'))) {
    await api.delete(`/receivables/${item.id}`)
    fetchData()
  }
}

function openModal(item) {
  editingItem.value = item || null
  showModal.value = true
}

function openPayment(item) {
  paymentItem.value = item
}

function onSaved() {
  showModal.value = false
  paymentItem.value = null
  fetchData()
}

onMounted(fetchData)
</script>

<style scoped>
.receivables-page { max-width: 1200px; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.page-title { font-size: 24px; font-weight: 700; color: var(--text-main); }

.summary-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 16px; margin-bottom: 24px; }
.summary-card { background: var(--bg-card); border-radius: 12px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); border-top: 4px solid var(--primary); }
.sum-currency { font-weight: 700; color: var(--text-main); font-size: 18px; }
.sum-body { display: flex; flex-direction: column; gap: 8px; margin-top: 12px; }
.sum-item { display: flex; justify-content: space-between; align-items: center; }
.sum-label { font-size: 12px; color: var(--text-muted); }
.sum-val { font-weight: 600; color: var(--text-main); }
.overdue { color: #dc2626 !important; }

.filters { display: flex; gap: 12px; margin-bottom: 16px; }
.search-input { flex: 1; padding: 10px 16px; border: 1px solid var(--border-color); border-radius: 8px; background: var(--bg-card); color: var(--text-main); }
.status-select { padding: 10px 16px; border: 1px solid var(--border-color); border-radius: 8px; background: var(--bg-card); color: var(--text-main); }

.table-card { background: var(--bg-card); border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
.data-table { width: 100%; border-collapse: collapse; font-size: 14px; }
.data-table th { padding: 12px 16px; text-align: left; font-size: 12px; text-transform: uppercase; color: var(--text-muted); border-bottom: 1px solid var(--table-border); background: var(--table-header-bg); }
.data-table td { padding: 12px 16px; border-bottom: 1px solid var(--table-border); color: var(--text-main); }

.overdue { color: #dc2626; font-weight: 600; }
.status-badge { padding: 4px 10px; border-radius: 99px; font-size: 11px; font-weight: 700; text-transform: uppercase; }
.status-badge.pending { background: #fef3c7; color: #92400e; }
.status-badge.paid { background: #dcfce7; color: #16a34a; }
.status-badge.overdue { background: #fee2e2; color: #dc2626; }
.status-badge.partial { background: #e0f2fe; color: #0284c7; }

.actions { display: flex; gap: 8px; }
.btn-icon { background: none; border: 1px solid var(--border-color); border-radius: 6px; padding: 4px 8px; cursor: pointer; color: var(--text-main); }
.btn-icon:hover { background: var(--bg-app); }
.btn-icon.delete:hover { border-color: #fca5a5; }
.btn-icon.btn-payment:hover { border-color: #86efac; }
.paid-info { font-size: 11px; color: #16a34a; margin-top: 2px; }

.btn-primary { background: var(--primary); color: white; border: none; border-radius: 8px; padding: 10px 20px; font-weight: 600; cursor: pointer; }
.empty-row td { text-align: center; padding: 40px !important; color: var(--text-muted); }
</style>
