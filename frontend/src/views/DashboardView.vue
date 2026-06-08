<template>
  <div>
    <div class="page-header">
      <h1>Dashboard</h1>
      <p>Reservation processing overview</p>
    </div>

    <div v-if="loading" class="loading-state">
      <ProgressSpinner />
    </div>

    <div v-else class="stats-grid">
      <div v-for="card in statCards" :key="card.label" class="stat-card">
        <div class="stat-icon" :style="{ background: card.bg }">
          <i :class="`pi ${card.icon}`" style="font-size: 1.4rem; color: white;" />
        </div>
        <div>
          <div class="stat-value">{{ card.value }}</div>
          <div class="stat-label">{{ card.label }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import ProgressSpinner from 'primevue/progressspinner'
import { reservationsService } from '../services/reservations'
import type { DashboardStats } from '../types/reservation'

const loading = ref(true)
const stats = ref<DashboardStats | null>(null)

onMounted(async () => {
  try {
    stats.value = await reservationsService.stats()
  } finally {
    loading.value = false
  }
})

const statCards = computed(() => [
  {
    label: 'Pending Completion',
    value: stats.value?.pendingCompletion ?? 0,
    icon: 'pi-clock',
    bg: '#f59e0b',
  },
  {
    label: 'Ready to Invoice',
    value: stats.value?.readyToInvoice ?? 0,
    icon: 'pi-file-edit',
    bg: '#6366f1',
  },
  {
    label: 'Invoiced Today',
    value: stats.value?.invoicedToday ?? 0,
    icon: 'pi-check-circle',
    bg: '#22c55e',
  },
  {
    label: 'Invoice Errors',
    value: stats.value?.invoiceErrors ?? 0,
    icon: 'pi-times-circle',
    bg: '#ef4444',
  },
])
</script>
