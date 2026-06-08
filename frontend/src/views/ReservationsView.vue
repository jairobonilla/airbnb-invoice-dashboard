<template>
  <div>
    <div class="page-header">
      <h1>Reservations</h1>
      <p>All imported reservations</p>
    </div>

    <div class="filter-bar">
      <Select
        v-model="statusFilter"
        :options="statusOptions"
        option-label="label"
        option-value="value"
        placeholder="Filter by status"
        show-clear
        style="width: 220px"
      />
    </div>

    <DataTable
      :value="filtered"
      :loading="loading"
      striped-rows
      paginator
      :rows="20"
      :rows-per-page-options="[10, 20, 50]"
    >
      <template #empty>No reservations found.</template>

      <Column field="externalReservationId" header="Reservation ID" sortable />
      <Column field="propertyName" header="Property" sortable>
        <template #body="{ data }">{{ data.propertyName ?? '—' }}</template>
      </Column>
      <Column field="guestNameAirbnb" header="Guest" sortable>
        <template #body="{ data }">{{ data.guestNameAirbnb ?? '—' }}</template>
      </Column>
      <Column field="checkInDate" header="Check-In" sortable>
        <template #body="{ data }">{{ formatDate(data.checkInDate) }}</template>
      </Column>
      <Column field="checkOutDate" header="Check-Out" sortable>
        <template #body="{ data }">{{ formatDate(data.checkOutDate) }}</template>
      </Column>
      <Column field="expectedAmount" header="Amount" sortable>
        <template #body="{ data }">
          {{ data.currency }} {{ formatAmount(data.expectedAmount) }}
        </template>
      </Column>
      <Column field="status" header="Status">
        <template #body="{ data }">
          <Tag :severity="statusSeverity(data.status)" :value="statusLabel(data.status)" />
        </template>
      </Column>
      <Column header="Actions" style="width: 100px">
        <template #body="{ data }">
          <Button
            label="View"
            size="small"
            severity="secondary"
            @click="router.push(`/reservations/${data.id}`)"
          />
        </template>
      </Column>
    </DataTable>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'
import Button from 'primevue/button'
import Select from 'primevue/select'
import { reservationsService } from '../services/reservations'
import type { Reservation, ReservationStatus } from '../types/reservation'

const router = useRouter()
const reservations = ref<Reservation[]>([])
const loading = ref(true)
const statusFilter = ref<ReservationStatus | null>(null)

onMounted(async () => {
  try {
    reservations.value = await reservationsService.list()
  } finally {
    loading.value = false
  }
})

const statusOptions = [
  { label: 'Imported', value: 'IMPORTED' },
  { label: 'Pending Completion', value: 'READY_TO_COMPLETE' },
  { label: 'Ready to Invoice', value: 'READY_TO_INVOICE' },
  { label: 'Invoiced', value: 'INVOICED' },
  { label: 'Invoice Error', value: 'INVOICE_ERROR' },
  { label: 'Cancelled', value: 'CANCELLED' },
]

const filtered = computed(() =>
  statusFilter.value
    ? reservations.value.filter((r) => r.status === statusFilter.value)
    : reservations.value,
)

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
