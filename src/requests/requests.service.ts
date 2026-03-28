import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TripRequest } from './trip-request.entity';

@Injectable()
export class RequestsService {
  constructor(@InjectRepository(TripRequest) private repo: Repository<TripRequest>) {}

  findAll(): Promise<TripRequest[]> {
    return this.repo.find({ relations: ['trip'] });
  }

  async findOne(id: string): Promise<TripRequest> {
    const req = await this.repo.findOne({ where: { id }, relations: ['trip'] });
    if (!req) throw new NotFoundException('Request not found');
    return req;
  }

  async create(data: Partial<TripRequest>): Promise<TripRequest> {
    const req = this.repo.create(data);
    return this.repo.save(req);
  }

  async approve(id: string): Promise<TripRequest> {
    const req = await this.findOne(id);
    req.status = 'approved';
    return this.repo.save(req);
  }

  async reject(id: string): Promise<TripRequest> {
    const req = await this.findOne(id);
    req.status = 'rejected';
    return this.repo.save(req);
  }
}
