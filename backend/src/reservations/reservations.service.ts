import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Platform, AuditAction, ReservationStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ImportReservationDto } from './dto/import-reservation.dto';
import { ListReservationsDto } from './dto/list-reservations.dto';
import { UpdateMissingDataDto } from './dto/update-missing-data.dto';

@Injectable()
export class ReservationsService {
  constructor(private readonly prisma: PrismaService) {}

  async importReservation(dto: ImportReservationDto) {
    const existing = await this.prisma.reservation.findUnique({
      where: {
        externalReservationId_platform: {
          externalReservationId: dto.externalReservationId,
          platform: Platform.AIRBNB,
        },
      },
    });

    if (existing) {
      throw new ConflictException('Reservation already exists');
    }

    return this.prisma.$transaction(async (tx) => {
      const reservation = await tx.reservation.create({
        data: {
          externalReservationId: dto.externalReservationId,
          platform: Platform.AIRBNB,
          source: dto.source ?? 'API',
          propertyName: dto.propertyName,
          hostName: dto.hostName,
          guestNameAirbnb: dto.guestNameAirbnb,
          guestCount: dto.guestCount,
          checkInDate: new Date(dto.checkInDate),
          checkOutDate: new Date(dto.checkOutDate),
          currency: dto.currency ?? 'USD',
          expectedAmount: dto.expectedAmount,
        },
      });

      await tx.auditLog.create({
        data: {
          reservationId: reservation.id,
          action: AuditAction.RESERVATION_IMPORTED,
          metadata: {
            externalReservationId: reservation.externalReservationId,
            source: reservation.source,
          },
        },
      });

      return reservation;
    });
  }

  async updateMissingData(id: string, dto: UpdateMissingDataDto) {
    const reservation = await this.prisma.reservation.findUnique({ where: { id } });

    if (!reservation) throw new NotFoundException('Reservation not found');

    if (
      reservation.status === ReservationStatus.INVOICED ||
      reservation.status === ReservationStatus.CANCELLED
    ) {
      throw new BadRequestException(`Cannot update a reservation with status ${reservation.status}`);
    }

    const airbnbInvoiceNumber = dto.airbnbInvoiceNumber ?? reservation.airbnbInvoiceNumber;
    const confirmedAmount = dto.confirmedAmount ?? reservation.confirmedAmount;
    const requiresElectronicInvoice = dto.requiresElectronicInvoice ?? reservation.requiresElectronicInvoice;
    const customerName = dto.customerName ?? reservation.customerName;
    const customerEmail = dto.customerEmail ?? reservation.customerEmail;
    const customerTaxId = dto.customerTaxId ?? reservation.customerTaxId;
    const customerTaxIdType = dto.customerTaxIdType ?? reservation.customerTaxIdType;

    const hasBaseData = !!airbnbInvoiceNumber && confirmedAmount != null;
    const hasCustomerData = !!customerName && !!customerEmail && !!customerTaxId && !!customerTaxIdType;
    const newStatus =
      hasBaseData && (!requiresElectronicInvoice || hasCustomerData)
        ? ReservationStatus.READY_TO_INVOICE
        : ReservationStatus.READY_TO_COMPLETE;

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.reservation.update({
        where: { id },
        data: {
          ...(dto.airbnbInvoiceNumber !== undefined && { airbnbInvoiceNumber: dto.airbnbInvoiceNumber }),
          ...(dto.confirmedAmount !== undefined && { confirmedAmount: dto.confirmedAmount }),
          ...(dto.requiresElectronicInvoice !== undefined && { requiresElectronicInvoice: dto.requiresElectronicInvoice }),
          ...(dto.customerName !== undefined && { customerName: dto.customerName }),
          ...(dto.customerEmail !== undefined && { customerEmail: dto.customerEmail }),
          ...(dto.customerTaxId !== undefined && { customerTaxId: dto.customerTaxId }),
          ...(dto.customerTaxIdType !== undefined && { customerTaxIdType: dto.customerTaxIdType }),
          status: newStatus,
        },
      });

      await tx.auditLog.create({
        data: {
          reservationId: id,
          action: AuditAction.MISSING_DATA_UPDATED,
          oldValue: {
            airbnbInvoiceNumber: reservation.airbnbInvoiceNumber,
            confirmedAmount: reservation.confirmedAmount?.toString(),
            requiresElectronicInvoice: reservation.requiresElectronicInvoice,
            customerName: reservation.customerName,
            customerEmail: reservation.customerEmail,
            customerTaxId: reservation.customerTaxId,
            customerTaxIdType: reservation.customerTaxIdType,
          },
          newValue: {
            airbnbInvoiceNumber: updated.airbnbInvoiceNumber,
            confirmedAmount: updated.confirmedAmount?.toString(),
            requiresElectronicInvoice: updated.requiresElectronicInvoice,
            customerName: updated.customerName,
            customerEmail: updated.customerEmail,
            customerTaxId: updated.customerTaxId,
            customerTaxIdType: updated.customerTaxIdType,
          },
        },
      });

      if (newStatus === ReservationStatus.READY_TO_INVOICE) {
        await tx.auditLog.create({
          data: { reservationId: id, action: AuditAction.READY_TO_INVOICE },
        });
      }

      return updated;
    });
  }

  async listReservations(dto: ListReservationsDto) {
    const where: Prisma.ReservationWhereInput = {};

    if (dto.status) where.status = dto.status;
    if (dto.invoiceStatus) where.invoiceStatus = dto.invoiceStatus;
    if (dto.checkOutFrom || dto.checkOutTo) {
      where.checkOutDate = {};
      if (dto.checkOutFrom) {
        (where.checkOutDate as Prisma.DateTimeFilter).gte = new Date(dto.checkOutFrom);
      }
      if (dto.checkOutTo) {
        (where.checkOutDate as Prisma.DateTimeFilter).lte = new Date(dto.checkOutTo);
      }
    }

    return this.prisma.reservation.findMany({
      where,
      orderBy: { checkOutDate: 'desc' },
    });
  }

  async getReservation(id: string) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id },
      include: {
        auditLogs: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!reservation) throw new NotFoundException('Reservation not found');

    return reservation;
  }

  async getStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [pendingCompletion, readyToInvoice, invoicedToday, invoiceErrors] = await Promise.all([
      this.prisma.reservation.count({ where: { status: ReservationStatus.READY_TO_COMPLETE } }),
      this.prisma.reservation.count({ where: { status: ReservationStatus.READY_TO_INVOICE } }),
      this.prisma.reservation.count({
        where: { status: ReservationStatus.INVOICED, invoicedAt: { gte: today, lt: tomorrow } },
      }),
      this.prisma.reservation.count({ where: { status: ReservationStatus.INVOICE_ERROR } }),
    ]);

    return { pendingCompletion, readyToInvoice, invoicedToday, invoiceErrors };
  }
}
