import { Controller, Put, Body, Param } from '@nestjs/common';
import { DogsService } from './dogs.service';
import { Dog } from './dog.entity';

@Controller('dogs')
export class DogsController {
  constructor(private readonly dogsService: DogsService) {}

  @Put(':id')
  update(@Param('id') id: string, @Body() body: Partial<Dog>): Promise<Dog> {
    return this.dogsService.update(id, body);
  }
}
