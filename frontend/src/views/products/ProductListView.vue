<template>
  <div class="products-page">
    <div class="page-header">
      <h1 class="page-title">{{ t('nav.products') }}</h1>
      <div class="header-actions">
        <button class="btn btn-primary" @click="openForm()">+ {{ t('common.add') }}</button>
        <RouterLink :to="{ name: 'stock-alerts', params: { locale } }" class="btn btn-secondary">
          ⚠️ {{ t('products.alerts_title') }}
        </RouterLink>
      </div>
    </div>

    <!-- Filters -->
    <div class="filters">
      <input type="text" v-model="filters.search" :placeholder="t('common.search')" @input="loadData" />
      <select v-model="filters.category" @change="loadData">
        <option value="">{{ t('products.all_categories') }}</option>
        <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
      </select>
    </div>

    <!-- Table -->
    <div class="table-card">
      <table class="data-table">
        <thead>
          <tr>
            <th>{{ t('products.sku') }}</th>
            <th>{{ t('products.name') }}</th>
            <th>{{ t('transactions.category') }}</th>
            <th>{{ t('products.stock') }}</th>
            <th>{{ t('products.price') }}</th>
            <th>{{ t('common.actions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="store.loading"><td colspan="6" class="loading-row">{{ t('common.loading') }}</td></tr>
          <tr v-else-if="!store.products.length"><td colspan="6" class="empty-row">{{ t('common.no_data') }}</td></tr>
          <tr v-for="p in store.products" :key="p.id">
            <td><code class="sku">{{ p.sku || '-' }}</code></td>
            <td><strong>{{ p.name }}</strong></td>
            <td><span class="category-tag">{{ p.category || '-' }}</span></td>
            <td>
              <span class="stock-badge" :class="{ critical: p.stock_quantity <= p.stock_alert_threshold }">
                {{ p.stock_quantity }} {{ p.unit || 'pcs' }}
              </span>
            </td>
            <td>{{ formatCurrency(p.selling_price, 'TRY') }}</td>
            <td>
              <button class="icon-btn" @click="openEdit(p)">✏️</button>
              <button class="icon-btn danger" @click="confirmDelete(p.id)">🗑️</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Product Form Modal -->
    <ProductFormModal v-if="showForm" :editing="editingItem" @close="showForm = false" @saved="onSaved" />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useProductStore } from '@/stores/products'
import { useFormatters } from '@/composables/useFormatters'
import ProductFormModal from './ProductFormModal.vue'

const { t, locale } = useI18n()
const store = useProductStore()
const { formatCurrency } = useFormatters()

const filters = ref({ search: '', category: '' })
const showForm = ref(false)
const editingItem = ref(null)

const categories = computed(() => {
  const cats = store.products.map(p => p.category).filter(Boolean)
  return [...new Set(cats)]
})

async function loadData() { await store.fetchAll(filters.value) }
function openForm() { editingItem.value = null; showForm.value = true }
function openEdit(item) { editingItem.value = item; showForm.value = true }
function onSaved() { showForm.value = false; loadData() }

async function confirmDelete(id) {
  if (confirm(t('common.confirm_delete'))) await store.remove(id)
}

onMounted(loadData)
</script>

<style scoped>
.products-page { max-width: 1200px; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.page-title { font-size: 24px; font-weight: 700; color: var(--text-main); }
.header-actions { display: flex; gap: 8px; }
.btn { padding: 8px 16px; border-radius: 8px; border: none; cursor: pointer; font-size: 14px; font-weight: 500; text-decoration: none; display: inline-flex; align-items: center; }
.btn-primary { background: var(--primary); color: white; }
.btn-secondary { background: var(--bg-app); color: var(--text-main); border: 1px solid var(--border-color); }
.filters { display: flex; gap: 8px; margin-bottom: 16px; }
.filters input, .filters select { padding: 8px 12px; border: 1px solid var(--border-color); border-radius: 8px; font-size: 14px; background: var(--input-bg); color: var(--text-main); }
.filters input { flex: 1; max-width: 300px; }
.table-card { background: var(--bg-card); border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
.data-table { width: 100%; border-collapse: collapse; font-size: 14px; }
.data-table th { padding: 12px 16px; text-align: left; font-size: 12px; text-transform: uppercase; color: var(--text-muted); border-bottom: 1px solid var(--table-border); background: var(--table-header-bg); }
.data-table td { padding: 12px 16px; border-bottom: 1px solid var(--table-border); color: var(--text-main); }
.sku { background: var(--badge-bg); padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 12px; color: var(--badge-text); }
.category-tag { background: var(--badge-bg); color: var(--badge-text); padding: 2px 8px; border-radius: 4px; font-size: 12px; }
.stock-badge { font-weight: 600; }
.stock-badge.critical { color: #dc2626; }
.icon-btn { background: none; border: none; cursor: pointer; font-size: 16px; padding: 4px; border-radius: 4px; color: var(--text-main); }
.icon-btn:hover { background: var(--bg-app); }
.loading-row, .empty-row { text-align: center; color: #9ca3af; padding: 40px !important; }
</style>
