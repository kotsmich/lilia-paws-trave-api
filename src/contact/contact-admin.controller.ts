import { Controller, Get, Delete, Param, UseGuards, NotFoundException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { ContactService } from './contact.service';

@Controller('admin-portal/contact')
@UseGuards(JwtAuthGuard)
export class ContactAdminController {
  constructor(private readonly contactService: ContactService) {}

  @Get()
  findAll() {
    return this.contactService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const msg = await this.contactService.findOne(id);
    if (!msg) throw new NotFoundException();
    return msg;
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.contactService.delete(id);
  }
}
