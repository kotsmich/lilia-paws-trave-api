import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpCode,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { TripFinancesService } from './trip-finances.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { CreateTripFinanceEntryDto } from './dto/create-trip-finance-entry.dto';
import { UpdateTripFinanceEntryDto } from './dto/update-trip-finance-entry.dto';
import { PublicTripFinanceEntryDto } from './dto/public-trip-finance-entry.dto';

/**
 * Nested under the trip: a finance entry has no meaning outside one, and the
 * `tripId` in the path lets the service scope every mutation, which makes
 * cross-trip id tampering structurally impossible.
 */
@ApiTags('Trip Finances')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('trips/:tripId/finances')
export class TripFinancesController {
  constructor(private readonly service: TripFinancesService) {}

  @ApiOperation({ summary: 'List all finance entries for a trip (staff only)' })
  @Get()
  async findAll(
    @Param('tripId', ParseUUIDPipe) tripId: string,
  ): Promise<PublicTripFinanceEntryDto[]> {
    const entries = await this.service.findAll(tripId);
    return entries.map(PublicTripFinanceEntryDto.from);
  }

  @ApiOperation({ summary: 'Add an expense or income to a trip (staff only)' })
  @Post()
  async create(
    @Param('tripId', ParseUUIDPipe) tripId: string,
    @Body() body: CreateTripFinanceEntryDto,
  ): Promise<PublicTripFinanceEntryDto> {
    return PublicTripFinanceEntryDto.from(
      await this.service.create(tripId, body),
    );
  }

  @ApiOperation({ summary: 'Update a finance entry (staff only)' })
  @Put(':entryId')
  async update(
    @Param('tripId', ParseUUIDPipe) tripId: string,
    @Param('entryId', ParseUUIDPipe) entryId: string,
    @Body() body: UpdateTripFinanceEntryDto,
  ): Promise<PublicTripFinanceEntryDto> {
    return PublicTripFinanceEntryDto.from(
      await this.service.update(tripId, entryId, body),
    );
  }

  @ApiOperation({ summary: 'Delete a finance entry (staff only)' })
  @Delete(':entryId')
  @HttpCode(200)
  async remove(
    @Param('tripId', ParseUUIDPipe) tripId: string,
    @Param('entryId', ParseUUIDPipe) entryId: string,
  ): Promise<{ id: string }> {
    await this.service.remove(tripId, entryId);
    return { id: entryId };
  }
}
