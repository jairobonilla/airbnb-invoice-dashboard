import { IsOptional, IsString, IsNumber, IsBoolean, IsEmail, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { TaxIdType } from '@prisma/client';

export class UpdateMissingDataDto {
  @IsOptional()
  @IsString()
  airbnbInvoiceNumber?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  confirmedAmount?: number;

  @IsOptional()
  @IsBoolean()
  requiresElectronicInvoice?: boolean;

  @IsOptional()
  @IsString()
  customerName?: string;

  @IsOptional()
  @IsEmail()
  customerEmail?: string;

  @IsOptional()
  @IsString()
  customerTaxId?: string;

  @IsOptional()
  @IsEnum(TaxIdType)
  customerTaxIdType?: TaxIdType;
}
