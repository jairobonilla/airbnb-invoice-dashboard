import { api } from './api'
import type { Reservation, DashboardStats, ReservationStatus, InvoiceStatus } from '../types/reservation'

export interface ListReservationsParams {
  status?: ReservationStatus
  invoiceStatus?: InvoiceStatus
  checkOutFrom?: string
  checkOutTo?: string
}

export const reservationsService = {
  list(params?: ListReservationsParams) {
    return api.get<Reservation[]>('/reservations', { params }).then((r) => r.data)
  },

  get(id: string) {
    return api.get<Reservation>(`/reservations/${id}`).then((r) => r.data)
  },

  stats() {
    return api.get<DashboardStats>('/reservations/stats').then((r) => r.data)
  },
}
