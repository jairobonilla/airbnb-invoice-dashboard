export type ReservationStatus =
  | 'IMPORTED'
  | 'READY_TO_COMPLETE'
  | 'READY_TO_INVOICE'
  | 'INVOICED'
  | 'INVOICE_ERROR'
  | 'CANCELLED';

export type InvoiceStatus = 'NOT_INVOICED' | 'READY' | 'PROCESSING' | 'INVOICED' | 'ERROR';

export interface Reservation {
  id: string;
  externalReservationId: string;
  platform: string;
  source: string;
  propertyName: string | null;
  hostName: string | null;
  guestNameAirbnb: string | null;
  guestCount: number | null;
  checkInDate: string;
  checkOutDate: string;
  currency: string;
  expectedAmount: string | null;
  confirmedAmount: string | null;
  airbnbInvoiceNumber: string | null;
  requiresElectronicInvoice: boolean;
  customerName: string | null;
  customerEmail: string | null;
  customerTaxId: string | null;
  customerTaxIdType: string | null;
  invoiceStatus: InvoiceStatus;
  generatedInvoiceNumber: string | null;
  invoiceReceiptNumber: string | null;
  invoicePdfUrl: string | null;
  invoiceXmlUrl: string | null;
  invoiceErrorMessage: string | null;
  invoicedAt: string | null;
  status: ReservationStatus;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  pendingCompletion: number;
  readyToInvoice: number;
  invoicedToday: number;
  invoiceErrors: number;
}
