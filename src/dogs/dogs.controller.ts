import { Controller, Put, Body, Param, UseGuards } from '@nestjs/common';
import { DogsService } from './dogs.service';
import { Dog } from './dog.entity';
import { JwtAuthGuard } from '../auth/jwt.guard';

@Controller('dogs')
export class DogsController {
  constructor(private readonly dogsService: DogsService) {}

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  update(@Param('id') id: string, @Body() body: Partial<Dog>): Promise<Dog> {
    return this.dogsService.update(id, body);
  }
}
