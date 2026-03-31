import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { UseGuards } from '@nestjs/common';
import { ContactService } from './contact.service';
import { ContactSubmission } from './contact.entity';
import { CreateContactDto } from './create-contact.dto';

@ApiTags('Contact')
@Controller('contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @ApiOperation({ summary: 'Submit a contact form' })
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post()
  create(@Body() body: CreateContactDto): Promise<ContactSubmission> {
    return this.contactService.create(body);
  }
}
