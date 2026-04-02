import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { MailerService } from '@nestjs-modules/mailer';
import { ContactSubmission } from './contact.entity';
import { CreateContactDto } from './create-contact.dto';
import { AppGateway } from '../gateway/app.gateway';

@Injectable()
export class ContactService {
  private readonly logger = new Logger(ContactService.name);

  constructor(
    @InjectRepository(ContactSubmission) private repo: Repository<ContactSubmission>,
    private mailerService: MailerService,
    private readonly appGateway: AppGateway,
    private readonly config: ConfigService,
  ) {}

  /** Create a new contact submission from validated DTO data. */
  async create(data: CreateContactDto): Promise<ContactSubmission> {
    const submission = this.repo.create({
      name: data.name,
      email: data.email,
      phone: data.phone,
      subject: data.subject,
      message: data.message,
    });
    const saved = await this.repo.save(submission);

    this.appGateway.emitNewMessage(saved);

    const businessEmail = this.config.get<string>('MAIL_USER', 'liliapawstravel@gmail.com');
    const unsubscribeEmail = this.config.get<string>('UNSUBSCRIBE_EMAIL', 'unsubscribe@liliapawstravel.com');

    try {
      await this.mailerService.sendMail({
        to: this.config.get<string>('MAIL_TO', 'noreply@liliapawstravel.com'),
        subject: `New Contact Message from ${saved.name}`,
        replyTo: saved.email,
        template: 'contact-notification',
        context: {
          name: saved.name,
          email: saved.email,
          phone: saved.phone ?? '—',
          subject: saved.subject ?? '—',
          message: saved.message,
          submittedAt: saved.submittedAt.toLocaleString(),
        },
        text: [
          `New Contact Message from ${saved.name}`,
          `Submitted via liliapawstravel.com`,
          ``,
          `Name: ${saved.name}`,
          `Email: ${saved.email}`,
          `Phone: ${saved.phone ?? '—'}`,
          `Subject: ${saved.subject ?? '—'}`,
          ``,
          `Message:`,
          saved.message,
          ``,
          `Submitted: ${saved.submittedAt.toLocaleString()}`,
        ].join('\n'),
        headers: { 'List-Unsubscribe': `<mailto:${unsubscribeEmail}>` },
      });
    } catch (err) {
      this.logger.error('Failed to send contact notification email', err);
    }

    // Confirm receipt to the submitter
    try {
      await this.mailerService.sendMail({
        to: saved.email,
        subject: 'Thank you for contacting us — Lilia Paws Travel',
        replyTo: businessEmail,
        template: 'contact-confirmation',
        context: {
          name: saved.name,
          subject: saved.subject ?? null,
          message: saved.message,
        },
        text: [
          `Hi ${saved.name},`,
          ``,
          `Thank you for contacting us! We have received your message and will get back to you as soon as possible.`,
          ``,
          ...(saved.subject ? [`Subject: ${saved.subject}`, ``] : []),
          `Your message:`,
          saved.message,
          ``,
          `— Lilia Paws Travel`,
          `liliapawstravel.com`,
        ].join('\n'),
        headers: { 'List-Unsubscribe': `<mailto:${unsubscribeEmail}>` },
      });
    } catch (err) {
      this.logger.error('Failed to send contact confirmation email', err);
    }

    return saved;
  }

  /** Retrieve all contact submissions, newest first. */
  findAll(): Promise<ContactSubmission[]> {
    return this.repo.find({ order: { submittedAt: 'DESC' } });
  }

  /** Find and mark a submission as read. */
  async findOne(id: string): Promise<ContactSubmission | null> {
    const submission = await this.repo.findOne({ where: { id } });
    if (submission && !submission.isRead) {
      submission.isRead = true;
      await this.repo.save(submission);
    }
    return submission;
  }

  /** Soft-delete a contact submission. */
  async delete(id: string): Promise<{ id: string }> {
    await this.repo.softDelete(id);
    return { id };
  }
}
