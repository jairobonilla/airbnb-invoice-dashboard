import { IsOptional, IsEnum, IsDateString } from 'class-validator';
import { ReservationStatus, InvoiceStatus } from '@prisma/client';

export class ListReservationsDto {
  @IsOptional()
  @IsEnum(ReservationStatus)
  status?: ReservationStatus;

  @IsOptional()
  @IsEnum(InvoiceStatus)
  invoiceStatus?: InvoiceStatus;

  @IsOptional()
  @IsDateString()
  checkOutFrom?: string;

  @IsOptional()
  @IsDateString()
  checkOutTo?: string;
}
