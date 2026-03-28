import { Controller, Post, Body } from '@nestjs/common';
import { ContactService } from './contact.service';
import { ContactSubmission } from './contact.entity';

@Controller('contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Post()
  create(@Body() body: Partial<ContactSubmission>): Promise<ContactSubmission> {
    return this.contactService.create(body);
  }
}
