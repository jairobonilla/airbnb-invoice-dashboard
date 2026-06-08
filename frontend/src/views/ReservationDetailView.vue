<template>
  <div>
    <div class="page-header" style="display: flex; align-items: flex-start; gap: 1rem; flex-wrap: wrap;">
      <Button
        icon="pi pi-arrow-left"
        label="Back"
        severity="secondary"
        size="small"
        style="margin-top: 0.25rem"
        @click="router.back()"
      />
      <div>
        <h1>{{ reservation?.externalReservationId ?? 'Loading...' }}</h1>
        <p v-if="reservation">{{ reservation.propertyName }} · {{ reservation.platform }}</p>
      </div>
    </div>

    <div v-if="loading" class="loading-state">
      <ProgressSpinner />
    </div>

    <div v-else-if="reservation" class="detail-grid">
      <div class="detail-section">
        <h2>Reservation Data</h2>
        <div class="detail-fields">
          <div class="detail-field">
            <label>Guest</label>
            <span>{{ reservation.guestNameAirbnb ?? '—' }}</span>
          </div>
          <div class="detail-field">
            <label>Guest Count</label>
            <span>{{ reservation.guestCount ?? '—' }}</span>
          </div>
          <div class="detail-field">
            <label>Check-In</label>
            <span>{{ formatDate(reservation.checkInDate) }}</span>
          </div>
          <div class="detail-field">
            <label>Check-Out</label>
            <span>{{ formatDate(reservation.checkOutDate) }}</span>
          </div>
          <div class="detail-field">
            <label>Expected Amount</label>
            <span>{{ reservation.currency }} {{ formatAmount(reservation.expectedAmount) }}</span>
          </div>
          <div class="detail-field">
            <label>Status</label>
            <Tag :severity="statusSeverity(reservation.status)" :value="statusLabel(reservation.status)" />
          </div>
        </div>
      </div>

      <div class="detail-section">
        <h2>Invoice Data</h2>
        <div class="detail-fields">
          <div class="detail-field">
            <label>Airbnb Invoice #</label>
            <span>{{ reservation.airbnbInvoiceNumber ?? '—' }}</span>
          </div>
          <div class="detail-field">
            <label>Confirmed Amount</label>
            <span>{{ reservation.confirmedAmount ? `${reservation.currency} ${formatAmount(reservation.confirmedAmount)}` : '—' }}</span>
          </div>
          <div class="detail-field">
            <label>Invoice Status</label>
            <span>{{ reservation.invoiceStatus }}</span>
          </div>
          <div class="detail-field">
            <label>Requires Electronic Invoice</label>
            <span>{{ reservation.requiresElectronicInvoice ? 'Yes' : 'No' }}</span>
          </div>
        </div>
      </div>

      <div class="detail-section">
        <h2>Customer Data</h2>
        <div class="detail-fields">
          <div class="detail-field">
            <label>Name</label>
            <span>{{ reservation.customerName ?? '—' }}</span>
          </div>
          <div class="detail-field">
            <label>Email</label>
            <span>{{ reservation.customerEmail ?? '—' }}</span>
          </div>
          <div class="detail-field">
            <label>Tax ID</label>
            <span>{{ reservation.customerTaxId ?? '—' }}</span>
          </div>
          <div class="detail-field">
            <label>Tax ID Type</label>
            <span>{{ reservation.customerTaxIdType ?? '—' }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import ProgressSpinner from 'primevue/progressspinner'
import { reservationsService } from '../services/reservations'
import type { Reservation, ReservationStatus } from '../types/reservation'

const route = useRoute()
const router = useRouter()
const reservation = ref<Reservation | null>(null)
const loading = ref(true)

onMounted(async () => {
  try {
    reservation.value = await reservationsService.get(route.params.id as string)
  } finally {
    loading.value = false
  }
})

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function formatAmount(amount: string | null) {
  if (!amount) return '—'
  return parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 2 })
}

const SEVERITY_MAP: Record<ReservationStatus, string> = {
  IMPORTED: 'secondary',
  READY_TO_COMPLETE: 'warn',
  READY_TO_INVOICE: 'info',
  INVOICED: 'success',
  INVOICE_ERROR: 'danger',
  CANCELLED: 'secondary',
}

const LABEL_MAP: Record<ReservationStatus, string> = {
  IMPORTED: 'Imported',
  READY_TO_COMPLETE: 'Pending',
  READY_TO_INVOICE: 'Ready',
  INVOICED: 'Invoiced',
  INVOICE_ERROR: 'Error',
  CANCELLED: 'Cancelled',
}

function statusSeverity(status: ReservationStatus) {
  return SEVERITY_MAP[status] ?? 'secondary'
}

function statusLabel(status: ReservationStatus) {
  return LABEL_MAP[status] ?? status
}
</script>
