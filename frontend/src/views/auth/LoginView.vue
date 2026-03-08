<template>
  <div class="auth-page">
    <div class="auth-card">
      <div class="auth-logo">📊 FinStock</div>
      <h1 class="auth-title">{{ t('auth.login_title') }}</h1>

      <form class="auth-form" @submit.prevent="handleLogin">
        <div class="form-group">
          <label>{{ t('auth.email') }}</label>
          <input v-model="form.email" type="email" required :placeholder="t('auth.email')" />
        </div>
        <div class="form-group">
          <label>{{ t('auth.password') }}</label>
          <input v-model="form.password" type="password" required :placeholder="t('auth.password')" />
        </div>

        <p v-if="error" class="error-msg">{{ error }}</p>

        <button type="submit" class="btn-primary" :disabled="loading">
          {{ loading ? t('common.loading') : t('auth.login') }}
        </button>
      </form>

      <p class="auth-switch">
        {{ t('auth.no_account') }}
        <RouterLink :to="{ name: 'register', params: { locale } }">{{ t('auth.register') }}</RouterLink>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const { t, locale } = useI18n()
const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

const form = ref({ email: '', password: '' })
const loading = ref(false)
const error = ref('')

async function handleLogin() {
  loading.value = true
  error.value = ''
  try {
    await auth.login(form.value.email, form.value.password)
    router.push({ name: 'dashboard', params: { locale: locale.value } })
  } catch (err) {
    const msg = err.response?.data?.error
    if (msg === 'SUBSCRIPTION_EXPIRED') {
      error.value = t('auth.subscription_expired')
    } else {
      error.value = msg || t('common.error')
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #1e3a5f 0%, #2e86ab 100%); }
.auth-card { background: white; border-radius: 16px; padding: 40px; width: 100%; max-width: 400px; box-shadow: 0 20px 60px rgba(0,0,0,0.2); }
.auth-logo { font-size: 24px; font-weight: 700; color: #1e3a5f; text-align: center; margin-bottom: 8px; }
.auth-title { font-size: 20px; font-weight: 600; color: #1e293b; text-align: center; margin-bottom: 28px; }
.auth-form { display: flex; flex-direction: column; gap: 16px; }
.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-group label { font-size: 13px; font-weight: 500; color: #374151; }
.form-group input { padding: 10px 14px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; outline: none; transition: border-color 0.2s; }
.form-group input:focus { border-color: #2e86ab; }
.btn-primary { padding: 12px; background: #1e3a5f; color: white; border: none; border-radius: 8px; font-size: 15px; font-weight: 600; cursor: pointer; margin-top: 4px; transition: background 0.2s; }
.btn-primary:hover { background: #2e86ab; }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
.error-msg { color: #dc2626; font-size: 13px; background: #fef2f2; padding: 10px; border-radius: 6px; }
.auth-switch { text-align: center; margin-top: 20px; font-size: 13px; color: #6b7280; }
.auth-switch a { color: #2e86ab; font-weight: 500; text-decoration: none; }
</style>
