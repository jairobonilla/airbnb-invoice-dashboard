<template>
  <div>
    <div class="page-header" style="display: flex; align-items: flex-start; gap: 1rem; flex-wrap: wrap;">
      <Button icon="pi pi-arrow-left" label="Back" severity="secondary" size="small"
        style="margin-top: 0.25rem" @click="router.back()" />
      <div>
        <h1>{{ reservation?.externalReservationId ?? 'Loading...' }}</h1>
        <p v-if="reservation">{{ reservation.propertyName }} · {{ reservation.platform }}</p>
      </div>
    </div>

    <div v-if="loading" class="loading-state">
      <ProgressSpinner />
    </div>

    <div v-else-if="reservation" class="detail-grid">

      <!-- Reservation Data (read-only) -->
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

      <!-- Invoice Data (editable) -->
      <div class="detail-section">
        <h2>Invoice Data</h2>
        <div class="detail-fields">
          <div class="detail-field">
            <label>Airbnb Invoice #</label>
            <InputText v-model="form.airbnbInvoiceNumber" placeholder="ABNB-123456" size="small" />
          </div>
          <div class="detail-field">
            <label>Confirmed Amount</label>
            <InputNumber v-model="form.confirmedAmount" :min="0" :max-fraction-digits="2" size="small"
              style="width: 100%" />
          </div>
          <div class="detail-field" style="align-items: center; display: flex; gap: 0.5rem; padding-top: 1.25rem;">
            <ToggleSwitch v-model="form.requiresElectronicInvoice" />
            <label style="text-transform: none; font-size: 0.875rem; color: #1e293b;">
              Requires Electronic Invoice
            </label>
          </div>
        </div>
      </div>

      <!-- Customer Data (editable, shown when requiresElectronicInvoice) -->
      <div v-if="form.requiresElectronicInvoice" class="detail-section">
        <h2>Customer Data</h2>
        <div class="detail-fields">
          <div class="detail-field">
            <label>Name</label>
            <InputText v-model="form.customerName" placeholder="Juan Perez" size="small" />
          </div>
          <div class="detail-field">
            <label>Email</label>
            <InputText v-model="form.customerEmail" placeholder="juan@email.com" size="small" />
          </div>
          <div class="detail-field">
            <label>Tax ID</label>
            <InputText v-model="form.customerTaxId" placeholder="1-1111-1111" size="small" />
          </div>
          <div class="detail-field">
            <label>Tax ID Type</label>
            <Select v-model="form.customerTaxIdType" :options="taxIdTypes" placeholder="Select type"
              size="small" style="width: 100%" />
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div style="display: flex; gap: 0.75rem; justify-content: flex-end;">
        <Button label="Save" icon="pi pi-check" :loading="saving" @click="save" />
      </div>

      <!-- Audit Timeline -->
      <div v-if="reservation.auditLogs?.length" class="detail-section">
        <h2>Audit Timeline</h2>
        <div class="audit-timeline">
          <div v-for="log in reservation.auditLogs" :key="log.id" class="audit-entry">
            <div class="audit-action">{{ formatAction(log.action) }}</div>
            <div class="audit-date">{{ formatDateTime(log.createdAt) }}</div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import ProgressSpinner from 'primevue/progressspinner'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import ToggleSwitch from 'primevue/toggleswitch'
import Select from 'primevue/select'
import { reservationsService } from '../services/reservations'
import type { Reservation, ReservationStatus } from '../types/reservation'

const route = useRoute()
const router = useRouter()
const reservation = ref<Reservation | null>(null)
const loading = ref(true)
const saving = ref(false)

const form = reactive({
  airbnbInvoiceNumber: '',
  confirmedAmount: null as number | null,
  requiresElectronicInvoice: false,
  customerName: '',
  customerEmail: '',
  customerTaxId: '',
  customerTaxIdType: '',
})

const taxIdTypes = ['FISICA', 'JURIDICA', 'DIMEX', 'NITE', 'PASSPORT']

onMounted(async () => {
  try {
    reservation.value = await reservationsService.get(route.params.id as string)
    const r = reservation.value
    form.airbnbInvoiceNumber = r.airbnbInvoiceNumber ?? ''
    form.confirmedAmount = r.confirmedAmount ? parseFloat(r.confirmedAmount) : null
    form.requiresElectronicInvoice = r.requiresElectronicInvoice
    form.customerName = r.customerName ?? ''
    form.customerEmail = r.customerEmail ?? ''
    form.customerTaxId = r.customerTaxId ?? ''
    form.customerTaxIdType = r.customerTaxIdType ?? ''
  } finally {
    loading.value = false
  }
})

async function save() {
  saving.value = true
  try {
    reservation.value = await reservationsService.updateMissingData(route.params.id as string, {
      airbnbInvoiceNumber: form.airbnbInvoiceNumber || undefined,
      confirmedAmount: form.confirmedAmount ?? undefined,
      requiresElectronicInvoice: form.requiresElectronicInvoice,
      customerName: form.customerName || undefined,
      customerEmail: form.customerEmail || undefined,
      customerTaxId: form.customerTaxId || undefined,
      customerTaxIdType: form.customerTaxIdType || undefined,
    })
  } finally {
    saving.value = false
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function formatAmount(amount: string | null) {
  if (!amount) return '—'
  return parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 2 })
}

function formatAction(action: string) {
  return action.replace(/_/g, ' ')
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

<style scoped>
.audit-timeline {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.audit-entry {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.625rem 0.75rem;
  background: #f8fafc;
  border-radius: 8px;
  border-left: 3px solid #6366f1;
}

.audit-action {
  font-size: 0.875rem;
  font-weight: 500;
  color: #1e293b;
  text-transform: capitalize;
}

.audit-date {
  font-size: 0.75rem;
  color: #64748b;
}
</style>
