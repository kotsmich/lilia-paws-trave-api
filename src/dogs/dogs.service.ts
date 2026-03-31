import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Dog } from './dog.entity';
import { UpdateDogDto } from './update-dog.dto';

@Injectable()
export class DogsService {
  constructor(@InjectRepository(Dog) private repo: Repository<Dog>) {}

  /** Find a dog by ID. */
  async findOne(id: string): Promise<Dog> {
    const dog = await this.repo.findOne({ where: { id } });
    if (!dog) throw new NotFoundException('Dog not found');
    return dog;
  }

  /** Update a dog using only whitelisted DTO fields. */
  async update(id: string, data: UpdateDogDto): Promise<Dog> {
    const dog = await this.findOne(id);
    if (data.name !== undefined) dog.name = data.name;
    if (data.size !== undefined) dog.size = data.size;
    if (data.age !== undefined) dog.age = data.age;
    if (data.chipId !== undefined) dog.chipId = data.chipId;
    if (data.pickupLocation !== undefined) dog.pickupLocation = data.pickupLocation;
    if (data.dropLocation !== undefined) dog.dropLocation = data.dropLocation;
    if (data.notes !== undefined) dog.notes = data.notes;
    return this.repo.save(dog);
  }
}
