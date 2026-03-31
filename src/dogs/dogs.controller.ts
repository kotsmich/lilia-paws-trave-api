import { Controller, Put, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { DogsService } from './dogs.service';
import { Dog } from './dog.entity';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { UpdateDogDto } from './update-dog.dto';

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
}
