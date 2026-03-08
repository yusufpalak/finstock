<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal">
      <div class="modal-header">
        <h2>{{ editing ? t('common.edit') : t('common.add') }}</h2>
        <button @click="$emit('close')">✕</button>
      </div>

      <form class="modal-form" @submit.prevent="handleSubmit">
        <div class="form-group">
          <label>{{ t('receivables.customer') }}</label>
          <input v-model="form.customer_name" type="text" required :placeholder="t('receivables.customer')" />
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>{{ t('common.amount') }}</label>
            <input v-model.number="form.amount" type="number" step="0.01" min="0" required />
          </div>
          <div class="form-group">
            <label>{{ t('common.currency') }}</label>
            <select v-model="form.currency">
              <option v-for="c in currencies" :key="c" :value="c">{{ c }}</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label>{{ t('receivables.due_date') }}</label>
          <input v-model="form.due_date" type="date" required />
        </div>

        <div class="form-group">
          <label>{{ t('common.description') }}</label>
          <textarea v-model="form.description" rows="3"></textarea>
        </div>

        <p v-if="error" class="error-msg">{{ error }}</p>

        <div class="modal-actions">
          <button type="button" class="btn-cancel" @click="$emit('close')">{{ t('common.cancel') }}</button>
          <button type="submit" class="btn-submit" :disabled="loading">
            {{ loading ? t('common.loading') : t('common.save') }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import api from '@/services/api'

const props = defineProps({ editing: Object })
const emit = defineEmits(['close', 'saved'])
const { t } = useI18n()

const currencies = ['TRY', 'USD', 'EUR', 'GBP']
const loading = ref(false)
const error = ref('')

const form = ref({
  customer_name: '',
  amount: '',
  currency: 'TRY',
  due_date: new Date().toISOString().slice(0, 10),
  description: '',
})

onMounted(() => {
  if (props.editing) {
    // Only copy safe editable fields — never include paid_at, status, id, etc.
    form.value = {
      customer_name: props.editing.customer_name || '',
      amount: props.editing.amount || '',
      currency: props.editing.currency || 'TRY',
      due_date: props.editing.due_date
        ? new Date(props.editing.due_date).toISOString().slice(0, 10)
        : new Date().toISOString().slice(0, 10),
      description: props.editing.description || '',
    }
  }
})

async function handleSubmit() {
  loading.value = true; error.value = ''
  try {
    if (props.editing) {
      await api.put(`/receivables/${props.editing.id}`, form.value)
    } else {
      await api.post('/receivables', form.value)
    }
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
.modal { background: var(--bg-card); border-radius: 16px; padding: 28px; width: 100%; max-width: 480px; max-height: 90vh; overflow-y: auto; color: var(--text-main); }
.modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.modal-header h2 { font-size: 18px; font-weight: 600; color: var(--text-main); }
.modal-header button { background: none; border: none; font-size: 20px; cursor: pointer; color: var(--text-muted); }
.modal-form { display: flex; flex-direction: column; gap: 14px; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.form-group { display: flex; flex-direction: column; gap: 5px; }
.form-group label { font-size: 12px; font-weight: 500; color: var(--text-muted); }
.form-group input, .form-group select, .form-group textarea { padding: 9px 12px; border: 1px solid var(--border-color); border-radius: 8px; font-size: 14px; background: var(--input-bg); color: var(--text-main); }
.modal-actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 4px; }
.btn-cancel { padding: 9px 18px; background: var(--bg-app); border: 1px solid var(--border-color); border-radius: 8px; cursor: pointer; font-size: 14px; color: var(--text-main); }
.btn-submit { padding: 9px 18px; border: none; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 600; color: white; background: var(--primary); }
.btn-submit:disabled { opacity: 0.6; cursor: not-allowed; }
.error-msg { color: #dc2626; font-size: 13px; background: #fef2f2; padding: 10px; border-radius: 6px; }
</style>
