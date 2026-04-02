import { Controller, Put, Delete, Body, Param, HttpCode, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { DogsService } from './dogs.service';
import { Dog } from './dog.entity';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { UpdateDogDto } from './update-dog.dto';
import { BulkDeleteDogDto } from './bulk-delete-dog.dto';

@ApiTags('Dogs')
@ApiBearerAuth()
@Controller('dogs')
export class DogsController {
  constructor(private readonly dogsService: DogsService) {}

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
