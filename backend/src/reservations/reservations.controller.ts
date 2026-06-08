import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ImportReservationDto } from './dto/import-reservation.dto';
import { ListReservationsDto } from './dto/list-reservations.dto';
import { ReservationsService } from './reservations.service';

@Controller('api/reservations')
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Post('import')
  importReservation(@Body() dto: ImportReservationDto) {
    return this.reservationsService.importReservation(dto);
  }

  @Get('stats')
  getStats() {
    return this.reservationsService.getStats();
  }

  @Get()
  listReservations(@Query() dto: ListReservationsDto) {
    return this.reservationsService.listReservations(dto);
  }

  @Get(':id')
  getReservation(@Param('id') id: string) {
    return this.reservationsService.getReservation(id);
  }
}
