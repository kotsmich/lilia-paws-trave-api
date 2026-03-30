import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MailerService } from '@nestjs-modules/mailer';
import { ContactSubmission } from './contact.entity';
import { AppGateway } from '../gateway/app.gateway';

@Injectable()
export class ContactService {
  constructor(
    @InjectRepository(ContactSubmission) private repo: Repository<ContactSubmission>,
    private mailerService: MailerService,
    private readonly appGateway: AppGateway,
  ) {}

  async create(data: Partial<ContactSubmission>): Promise<ContactSubmission> {
    const submission = this.repo.create(data);
    const saved = await this.repo.save(submission);

    this.appGateway.emitNewMessage(saved);

    try {
      await this.mailerService.sendMail({
        to: process.env['MAIL_TO'] ?? 'liliapawstravel@gmail.com',
        subject: `New Contact Message from ${saved.name}`,
        template: 'contact-notification',
        context: {
          name: saved.name,
          email: saved.email,
          phone: saved.phone ?? '—',
          subject: saved.subject ?? '—',
          message: saved.message,
          submittedAt: saved.submittedAt.toLocaleString(),
        },
      });
    } catch (err) {
      console.error('Failed to send contact notification email:', err);
    }

    return saved;
  }

  findAll(): Promise<ContactSubmission[]> {
    return this.repo.find({ order: { submittedAt: 'DESC' } });
  }

  async findOne(id: string): Promise<ContactSubmission | null> {
    const submission = await this.repo.findOne({ where: { id } });
    if (submission && !submission.isRead) {
      submission.isRead = true;
      await this.repo.save(submission);
    }
    return submission;
  }

  async delete(id: string): Promise<{ id: string }> {
    await this.repo.delete(id);
    return { id };
  }
}
