import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { i18n, SUPPORTED_LOCALES, DEFAULT_LOCALE } from '@/i18n'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    // Redirect root → default locale
    { path: '/', redirect: `/${DEFAULT_LOCALE}` },

    // Auth (no layout)
    { path: '/:locale(tr|en)/login', name: 'login', component: () => import('@/views/auth/LoginView.vue'), meta: { guest: true } },
    { path: '/:locale(tr|en)/register', name: 'register', component: () => import('@/views/auth/RegisterView.vue'), meta: { guest: true } },

    // App (with sidebar layout)
    {
      path: '/:locale(tr|en)',
      component: () => import('@/components/layout/AppLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        { path: '', name: 'dashboard', component: () => import('@/views/dashboard/DashboardView.vue') },
        { path: 'transactions', name: 'transactions', component: () => import('@/views/transactions/TransactionListView.vue') },
        { path: 'products', name: 'products', component: () => import('@/views/products/ProductListView.vue') },
        { path: 'products/alerts', name: 'stock-alerts', component: () => import('@/views/products/StockAlertsView.vue') },
        { path: 'receivables', name: 'receivables', component: () => import('@/views/receivables/ReceivablesView.vue') },
        { path: 'analytics', name: 'analytics', component: () => import('@/views/analytics/AnalyticsView.vue') },
        { path: 'currencies', name: 'exchange-rates', component: () => import('@/views/currencies/ExchangeRatesView.vue') },
        { path: 'profile', name: 'profile', component: () => import('@/views/settings/ProfileView.vue') },
        { path: 'settings', name: 'settings', component: () => import('@/views/settings/SettingsView.vue'), meta: { requiresRole: 'owner' } },
      ]
    },

    // Catch-all
    { path: '/:pathMatch(.*)*', redirect: `/${DEFAULT_LOCALE}` },
  ]
})

router.beforeEach((to, from, next) => {
  const locale = to.params.locale
  if (locale && SUPPORTED_LOCALES.includes(locale)) {
    i18n.global.locale.value = locale
    document.documentElement.lang = locale
  }

  const auth = useAuthStore()

  if (to.meta.requiresAuth && !auth.isLoggedIn) {
    return next({ name: 'login', params: { locale: locale || DEFAULT_LOCALE } })
  }

  if (to.meta.requiresRole && auth.user?.role !== to.meta.requiresRole) {
    return next({ name: 'dashboard', params: { locale: locale || DEFAULT_LOCALE } })
  }

  if (to.meta.guest && auth.isLoggedIn) {
    return next({ name: 'dashboard', params: { locale: locale || DEFAULT_LOCALE } })
  }

  next()
})

export default router
