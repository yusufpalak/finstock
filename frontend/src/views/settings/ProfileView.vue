<template>
  <div class="profile-page">
    <div class="page-header">
      <h1 class="page-title">👤 {{ t('profile.title') }}</h1>
    </div>

    <div class="settings-grid">
      <!-- Personal Info -->
      <div class="settings-card">
        <h3>{{ t('profile.personal_info') }}</h3>
        <form @submit.prevent="updateProfile" class="settings-form">
          <div class="form-group">
            <label>{{ t('auth.name') }}</label>
            <input v-model="profileForm.name" type="text" required />
          </div>
          <div class="form-group">
            <label>{{ t('auth.email') }}</label>
            <input :value="auth.user?.email" type="email" disabled class="disabled-input" />
            <small class="help-text">{{ t('profile.email_cannot_be_changed') }}</small>
          </div>
          <button type="submit" class="btn btn-primary" :disabled="loading.profile">
            {{ loading.profile ? t('common.loading') : t('common.save') }}
          </button>
        </form>
      </div>

      <!-- Change Password -->
      <div class="settings-card">
        <h3>{{ t('profile.change_password') }}</h3>
        <form @submit.prevent="updatePassword" class="settings-form">
          <div class="form-group">
            <label>{{ t('profile.new_password') }}</label>
            <input v-model="passwordForm.password" type="password" required minlength="6" />
          </div>
          <div class="form-group">
            <label>{{ t('profile.confirm_password') }}</label>
            <input v-model="passwordForm.confirm" type="password" required minlength="6" />
          </div>
          <p v-if="passwordError" class="error-msg">{{ passwordError }}</p>
          <button type="submit" class="btn btn-primary" :disabled="loading.password">
            {{ loading.password ? t('common.loading') : t('profile.change_password') }}
          </button>
        </form>
      </div>
    </div>

    <div v-if="successMsg" class="success-toast">
      {{ successMsg }}
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'

const { t } = useI18n()
const auth = useAuthStore()

const loading = reactive({ profile: false, password: false })
const successMsg = ref('')
const passwordError = ref('')

const profileForm = reactive({
  name: auth.user?.name || ''
})

const passwordForm = reactive({
  password: '',
  confirm: ''
})

async function updateProfile() {
  loading.profile = true
  try {
    const res = await api.patch('/users/me', { name: profileForm.name })
    if (res.data.success) {
      // Update local auth store user name
      auth.user.name = res.data.data.name
      showSuccess(t('profile.update_success'))
    }
  } catch (err) {
    console.error(err)
  } finally {
    loading.profile = false
  }
}

async function updatePassword() {
  if (passwordForm.password !== passwordForm.confirm) {
    passwordError.value = t('profile.password_mismatch')
    return
  }
  
  loading.password = true
  passwordError.value = ''
  try {
    const res = await api.patch('/users/me', { password: passwordForm.password })
    if (res.data.success) {
      passwordForm.password = ''
      passwordForm.confirm = ''
      showSuccess(t('profile.update_success'))
    }
  } catch (err) {
    passwordError.value = err.response?.data?.error || t('common.error')
  } finally {
    loading.password = false
  }
}

function showSuccess(msg) {
  successMsg.value = msg
  setTimeout(() => { successMsg.value = '' }, 3000)
}
</script>

<style scoped>
.profile-page { max-width: 900px; }
.page-header { margin-bottom: 24px; }
.page-title { font-size: 24px; font-weight: 700; color: var(--text-main); }

.settings-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
@media (max-width: 768px) { .settings-grid { grid-template-columns: 1fr; } }

.settings-card { background: var(--bg-card); padding: 24px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
.settings-card h3 { margin-bottom: 20px; font-size: 16px; color: var(--text-main); font-weight: 600; }

.settings-form { display: flex; flex-direction: column; gap: 16px; }
.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-group label { font-size: 13px; font-weight: 500; color: var(--text-muted); }
.form-group input { padding: 10px 12px; border: 1px solid var(--border-color); border-radius: 8px; background: var(--input-bg); color: var(--text-main); font-size: 14px; }
.disabled-input { opacity: 0.6; cursor: not-allowed; }
.help-text { font-size: 11px; color: var(--text-muted); }

.btn { padding: 10px 16px; border-radius: 8px; border: none; cursor: pointer; font-size: 14px; font-weight: 600; transition: all 0.2s; }
.btn-primary { background: var(--primary); color: white; }
.btn-primary:disabled { opacity: 0.7; cursor: not-allowed; }

.error-msg { color: #dc2626; font-size: 13px; }
.success-toast { position: fixed; bottom: 24px; right: 24px; background: #22c55e; color: white; padding: 12px 24px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); animation: slideUp 0.3s ease-out; }

@keyframes slideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
</style>
