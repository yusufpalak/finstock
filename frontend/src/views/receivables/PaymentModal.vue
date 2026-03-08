<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal">
      <div class="modal-header">
        <h2>💳 {{ t('receivables.enter_payment') }}</h2>
        <button @click="$emit('close')">✕</button>
      </div>

      <!-- Current status info -->
      <div class="payment-info">
        <div class="info-row">
          <span class="info-label">{{ t('receivables.customer') }}</span>
          <span class="info-val">{{ item.customer_name }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">{{ t('common.amount') }}</span>
          <span class="info-val">{{ formatCurrency(item.amount, item.currency) }}</span>
        </div>
        <div class="info-row" v-if="item.paid_amount > 0">
          <span class="info-label">{{ t('receivables.paid_so_far') }}</span>
          <span class="info-val paid">{{ formatCurrency(item.paid_amount, item.currency) }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">{{ t('receivables.remaining') }}</span>
          <span class="info-val remaining">{{ formatCurrency(remaining, item.currency) }}</span>
        </div>
      </div>

      <form class="modal-form" @submit.prevent="handleSubmit">
        <div class="form-group">
          <label>{{ t('receivables.payment_amount') }}</label>
          <input
            v-model.number="form.amount"
            type="number"
            step="0.01"
            :min="0.01"
            :max="remaining"
            required
            :placeholder="`Max: ${remaining}`"
          />
        </div>

        <div class="form-group">
          <label>{{ t('receivables.payment_date') }}</label>
          <input v-model="form.paid_at" type="date" required />
        </div>

        <div class="form-group">
          <label>{{ t('common.description') }} ({{ t('common.optional') }})</label>
          <textarea v-model="form.notes" rows="2" :placeholder="t('receivables.payment_notes')"></textarea>
        </div>

        <p v-if="error" class="error-msg">{{ error }}</p>

        <div class="modal-actions">
          <button type="button" class="btn-cancel" @click="$emit('close')">{{ t('common.cancel') }}</button>
          <button type="submit" class="btn-submit" :disabled="loading">
            {{ loading ? t('common.loading') : t('receivables.save_payment') }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useFormatters } from '@/composables/useFormatters'
import api from '@/services/api'

const props = defineProps({ item: Object })
const emit = defineEmits(['close', 'saved'])
const { t } = useI18n()
const { formatCurrency } = useFormatters()

const loading = ref(false)
const error = ref('')

const remaining = computed(() => {
  return parseFloat((props.item.amount - (props.item.paid_amount || 0)).toFixed(2))
})

const form = ref({
  amount: remaining.value,
  paid_at: new Date().toISOString().slice(0, 10),
  notes: ''
})

async function handleSubmit() {
  if (form.value.amount <= 0 || form.value.amount > remaining.value) {
    error.value = t('receivables.invalid_payment_amount')
    return
  }
  loading.value = true
  error.value = ''
  try {
    await api.post(`/receivables/${props.item.id}/payment`, {
      amount: form.value.amount,
      paid_at: form.value.paid_at,
      notes: form.value.notes
    })
    emit('saved')
  } catch (err) {
    error.value = err.response?.data?.error || t('common.error')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 100; }
.modal { background: var(--bg-card); border-radius: 16px; padding: 28px; width: 100%; max-width: 460px; max-height: 90vh; overflow-y: auto; color: var(--text-main); }
.modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.modal-header h2 { font-size: 18px; font-weight: 600; color: var(--text-main); }
.modal-header button { background: none; border: none; font-size: 20px; cursor: pointer; color: var(--text-muted); }

.payment-info { background: var(--bg-app); border-radius: 10px; padding: 14px; margin-bottom: 20px; display: flex; flex-direction: column; gap: 8px; }
.info-row { display: flex; justify-content: space-between; align-items: center; font-size: 14px; }
.info-label { color: var(--text-muted); }
.info-val { font-weight: 600; color: var(--text-main); }
.info-val.paid { color: #16a34a; }
.info-val.remaining { color: var(--primary); }

.modal-form { display: flex; flex-direction: column; gap: 14px; }
.form-group { display: flex; flex-direction: column; gap: 5px; }
.form-group label { font-size: 12px; font-weight: 500; color: var(--text-muted); }
.form-group input, .form-group textarea { padding: 9px 12px; border: 1px solid var(--border-color); border-radius: 8px; font-size: 14px; background: var(--input-bg); color: var(--text-main); }
.modal-actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 4px; }
.btn-cancel { padding: 9px 18px; background: var(--bg-app); border: 1px solid var(--border-color); border-radius: 8px; cursor: pointer; font-size: 14px; color: var(--text-main); }
.btn-submit { padding: 9px 18px; border: none; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 600; color: white; background: var(--primary); }
.btn-submit:disabled { opacity: 0.6; cursor: not-allowed; }
.error-msg { color: #dc2626; font-size: 13px; background: #fef2f2; padding: 10px; border-radius: 6px; }
</style>
