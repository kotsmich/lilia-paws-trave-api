import {
  Controller,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpCode,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  ParseUUIDPipe,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor, FileFieldsInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { DogsService } from './dogs.service';
import { Dog } from './dog.entity';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { UpdateDogDto } from './update-dog.dto';
import { BulkDeleteDogDto } from './bulk-delete-dog.dto';
import {
  dogPhotoStorage,
  dogDocumentStorage,
  dogTempStorage,
  imageFileFilter,
  documentFileFilter,
} from '../common/upload.config';

@ApiTags('Dogs')
@ApiBearerAuth()
@Controller('dogs')
export class DogsController {
  constructor(private readonly dogsService: DogsService) {}

  @ApiOperation({ summary: 'Upload temp dog files during request submission (no auth)' })
  @Post('upload-temp')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'photo', maxCount: 1 },
        { name: 'document', maxCount: 1 },
      ],
      {
        storage: dogTempStorage,
        limits: { fileSize: 10 * 1024 * 1024 },
      },
    ),
  )
  uploadTempFiles(
    @UploadedFiles()
    files: {
      photo?: Express.Multer.File[];
      document?: Express.Multer.File[];
    },
  ): { photoUrl: string | null; documentUrl: string | null } {
    return {
      photoUrl: files.photo?.[0]
        ? `/api/uploads/dogs/temp/${files.photo[0].filename}`
        : null,
      documentUrl: files.document?.[0]
        ? `/api/uploads/dogs/temp/${files.document[0].filename}`
        : null,
    };
  }

  @ApiOperation({ summary: 'Upload a photo for a dog (admin)' })
  @UseGuards(JwtAuthGuard)
  @Post(':id/photo')
  @UseInterceptors(
    FileInterceptor('photo', {
      storage: dogPhotoStorage,
      fileFilter: imageFileFilter,
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async uploadPhoto(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<Dog> {
    if (!file) throw new BadRequestException('No photo file uploaded');
    return this.dogsService.updatePhoto(id, `/api/uploads/dogs/photos/${file.filename}`);
  }

  @ApiOperation({ summary: 'Upload a document for a dog (admin)' })
  @UseGuards(JwtAuthGuard)
  @Post(':id/document')
  @UseInterceptors(
    FileInterceptor('document', {
      storage: dogDocumentStorage,
      fileFilter: documentFileFilter,
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  async uploadDocument(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('documentType') documentType: string,
  ): Promise<Dog> {
    if (!file) throw new BadRequestException('No document file uploaded');
    return this.dogsService.updateDocument(
      id,
      `/api/uploads/dogs/documents/${file.filename}`,
      documentType ?? null,
    );
  }

  @ApiOperation({ summary: 'Update a dog' })
  @UseGuards(JwtAuthGuard)
  @Put(':id')
  update(@Param('id') id: string, @Body() body: UpdateDogDto): Promise<Dog> {
    return this.dogsService.update(id, body);
  }

  @ApiOperation({ summary: 'Bulk delete multiple dogs' })
  @UseGuards(JwtAuthGuard)
  @Delete('bulk')
  @HttpCode(200)
  bulkRemove(@Body() body: BulkDeleteDogDto): Promise<{ deleted: string[] }> {
    return this.dogsService.deleteMany(body.ids);
  }

  @ApiOperation({ summary: 'Delete a dog' })
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @HttpCode(200)
  async remove(@Param('id') id: string): Promise<{ id: string }> {
    await this.dogsService.delete(id);
    return { id };
  }
}
