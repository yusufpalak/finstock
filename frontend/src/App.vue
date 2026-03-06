<template>
  <RouterView />
</template>

<script setup>
import { onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { useThemeStore } from '@/stores/theme'

const { t, locale } = useI18n()
const auth = useAuthStore()
const themeStore = useThemeStore()

// Sync document title with i18n
watch(locale, () => {
  document.title = t('common.app_name')
}, { immediate: true })

onMounted(async () => {
  document.title = t('common.app_name')
  if (auth.isLoggedIn) {
    try { await auth.fetchMe() } catch { auth.logout() }
  }
})
</script>

<style>
:root {
  --bg-app: #f8fafc;
  --bg-card: #ffffff;
  --bg-sidebar: #1e3a5f;
  --text-main: #1e293b;
  --text-muted: #64748b;
  --text-on-sidebar: #ffffff;
  --border-color: #e2e8f0;
  --primary: #1e3a5f;
  --primary-hover: #2c5282;
  --sidebar-hover: rgba(255, 255, 255, 0.1);
  --header-bg: #ffffff;
  --input-bg: #ffffff;
  --table-header-bg: #f8fafc;
  --table-border: #f1f5f9;
  --badge-bg: #f1f5f9;
  --badge-text: #475569;
}

[data-theme="dark"] {
  --bg-app: #0f172a;
  --bg-card: #1e293b;
  --bg-sidebar: #020617;
  --text-main: #f1f5f9;
  --text-muted: #94a3b8;
  --text-on-sidebar: #f1f5f9;
  --border-color: #334155;
  --primary: #38bdf8;
  --primary-hover: #7dd3fc;
  --sidebar-hover: rgba(255, 255, 255, 0.05);
  --header-bg: #1e293b;
  --input-bg: #2d3748;
  --table-header-bg: #1a202c;
  --table-border: #2d3748;
  --badge-bg: #2d3748;
  --badge-text: #cbd5e0;
}

* { box-sizing: border-box; margin: 0; padding: 0; }
body { 
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; 
  background: var(--bg-app); 
  color: var(--text-main); 
  transition: background-color 0.3s, color 0.3s;
}
</style>
