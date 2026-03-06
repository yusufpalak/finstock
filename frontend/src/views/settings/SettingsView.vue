<template>
  <div class="settings-page">
    <div class="header">
      <h1>{{ t('nav.settings') }}</h1>
      <button class="btn-primary" @click="showAddModal = true">{{ t('common.add') }}</button>
    </div>

    <div class="users-card">
      <div class="card-header">
        <h2>{{ t('nav.dashboard') }} - {{ t('auth.name') }}</h2>
        <div v-if="auth.user?.plan === 'unlimited'" class="filter-group">
          <select v-model="selectedTenant" @change="fetchUsers" class="tenant-select">
            <option value="">{{ t('common.all_tenants') }}</option>
            <option v-for="tnt in tenants" :key="tnt.id" :value="tnt.id">{{ tnt.name }}</option>
          </select>
        </div>
      </div>
      
      <div v-if="loading" class="loading-state">{{ t('common.loading') }}</div>
      
      <table v-else class="users-table">
        <thead>
          <tr>
            <th>{{ t('auth.name') }}</th>
            <th>{{ t('auth.email') }}</th>
            <th>{{ t('common.role') }}</th>
            <th>{{ t('common.status') }}</th>
            <th>{{ t('common.actions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in users" :key="user.id">
            <td>{{ user.name }}</td>
            <td>{{ user.email }}</td>
            <td>
              <span class="role-badge" :class="user.role">{{ user.role === 'owner' ? t('common.owner') : t('common.staff') }}</span>
            </td>
            <td>
              <span class="status-badge" :class="user.is_active ? 'active' : 'inactive'">
                {{ user.is_active ? t('common.active') : t('common.inactive') }}
              </span>
            </td>
            <td>
              <div class="actions">
                <button class="btn-icon" @click="editUser(user)">✏️</button>
                <button class="btn-icon delete" @click="confirmDelete(user)" :disabled="user.id === auth.user?.id">🗑️</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modals (Add/Edit) -->
    <div v-if="showAddModal || editingUser" class="modal-overlay">
      <div class="modal-content">
        <h3>{{ editingUser ? t('common.edit') : t('common.add') }}</h3>
        <form @submit.prevent="saveUser">
          <div class="form-group">
            <label>{{ t('auth.name') }}</label>
            <input v-model="form.name" type="text" required />
          </div>
          <!-- Company Name (Only for Owner + Unlimited) -->
          <div class="form-group" v-if="canEditCompany">
            <label>{{ t('company.name') }}</label>
            <input v-model="tenantName" type="text" :placeholder="t('company.name')" />
          </div>
          <div class="form-group">
            <label>{{ t('auth.email') }}</label>
            <input v-model="form.email" type="email" required />
          </div>
          <div class="form-group">
            <label>{{ t('auth.password') }} {{ editingUser ? '(Boş bırakılırsa değişmez)' : '' }}</label>
            <input v-model="form.password" type="password" :required="!editingUser" minlength="6" />
          </div>
          <div class="form-group">
            <label>{{ t('common.role') }}</label>
            <select v-model="form.role">
              <option value="owner">{{ t('common.owner') }}</option>
              <option value="staff">{{ t('common.staff') }}</option>
            </select>
          </div>
          <div v-if="editingUser" class="form-group-checkbox">
            <input type="checkbox" v-model="form.is_active" :true-value="1" :false-value="0" />
            <label>{{ t('common.active') }}</label>
          </div>
          
          <div class="modal-actions">
            <button type="button" class="btn-secondary" @click="closeModal">{{ t('common.cancel') }}</button>
            <button type="submit" class="btn-primary" :disabled="saving">{{ saving ? t('common.loading') : t('common.save') }}</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import api from '@/services/api'
import { useAuthStore } from '@/stores/auth'

const { t } = useI18n()
const auth = useAuthStore()
const API = import.meta.env.VITE_API_BASE_URL || '/api/v1'

const users = ref([])
const tenants = ref([])
const selectedTenant = ref('')
const loading = ref(false)
const saving = ref(false)
const savingTenant = ref(false)
const showAddModal = ref(false)
const editingUser = ref(null)
const tenantName = ref('')

const canEditCompany = computed(() => auth.user?.role === 'owner' && auth.user?.plan === 'unlimited')

const form = ref({
  name: '',
  email: '',
  password: '',
  role: 'staff',
  is_active: 1
})

async function fetchTenants() {
  if (auth.user?.plan !== 'unlimited') return
  try {
    const { data } = await api.get('/tenants')
    tenants.value = data.data
  } catch (err) {
    console.error(err)
  }
}

async function fetchUsers() {
  loading.value = true
  try {
    const params = {}
    if (selectedTenant.value) params.tenantId = selectedTenant.value
    
    const { data } = await api.get('/users', { params })
    users.value = data.data
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}

async function fetchCurrentTenant() {
  if (!canEditCompany.value) return
  try {
    const { data } = await api.get('/tenants/me')
    tenantName.value = data.data.name
  } catch (err) {
    console.error(err)
  }
}

async function updateTenantName(id) {
  if (!canEditCompany.value || !tenantName.value || !id) return
  savingTenant.value = true
  try {
    await api.patch(`/tenants/${id}`, { name: tenantName.value })
  } catch (err) {
    console.error('Failed to update tenant name:', err)
  } finally {
    savingTenant.value = false
  }
}

function editUser(user) {
  editingUser.value = user
  form.value = { 
    name: user.name, 
    email: user.email, 
    password: '', 
    role: user.role, 
    is_active: user.is_active 
  }
  tenantName.value = user.tenant_name || ''
}

async function saveUser() {
  saving.value = true
  try {
    if (editingUser.value) {
      await api.patch(`/users/${editingUser.value.id}`, form.value)
      // Update company name of the edited user's tenant
      if (canEditCompany.value && editingUser.value.tenant_id) {
        await updateTenantName(editingUser.value.tenant_id)
      }
    } else {
      await api.post('/users', form.value)
    }
    await fetchUsers()
    closeModal()
  } catch (err) {
    alert(err.response?.data?.error || t('common.error'))
  } finally {
    saving.value = false
  }
}

async function confirmDelete(user) {
  if (confirm(t('common.confirm_delete'))) {
    try {
      await api.delete(`/users/${user.id}`)
      await fetchUsers()
    } catch (err) {
      alert(err.response?.data?.error || t('common.error'))
    }
  }
}

function closeModal() {
  showAddModal.value = false
  editingUser.value = null
  form.value = { name: '', email: '', password: '', role: 'staff', is_active: 1 }
  // Reset tenantName to current filter or my tenant
  if (selectedTenant.value) {
    const tnt = tenants.value.find(t => t.id == selectedTenant.value)
    if (tnt) tenantName.value = tnt.name
  } else {
    fetchCurrentTenant()
  }
}

watch(selectedTenant, (newVal) => {
  if (newVal) {
    const tnt = tenants.value.find(t => t.id == newVal)
    if (tnt) tenantName.value = tnt.name
  } else {
    fetchCurrentTenant()
  }
})

onMounted(() => {
  fetchUsers()
  fetchTenants()
  fetchCurrentTenant()
})
</script>

<style scoped>
.settings-page { max-width: 1000px; margin: 0 auto; color: var(--text-main); }
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }

.settings-grid { display: grid; grid-template-columns: 1fr; gap: 24px; margin-bottom: 24px; }
.settings-card { background: var(--bg-card); border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); overflow: hidden; }
.card-body { padding: 20px; }

.input-with-action { display: flex; gap: 12px; }
.input-with-action input { flex: 1; }

.users-card { background: var(--bg-card); border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); overflow: hidden; }
.card-header { padding: 16px 20px; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; }
.card-header h2 { font-size: 16px; font-weight: 600; color: var(--text-main); }
.tenant-select { padding: 4px 8px; border-radius: 6px; border: 1px solid var(--border-color); font-size: 13px; outline: none; background: var(--input-bg); color: var(--text-main); }

.users-table { width: 100%; border-collapse: collapse; text-align: left; }
.users-table th { padding: 12px 20px; font-size: 13px; font-weight: 600; color: var(--text-muted); background: var(--table-header-bg); }
.users-table td { padding: 16px 20px; font-size: 14px; border-bottom: 1px solid var(--table-border); vertical-align: middle; color: var(--text-main); }

.role-badge { padding: 2px 8px; border-radius: 99px; font-size: 11px; font-weight: 600; text-transform: uppercase; }
.role-badge.owner { background: #fee2e2; color: #dc2626; }
.role-badge.staff { background: #e0f2fe; color: #0284c7; }

.status-badge { padding: 2px 8px; border-radius: 99px; font-size: 11px; font-weight: 600; }
.status-badge.active { background: #dcfce7; color: #16a34a; }
.status-badge.inactive { background: var(--badge-bg); color: var(--text-muted); }

.actions { display: flex; gap: 8px; }
.btn-icon { background: none; border: 1px solid var(--border-color); border-radius: 6px; padding: 4px 8px; cursor: pointer; transition: all 0.2s; color: var(--text-main); }
.btn-icon:hover { background: var(--bg-app); }
.btn-icon.delete:hover { border-color: #fca5a5; background: #fef2f2; }
.btn-icon:disabled { opacity: 0.3; cursor: not-allowed; }

.btn-primary { background: var(--primary); color: white; border: none; border-radius: 8px; padding: 8px 16px; font-size: 14px; font-weight: 600; cursor: pointer; }
.btn-secondary { background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 8px; padding: 8px 16px; font-size: 14px; cursor: pointer; color: var(--text-main); }

.modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal-content { background: var(--bg-card); padding: 28px; border-radius: 16px; width: 100%; max-width: 400px; color: var(--text-main); }
.modal-content h3 { margin-bottom: 20px; font-size: 18px; }

form { display: flex; flex-direction: column; gap: 16px; }
.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-group label { font-size: 13px; font-weight: 500; }
.form-group input, .form-group select { padding: 10px; border: 1px solid var(--border-color); border-radius: 8px; font-size: 14px; background: var(--input-bg); color: var(--text-main); }
.form-group-checkbox { display: flex; align-items: center; gap: 8px; }

.modal-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 12px; }
</style>
