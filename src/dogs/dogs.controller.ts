import { Controller, Put, Body, Param, UseGuards } from '@nestjs/common';
import { DogsService } from './dogs.service';
import { Dog } from './dog.entity';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { UpdateDogDto } from './update-dog.dto';

@Controller('dogs')
export class DogsController {
  constructor(private readonly dogsService: DogsService) {}

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  update(@Param('id') id: string, @Body() body: UpdateDogDto): Promise<Dog> {
    return this.dogsService.update(id, body);
  }
}
