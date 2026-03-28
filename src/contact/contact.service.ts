import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContactSubmission } from './contact.entity';

@Injectable()
export class ContactService {
  constructor(@InjectRepository(ContactSubmission) private repo: Repository<ContactSubmission>) {}

  async create(data: Partial<ContactSubmission>): Promise<ContactSubmission> {
    const submission = this.repo.create(data);
    return this.repo.save(submission);
  }
}
