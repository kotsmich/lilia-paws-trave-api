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
  UseInterceptors,
  UploadedFiles,
  ParseUUIDPipe,
  BadRequestException,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { TripResultsService } from './trip-results.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { CreateTripResultDto } from './dto/create-trip-result.dto';
import { UpdateTripResultDto } from './dto/update-trip-result.dto';
import { PublicTripResultDto } from './dto/public-trip-result.dto';
import {
  tripResultPhotoStorage,
  imageFileFilter,
} from '../common/upload.config';

const MAX_PHOTOS_PER_UPLOAD = 20;

@ApiTags('Trip Results')
@Controller('trip-results')
export class TripResultsController {
  constructor(private readonly service: TripResultsService) {}

  @ApiOperation({ summary: 'List all published trip results, newest first' })
  @Get()
  async findAll(): Promise<PublicTripResultDto[]> {
    const results = await this.service.findAll();
    return results.map(PublicTripResultDto.from);
  }

  @ApiOperation({ summary: 'Get a trip result with its full photo gallery' })
  @Get(':id')
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<PublicTripResultDto> {
    return PublicTripResultDto.from(await this.service.findOne(id));
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a trip result' })
  @UseGuards(JwtAuthGuard)
  @Post()
  async create(
    @Body() body: CreateTripResultDto,
  ): Promise<PublicTripResultDto> {
    return PublicTripResultDto.from(await this.service.create(body));
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a trip result' })
  @UseGuards(JwtAuthGuard)
  @Put(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateTripResultDto,
  ): Promise<PublicTripResultDto> {
    return PublicTripResultDto.from(await this.service.update(id, body));
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload photos for a trip result' })
  @UseGuards(JwtAuthGuard)
  @Post(':id/photos')
  @UseInterceptors(
    FilesInterceptor('photos', MAX_PHOTOS_PER_UPLOAD, {
      storage: tripResultPhotoStorage,
      fileFilter: imageFileFilter,
      limits: { fileSize: 50 * 1024 * 1024 },
    }),
  )
  async uploadPhotos(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<PublicTripResultDto> {
    if (!files?.length) throw new BadRequestException('No photos uploaded');
    const urls = files.map(
      (file) => `/api/uploads/trip-results/${file.filename}`,
    );
    return PublicTripResultDto.from(await this.service.addPhotos(id, urls));
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a single photo from a trip result' })
  @UseGuards(JwtAuthGuard)
  @Delete(':id/photos/:photoId')
  async removePhoto(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('photoId', ParseUUIDPipe) photoId: string,
  ): Promise<PublicTripResultDto> {
    return PublicTripResultDto.from(
      await this.service.removePhoto(id, photoId),
    );
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a trip result and all its photos' })
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @HttpCode(200)
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ id: string }> {
    await this.service.remove(id);
    return { id };
  }
}
