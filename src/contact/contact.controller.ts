import { Controller, Post, Body } from '@nestjs/common';
import { ContactService } from './contact.service';
import { ContactSubmission } from './contact.entity';
import { CreateContactDto } from './create-contact.dto';

@Controller('contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Post()
  create(@Body() body: CreateContactDto): Promise<ContactSubmission> {
    return this.contactService.create(body);
  }
}
