import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'

export function useFormatters() {
  const { locale } = useI18n()
  const auth = useAuthStore()

  function formatCurrency(amount, currency) {
    const cur = currency || auth.user?.base_currency || 'TRY'
    return new Intl.NumberFormat(locale.value === 'tr' ? 'tr-TR' : 'en-US', {
      style: 'currency',
      currency: cur,
      minimumFractionDigits: 2,
    }).format(amount || 0)
  }

  function formatDate(date, format = 'short') {
    if (!date) return '-'
    return new Intl.DateTimeFormat(locale.value === 'tr' ? 'tr-TR' : 'en-US', {
      dateStyle: format,
    }).format(new Date(date))
  }

  function formatNumber(num) {
    return new Intl.NumberFormat(locale.value === 'tr' ? 'tr-TR' : 'en-US').format(num || 0)
  }

  return { formatCurrency, formatDate, formatNumber }
}
