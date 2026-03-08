<template>
  <div class="subs-page">
    <div class="page-header">
      <h1 class="page-title">🔑 {{ t('subscription.title') }}</h1>
      <p class="page-subtitle">{{ t('subscription.subtitle') }}</p>
    </div>

    <div v-if="loading" class="loading-state">{{ t('common.loading') }}</div>

    <div v-else class="tenants-grid">
      <div v-for="tenant in tenants" :key="tenant.tenant_id" class="tenant-card">
        <div class="card-header">
          <div class="tenant-info">
            <span class="tenant-name">{{ tenant.tenant_name }}</span>
            <span class="tenant-id">ID: {{ tenant.tenant_id }}</span>
          </div>
          <span class="plan-badge" :class="tenant.tenant_plan">{{ t(`subscription.plan_${tenant.tenant_plan}`) }}</span>
        </div>

        <div class="card-body">
          <div class="form-row">
            <div class="form-group">
              <label>{{ t('subscription.plan') }}</label>
              <select v-model="tenant._editPlan" class="form-select">
                <option value="trial">{{ t('subscription.plan_trial') }}</option>
                <option value="basic">{{ t('subscription.plan_basic') }}</option>
                <option value="pro">{{ t('subscription.plan_pro') }}</option>
                <option value="unlimited">{{ t('subscription.plan_unlimited') }}</option>
              </select>
            </div>
            <div class="form-group">
              <label>{{ t('subscription.status') }}</label>
              <select v-model="tenant._editStatus" class="form-select">
                <option value="trialing">{{ t('subscription.status_trialing') }}</option>
                <option value="active">{{ t('subscription.status_active') }}</option>
                <option value="unlimited">{{ t('subscription.status_unlimited') }}</option>
                <option value="past_due">{{ t('subscription.status_past_due') }}</option>
                <option value="cancelled">{{ t('subscription.status_cancelled') }}</option>
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>{{ t('subscription.trial_end') }}</label>
              <input type="date" v-model="tenant._editTrialEnd" class="form-input" />
            </div>
            <div class="form-group">
              <label>{{ t('subscription.period_end') }}</label>
              <input type="date" v-model="tenant._editPeriodEnd" class="form-input" />
            </div>
          </div>

          <div class="meta-row">
            <span class="meta-item">👥 {{ tenant.user_count }} {{ t('subscription.users') }}</span>
            <span class="meta-item" v-if="tenant.trial_end">
              ⏳ {{ t('subscription.trial_end') }}: {{ formatDate(tenant.trial_end) }}
            </span>
          </div>
        </div>

        <div class="card-footer">
          <button
            class="btn-save"
            :disabled="saving === tenant.tenant_id"
            @click="save(tenant)"
          >
            {{ saving === tenant.tenant_id ? t('common.loading') : t('common.save') }}
          </button>
          <span v-if="saved === tenant.tenant_id" class="save-success">✅ {{ t('subscription.update_success') }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useFormatters } from '@/composables/useFormatters'
import api from '@/services/api'

const { t } = useI18n()
const { formatDate } = useFormatters()

const tenants = ref([])
const loading = ref(true)
const saving = ref(null)
const saved = ref(null)

async function fetchTenants() {
  loading.value = true
  try {
    const res = await api.get('/subscriptions')
    tenants.value = res.data.data.map(t => ({
      ...t,
      _editPlan: t.sub_plan || t.tenant_plan,
      _editStatus: t.status || 'trialing',
      _editTrialEnd: t.trial_end ? t.trial_end.slice(0, 10) : '',
      _editPeriodEnd: t.current_period_end ? t.current_period_end.slice(0, 10) : '',
    }))
  } finally {
    loading.value = false
  }
}

async function save(tenant) {
  saving.value = tenant.tenant_id
  saved.value = null
  try {
    await api.put(`/subscriptions/${tenant.tenant_id}`, {
      plan: tenant._editPlan,
      status: tenant._editStatus,
      trial_end: tenant._editTrialEnd || null,
      current_period_end: tenant._editPeriodEnd || null,
    })
    // Update local display
    tenant.tenant_plan = tenant._editPlan
    tenant.sub_plan = tenant._editPlan
    tenant.status = tenant._editStatus
    saved.value = tenant.tenant_id
    setTimeout(() => { saved.value = null }, 2500)
  } catch (err) {
    alert(err.response?.data?.error || t('common.error'))
  } finally {
    saving.value = null
  }
}

onMounted(fetchTenants)
</script>

<style scoped>
.subs-page { max-width: 1200px; }
.page-header { margin-bottom: 28px; }
.page-title { font-size: 24px; font-weight: 700; color: var(--text-main); }
.page-subtitle { font-size: 14px; color: var(--text-muted); margin-top: 4px; }

.loading-state { text-align: center; padding: 60px; color: var(--text-muted); }

.tenants-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(520px, 1fr)); gap: 20px; }

.tenant-card { background: var(--bg-card); border-radius: 14px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); overflow: hidden; border: 1px solid var(--border-color); }

.card-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; background: var(--bg-app); border-bottom: 1px solid var(--border-color); }
.tenant-info { display: flex; flex-direction: column; gap: 2px; }
.tenant-name { font-size: 16px; font-weight: 700; color: var(--text-main); }
.tenant-id { font-size: 11px; color: var(--text-muted); }

.plan-badge { font-size: 11px; font-weight: 700; text-transform: uppercase; padding: 4px 10px; border-radius: 20px; letter-spacing: 0.5px; }
.plan-badge.trial { background: #fef3c7; color: #92400e; }
.plan-badge.basic { background: #dbeafe; color: #1e40af; }
.plan-badge.pro { background: #ede9fe; color: #5b21b6; }
.plan-badge.unlimited { background: #d1fae5; color: #065f46; }

.card-body { padding: 20px; display: flex; flex-direction: column; gap: 14px; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-group label { font-size: 12px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; }
.form-select, .form-input { padding: 8px 12px; border: 1px solid var(--border-color); border-radius: 8px; background: var(--bg-app); color: var(--text-main); font-size: 13px; }
.form-select:focus, .form-input:focus { outline: none; border-color: var(--primary); }

.meta-row { display: flex; gap: 16px; flex-wrap: wrap; }
.meta-item { font-size: 12px; color: var(--text-muted); }

.card-footer { padding: 14px 20px; border-top: 1px solid var(--border-color); display: flex; align-items: center; gap: 12px; }
.btn-save { background: var(--primary); color: white; border: none; border-radius: 8px; padding: 9px 20px; font-size: 13px; font-weight: 600; cursor: pointer; }
.btn-save:hover { opacity: 0.9; }
.btn-save:disabled { opacity: 0.5; cursor: not-allowed; }
.save-success { font-size: 13px; color: #16a34a; font-weight: 600; }
</style>
