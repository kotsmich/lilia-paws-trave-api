import { Controller, Get, Post, Put, Patch, Delete, Body, Param, HttpCode, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { RequestsService } from './requests.service';
import { TripRequest } from './trip-request.entity';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { CreateTripRequestDto } from './create-trip-request.dto';
import { UpdateStatusDto } from './update-status.dto';
import { AddNoteDto } from './add-note.dto';
import { BulkActionDto } from './bulk-action.dto';

@ApiTags('Requests')
@Controller('requests')
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all trip requests' })
  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(): Promise<TripRequest[]> {
    return this.requestsService.findAll();
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a request by ID' })
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string): Promise<TripRequest> {
    return this.requestsService.findOne(id);
  }

  @ApiOperation({ summary: 'Submit a new trip request' })
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post()
  create(@Body() body: CreateTripRequestDto): Promise<TripRequest> {
    return this.requestsService.create(body);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update request status' })
  @UseGuards(JwtAuthGuard)
  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() body: UpdateStatusDto,
  ): Promise<TripRequest> {
    return this.requestsService.updateStatus(id, body.status);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Approve request and add dogs to trip' })
  @UseGuards(JwtAuthGuard)
  @Post(':id/approve')
  approveRequest(@Param('id') id: string) {
    return this.requestsService.approveRequest(id);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reject a request' })
  @UseGuards(JwtAuthGuard)
  @Put(':id/reject')
  reject(@Param('id') id: string): Promise<TripRequest> {
    return this.requestsService.reject(id);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add or update admin note on a request' })
  @UseGuards(JwtAuthGuard)
  @Patch(':id/note')
  addNote(
    @Param('id') id: string,
    @Body() body: AddNoteDto,
  ): Promise<TripRequest> {
    return this.requestsService.addNote(id, body.note);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Bulk approve multiple pending requests' })
  @UseGuards(JwtAuthGuard)
  @Post('bulk-approve')
  bulkApprove(@Body() body: BulkActionDto) {
    return this.requestsService.bulkApprove(body.ids);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Bulk reject multiple pending requests' })
  @UseGuards(JwtAuthGuard)
  @Post('bulk-reject')
  bulkReject(@Body() body: BulkActionDto) {
    return this.requestsService.bulkReject(body.ids);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a request (soft delete)' })
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @HttpCode(204)
  deleteRequest(@Param('id') id: string): Promise<void> {
    return this.requestsService.deleteRequest(id);
  }
}
