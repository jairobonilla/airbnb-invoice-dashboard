# Airbnb Invoice Dashboard

A web-based operational dashboard that allows a team to process Airbnb reservations and generate Costa Rican electronic invoices on behalf of Airbnb hosts.

## Overview

Hosts add our company as a co-host on Airbnb. The operations team uses this dashboard to:

1. Receive reservation information via API
2. Review reservations after checkout
3. Complete missing invoice information
4. Generate electronic invoices
5. Deliver invoices to customers when required

The host is not involved in day-to-day invoicing operations.

---

## Architecture

```
External System (Airbnb / PMS)
        │
        │ POST /api/reservations/import
        ▼
   NestJS API
        │
        ▼
PostgreSQL (Cloud SQL)
        │
        ▼
   Vue Dashboard
        │
        ▼
  Operations Team
        │
        ▼
 Invoice Provider
```

### Tech Stack

| Layer      | Technology                                    |
|------------|-----------------------------------------------|
| Frontend   | Vue 3, Vite, Vue Router, Pinia, PrimeVue      |
| Backend    | Node.js, NestJS                               |
| Database   | PostgreSQL, Prisma ORM                        |
| Cloud      | GCP Cloud Run, Cloud SQL                      |
| CI/CD      | GitHub Actions, Docker                        |

---

## Reservation Lifecycle

```
IMPORTED → READY_TO_COMPLETE → READY_TO_INVOICE → INVOICED
                                                 → INVOICE_ERROR
                             → CANCELLED
```

| Status              | Description                               |
|---------------------|-------------------------------------------|
| `IMPORTED`          | Reservation entered the system            |
| `READY_TO_COMPLETE` | Waiting for operator to fill in data      |
| `READY_TO_INVOICE`  | All required data is complete             |
| `INVOICED`          | Electronic invoice successfully generated |
| `INVOICE_ERROR`     | Invoice generation failed                 |
| `CANCELLED`         | Reservation should not be invoiced        |

---

## API Reference

### Import Reservation
```http
POST /api/reservations/import
```
```json
{
  "externalReservationId": "HMABC123",
  "propertyName": "Casa Playa",
  "hostName": "Host Demo",
  "guestNameAirbnb": "John Smith",
  "guestCount": 2,
  "checkInDate": "2026-06-10T00:00:00.000Z",
  "checkOutDate": "2026-06-15T00:00:00.000Z",
  "currency": "USD",
  "expectedAmount": 450.00,
  "source": "API"
}
```

### List Reservations
```http
GET /api/reservations?status=&invoiceStatus=&checkOutFrom=&checkOutTo=
```

### Get Reservation
```http
GET /api/reservations/:id
```

### Update Missing Data
```http
PATCH /api/reservations/:id/missing-data
```
```json
{
  "airbnbInvoiceNumber": "ABNB-123456",
  "confirmedAmount": 450.00,
  "requiresElectronicInvoice": true,
  "customerName": "Juan Perez",
  "customerEmail": "juan@email.com",
  "customerTaxId": "1-1111-1111",
  "customerTaxIdType": "FISICA"
}
```

### Generate Invoice
```http
POST /api/reservations/:id/invoice
```

### Dashboard Stats
```http
GET /api/reservations/stats
```

---

## Local Development

### Prerequisites
- Node.js 20+
- PostgreSQL database
- `.env` file with `DATABASE_URL`

### Setup

```bash
# Install dependencies
npm install
npm --prefix frontend install

# Generate Prisma client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# Start backend (port 3000)
npm run dev

# Start frontend (port 5173)
npm run dev:frontend
```

---

## Deployment

The application is deployed as a single Docker container on **GCP Cloud Run**, connecting to **Cloud SQL** via the Cloud SQL Auth Proxy.

### CI/CD Pipeline

Every push to `main` triggers the GitHub Actions workflow:

1. Build Vue frontend
2. Compile NestJS backend
3. Build Docker image
4. Push to Artifact Registry
5. Deploy to Cloud Run

### Required GitHub Secrets

| Secret               | Description                        |
|----------------------|------------------------------------|
| `GCP_PROJECT_ID`     | GCP project ID                     |
| `GCP_SA_KEY`         | Service account JSON key           |
| `GCP_REGION`         | GCP region (e.g. `us-central1`)    |
| `GCP_AR_REPOSITORY`  | Artifact Registry repository name  |
| `CLOUD_SQL_INSTANCE` | Cloud SQL instance ID              |
| `DATABASE_URL`       | PostgreSQL connection string       |

---

## Invoice Requirements

Before an invoice can be generated, the following fields are required:

- Airbnb Invoice Number
- Confirmed Amount

If the customer requests an electronic invoice, these are also required:

- Customer Name
- Customer Email
- Customer Tax ID
- Customer Tax ID Type (`FISICA`, `JURIDICA`, `DIMEX`, `NITE`, `PASSPORT`)
