import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Platform, AuditAction, ReservationStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ImportReservationDto } from './dto/import-reservation.dto';
import { ListReservationsDto } from './dto/list-reservations.dto';

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
