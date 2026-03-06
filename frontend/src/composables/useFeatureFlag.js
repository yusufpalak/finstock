import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'

const PLAN_ORDER = { trial: 0, basic: 1, pro: 2, unlimited: 3 }

export function useFeatureFlag() {
  const auth = useAuthStore()

  function canAccess(requiredPlan) {
    const current = PLAN_ORDER[auth.user?.plan] ?? 0
    const required = PLAN_ORDER[requiredPlan] ?? 2
    return current >= required
  }

  const canExport = computed(() => canAccess('pro'))
  const canMultiCurrency = computed(() => canAccess('pro'))
  const canViewRates = computed(() => canAccess('pro'))
  const isProOrTrial = computed(() => auth.user?.plan !== 'basic')

  return { canAccess, canExport, canMultiCurrency, canViewRates, isProOrTrial }
}
