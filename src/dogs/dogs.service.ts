import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Dog } from './dog.entity';

@Injectable()
export class DogsService {
  constructor(@InjectRepository(Dog) private repo: Repository<Dog>) {}

  async findOne(id: string): Promise<Dog> {
    const dog = await this.repo.findOne({ where: { id } });
    if (!dog) throw new NotFoundException('Dog not found');
    return dog;
  }

  async update(id: string, data: Partial<Dog>): Promise<Dog> {
    const dog = await this.findOne(id);
    Object.assign(dog, data);
    return this.repo.save(dog);
  }
}
