-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'DISABLED');

-- CreateEnum
CREATE TYPE "Platform" AS ENUM ('AIRBNB');

-- CreateEnum
CREATE TYPE "ReservationSource" AS ENUM ('API', 'EMAIL', 'ICAL', 'MANUAL');

-- CreateEnum
CREATE TYPE "ReservationStatus" AS ENUM ('IMPORTED', 'READY_TO_COMPLETE', 'READY_TO_INVOICE', 'INVOICED', 'INVOICE_ERROR', 'CANCELLED');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('NOT_INVOICED', 'READY', 'PROCESSING', 'INVOICED', 'ERROR');

-- CreateEnum
CREATE TYPE "TaxIdType" AS ENUM ('FISICA', 'JURIDICA', 'DIMEX', 'NITE', 'PASSPORT');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('RESERVATION_IMPORTED', 'MISSING_DATA_UPDATED', 'READY_TO_INVOICE', 'INVOICE_REQUESTED', 'INVOICE_SUCCESS', 'INVOICE_ERROR', 'RESERVATION_CANCELLED');

-- CreateTable
CREATE TABLE "app_users" (
    "id" TEXT NOT NULL,
    "google_sub" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reservations" (
    "id" TEXT NOT NULL,
    "external_reservation_id" TEXT NOT NULL,
    "platform" "Platform" NOT NULL DEFAULT 'AIRBNB',
    "source" "ReservationSource" NOT NULL DEFAULT 'API',
    "property_name" TEXT,
    "host_name" TEXT,
    "guest_name_airbnb" TEXT,
    "guest_count" INTEGER,
    "check_in_date" TIMESTAMP(3) NOT NULL,
    "check_out_date" TIMESTAMP(3) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "expected_amount" DECIMAL(12,2),
    "airbnb_invoice_number" TEXT,
    "confirmed_amount" DECIMAL(12,2),
    "requires_electronic_invoice" BOOLEAN NOT NULL DEFAULT false,
    "customer_name" TEXT,
    "customer_email" TEXT,
    "customer_tax_id" TEXT,
    "customer_tax_id_type" "TaxIdType",
    "invoice_status" "InvoiceStatus" NOT NULL DEFAULT 'NOT_INVOICED',
    "generated_invoice_number" TEXT,
    "invoice_receipt_number" TEXT,
    "invoice_pdf_url" TEXT,
    "invoice_xml_url" TEXT,
    "invoice_error_message" TEXT,
    "invoiced_at" TIMESTAMP(3),
    "invoiced_by_app_user_id" TEXT,
    "status" "ReservationStatus" NOT NULL DEFAULT 'IMPORTED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reservations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "app_user_id" TEXT,
    "reservation_id" TEXT,
    "action" "AuditAction" NOT NULL,
    "old_value" JSONB,
    "new_value" JSONB,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "app_users_google_sub_key" ON "app_users"("google_sub");

-- CreateIndex
CREATE UNIQUE INDEX "app_users_email_key" ON "app_users"("email");

-- CreateIndex
CREATE INDEX "reservations_status_idx" ON "reservations"("status");

-- CreateIndex
CREATE INDEX "reservations_invoice_status_idx" ON "reservations"("invoice_status");

-- CreateIndex
CREATE INDEX "reservations_check_out_date_idx" ON "reservations"("check_out_date");

-- CreateIndex
CREATE INDEX "reservations_airbnb_invoice_number_idx" ON "reservations"("airbnb_invoice_number");

-- CreateIndex
CREATE UNIQUE INDEX "reservations_external_reservation_id_platform_key" ON "reservations"("external_reservation_id", "platform");

-- CreateIndex
CREATE INDEX "audit_logs_reservation_id_idx" ON "audit_logs"("reservation_id");

-- CreateIndex
CREATE INDEX "audit_logs_app_user_id_idx" ON "audit_logs"("app_user_id");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_invoiced_by_app_user_id_fkey" FOREIGN KEY ("invoiced_by_app_user_id") REFERENCES "app_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_app_user_id_fkey" FOREIGN KEY ("app_user_id") REFERENCES "app_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_reservation_id_fkey" FOREIGN KEY ("reservation_id") REFERENCES "reservations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
