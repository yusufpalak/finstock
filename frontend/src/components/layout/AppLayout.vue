<template>
  <div class="app-layout">
    <!-- Sidebar -->
    <aside class="sidebar" :class="{ collapsed: sidebarCollapsed }">
      <div class="sidebar-header">
        <span class="logo">📊 FinStock</span>
      </div>

      <!-- Trial Banner -->
      <div v-if="auth.isTrial && auth.trialDaysLeft > 0" class="trial-banner">
        {{ t('plans.trial_days_left', { days: auth.trialDaysLeft }) }}
      </div>

      <nav class="sidebar-nav">
        <RouterLink v-for="item in navItems" :key="item.name"
          :to="{ name: item.name, params: { locale: locale } }"
          class="nav-item">
          <span class="nav-icon">{{ item.icon }}</span>
          <span class="nav-label">{{ t(item.label) }}</span>
        </RouterLink>
      </nav>

      <div class="sidebar-footer">
        <div class="user-info">
          <span class="user-name">{{ auth.user?.name }}</span>
          <span class="plan-badge" :class="auth.user?.plan">{{ t(`plans.${auth.user?.plan || 'basic'}`) }}</span>
        </div>
        <button class="logout-btn" @click="handleLogout">{{ t('nav.logout') }}</button>
      </div>
    </aside>

    <!-- Main content -->
    <main class="main-content">
      <header class="topbar">
        <button class="menu-toggle" @click="sidebarCollapsed = !sidebarCollapsed">☰</button>
        <div class="topbar-right">
          <button class="theme-toggle" @click="themeStore.toggleTheme">
            {{ themeStore.theme === 'light' ? '🌙' : '☀️' }}
          </button>
          <select class="locale-select" :value="locale" @change="changeLocale">
            <option value="tr">🇹🇷 TR</option>
            <option value="en">🇬🇧 EN</option>
          </select>
        </div>
      </header>
      <div class="page-content">
        <RouterView />
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useThemeStore } from '@/stores/theme'

const { t, locale } = useI18n()
const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const themeStore = useThemeStore()
const sidebarCollapsed = ref(false)

const navItems = computed(() => [
  { name: 'dashboard', icon: '🏠', label: 'nav.dashboard' },
  { name: 'transactions', icon: '💰', label: 'nav.transactions' },
  { name: 'products', icon: '📦', label: 'nav.products' },
  { name: 'receivables', icon: '📋', label: 'nav.receivables' },
  { name: 'analytics', icon: '📈', label: 'nav.analytics' },
  { name: 'exchange-rates', icon: '💱', label: 'nav.currencies' },
  { name: 'profile', icon: '👤', label: 'common.profile' },
  { name: 'settings', icon: '⚙️', label: 'nav.settings', requiresRole: 'owner' },
].filter(item => !item.requiresRole || auth.user?.role === item.requiresRole))

function changeLocale(e) {
  const newLocale = e.target.value
  const currentName = route.name
  router.push({ name: currentName, params: { locale: newLocale } })
}

function handleLogout() {
  auth.logout()
  router.push({ name: 'login', params: { locale: locale.value } })
}
</script>

<style scoped>
.app-layout { display: flex; height: 100vh; overflow: hidden; background: var(--bg-app); }
.sidebar { width: 240px; background: var(--bg-sidebar); color: var(--text-on-sidebar); display: flex; flex-direction: column; transition: width 0.3s; flex-shrink: 0; }
.sidebar.collapsed { width: 60px; }
.sidebar-header { padding: 20px 16px; border-bottom: 1px solid rgba(255,255,255,0.1); }
.logo { font-size: 18px; font-weight: 700; white-space: nowrap; overflow: hidden; }
.trial-banner { background: #f59e0b; color: white; font-size: 12px; padding: 8px 12px; text-align: center; }
.sidebar-nav { flex: 1; padding: 12px 0; overflow-y: auto; }
.nav-item { display: flex; align-items: center; gap: 12px; padding: 12px 16px; color: rgba(255,255,255,0.7); text-decoration: none; transition: all 0.2s; font-size: 14px; }
.nav-item:hover, .nav-item.router-link-active { background: var(--sidebar-hover); color: white; }
.nav-icon { font-size: 18px; flex-shrink: 0; }
.nav-label { white-space: nowrap; overflow: hidden; }
.sidebar-footer { padding: 16px; border-top: 1px solid rgba(255,255,255,0.1); }
.user-info { margin-bottom: 8px; }
.user-name { display: block; font-size: 13px; font-weight: 600; }
.plan-badge { font-size: 11px; padding: 2px 8px; border-radius: 99px; background: rgba(255,255,255,0.15); }
.plan-badge.pro { background: #f59e0b; color: #1e3a5f; }
.logout-btn { width: 100%; padding: 8px; background: rgba(255,255,255,0.1); color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 13px; }
.logout-btn:hover { background: rgba(255,255,255,0.2); }
.main-content { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
.topbar { height: 56px; background: var(--header-bg); border-bottom: 1px solid var(--border-color); display: flex; align-items: center; padding: 0 24px; justify-content: space-between; flex-shrink: 0; }
.topbar-right { display: flex; align-items: center; gap: 16px; }
.theme-toggle { background: none; border: 1px solid var(--border-color); border-radius: 6px; padding: 6px; cursor: pointer; font-size: 16px; line-height: 1; transition: all 0.2s; }
.theme-toggle:hover { background: var(--bg-app); }
.menu-toggle { background: none; border: none; font-size: 20px; cursor: pointer; color: var(--text-main); }
.locale-select { border: 1px solid var(--border-color); border-radius: 6px; padding: 6px 10px; font-size: 13px; cursor: pointer; background: var(--bg-card); color: var(--text-main); }
.page-content { flex: 1; overflow-y: auto; padding: 24px; background: var(--bg-app); }
</style>
