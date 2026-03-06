<template>
  <div class="auth-page">
    <div class="auth-card">
      <div class="auth-logo">📊 FinStock</div>
      <h1 class="auth-title">{{ t('auth.register_title') }}</h1>
      <p class="trial-hint">✨ {{ t('auth.trial_hint') }}</p>

      <form class="auth-form" @submit.prevent="handleRegister">
        <div class="form-group">
          <label>{{ t('auth.company_name') }}</label>
          <input v-model="form.companyName" type="text" required />
        </div>
        <div class="form-group">
          <label>{{ t('auth.name') }}</label>
          <input v-model="form.name" type="text" required />
        </div>
        <div class="form-group">
          <label>{{ t('auth.email') }}</label>
          <input v-model="form.email" type="email" required />
        </div>
        <div class="form-group">
          <label>{{ t('auth.password') }}</label>
          <input v-model="form.password" type="password" required minlength="8" />
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>{{ t('common.currency') }}</label>
            <select v-model="form.currency">
              <option value="TRY">TRY 🇹🇷</option>
              <option value="USD">USD 🇺🇸</option>
              <option value="EUR">EUR 🇪🇺</option>
            </select>
          </div>
          <div class="form-group">
            <label>{{ t('common.language') }}</label>
            <select v-model="form.locale">
              <option value="tr">{{ t('common.turkish') }}</option>
              <option value="en">{{ t('common.english') }}</option>
            </select>
          </div>
        </div>

        <p v-if="error" class="error-msg">{{ error }}</p>
        <p v-if="success" class="success-msg">{{ success }}</p>

        <button type="submit" class="btn-primary" :disabled="loading">
          {{ loading ? t('common.loading') : t('auth.register') }}
        </button>
      </form>

      <p class="auth-switch">
        {{ t('auth.have_account') }}
        <RouterLink :to="{ name: 'login', params: { locale } }">{{ t('auth.login') }}</RouterLink>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const { t, locale } = useI18n()
const router = useRouter()
const auth = useAuthStore()

const form = ref({ companyName: '', name: '', email: '', password: '', currency: 'TRY', locale: 'tr', timezone: 'Europe/Istanbul' })
const loading = ref(false)
const error = ref('')
const success = ref('')

async function handleRegister() {
  loading.value = true; error.value = ''; success.value = ''
  try {
    await auth.register(form.value)
    success.value = 'Account created! Redirecting to login...'
    setTimeout(() => router.push({ name: 'login', params: { locale: form.value.locale } }), 1500)
  } catch (err) {
    error.value = err.response?.data?.error || t('common.error')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #1e3a5f 0%, #2e86ab 100%); }
.auth-card { background: white; border-radius: 16px; padding: 40px; width: 100%; max-width: 440px; box-shadow: 0 20px 60px rgba(0,0,0,0.2); }
.auth-logo { font-size: 24px; font-weight: 700; color: #1e3a5f; text-align: center; margin-bottom: 6px; }
.auth-title { font-size: 20px; font-weight: 600; color: #1e293b; text-align: center; margin-bottom: 6px; }
.trial-hint { text-align: center; font-size: 13px; color: #16a34a; margin-bottom: 24px; }
.auth-form { display: flex; flex-direction: column; gap: 14px; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.form-group { display: flex; flex-direction: column; gap: 5px; }
.form-group label { font-size: 13px; font-weight: 500; color: #374151; }
.form-group input, .form-group select { padding: 10px 14px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; outline: none; }
.form-group input:focus { border-color: #2e86ab; }
.btn-primary { padding: 12px; background: #1e3a5f; color: white; border: none; border-radius: 8px; font-size: 15px; font-weight: 600; cursor: pointer; }
.btn-primary:hover { background: #2e86ab; }
.btn-primary:disabled { opacity: 0.6; }
.error-msg { color: #dc2626; font-size: 13px; background: #fef2f2; padding: 10px; border-radius: 6px; }
.success-msg { color: #16a34a; font-size: 13px; background: #dcfce7; padding: 10px; border-radius: 6px; }
.auth-switch { text-align: center; margin-top: 20px; font-size: 13px; color: #6b7280; }
.auth-switch a { color: #2e86ab; font-weight: 500; text-decoration: none; }
</style>
