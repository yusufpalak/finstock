<template>
  <div class="chart-wrapper">
    <Line v-if="chartData" :data="chartData" :options="chartOptions" />
    <p v-else class="no-data">{{ t('common.no_data') }}</p>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Line } from 'vue-chartjs'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js'
import { useI18n } from 'vue-i18n'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

const props = defineProps({ data: { type: Array, default: () => [] } })
const { t } = useI18n()

const chartData = computed(() => {
  if (!props.data?.length) return null

  const dates = [...new Set(props.data.map(d => d.transaction_date || d.rate_date))].sort()
  const incomeMap = {}
  const expenseMap = {}

  props.data.forEach(d => {
    const date = d.transaction_date
    if (d.type === 'income') incomeMap[date] = (incomeMap[date] || 0) + parseFloat(d.total || 0)
    if (d.type === 'expense') expenseMap[date] = (expenseMap[date] || 0) + parseFloat(d.total || 0)
  })

  return {
    labels: dates,
    datasets: [
      {
        label: t('transactions.income'),
        data: dates.map(d => incomeMap[d] || 0),
        borderColor: '#22c55e',
        backgroundColor: 'rgba(34,197,94,0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: t('transactions.expense'),
        data: dates.map(d => expenseMap[d] || 0),
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239,68,68,0.1)',
        fill: true,
        tension: 0.4,
      }
    ]
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: true,
  plugins: { legend: { position: 'top' } },
  scales: { y: { beginAtZero: true } }
}
</script>

<style scoped>
.chart-wrapper { height: 300px; position: relative; }
.no-data { color: #9ca3af; text-align: center; padding: 60px; }
</style>
