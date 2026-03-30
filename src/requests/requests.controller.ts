import { Controller, Get, Post, Put, Patch, Delete, Body, Param, HttpCode, UseGuards } from '@nestjs/common';
import { RequestsService } from './requests.service';
import { TripRequest } from './trip-request.entity';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { CreateTripRequestDto } from './create-trip-request.dto';
import { UpdateStatusDto } from './update-status.dto';

@Controller('requests')
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(): Promise<TripRequest[]> {
    return this.requestsService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string): Promise<TripRequest> {
    return this.requestsService.findOne(id);
  }

  @Post()
  create(@Body() body: CreateTripRequestDto): Promise<TripRequest> {
    return this.requestsService.create(body);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() body: UpdateStatusDto,
  ): Promise<TripRequest> {
    return this.requestsService.updateStatus(id, body.status);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/approve')
  approveRequest(@Param('id') id: string) {
    return this.requestsService.approveRequest(id);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id/reject')
  reject(@Param('id') id: string): Promise<TripRequest> {
    return this.requestsService.reject(id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @HttpCode(204)
  deleteRequest(@Param('id') id: string): Promise<void> {
    return this.requestsService.deleteRequest(id);
  }
}
