// backend/src/reservations/dto/import-reservation.dto.ts
import {
    IsDateString,
    IsEnum,
    IsNumber,
    IsOptional,
    IsString,
  } from 'class-validator';
  
  export enum ReservationSourceDto {
    API = 'API',
    EMAIL = 'EMAIL',
    ICAL = 'ICAL',
    MANUAL = 'MANUAL',
  }
  
  export class ImportReservationDto {
    @IsString()
    externalReservationId: string;
  
    @IsOptional()
    @IsString()
    propertyName?: string;
  
    @IsOptional()
    @IsString()
    hostName?: string;
  
    @IsOptional()
    @IsString()
    guestNameAirbnb?: string;
  
    @IsOptional()
    @IsNumber()
    guestCount?: number;
  
    @IsDateString()
    checkInDate: string;
  
    @IsDateString()
    checkOutDate: string;
  
    @IsOptional()
    @IsString()
    currency?: string;
  
    @IsOptional()
    @IsNumber()
    expectedAmount?: number;
  
    @IsOptional()
    @IsEnum(ReservationSourceDto)
    source?: ReservationSourceDto;
  }