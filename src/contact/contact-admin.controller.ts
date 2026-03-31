import { Controller, Get, Delete, Param, UseGuards, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { ContactService } from './contact.service';

@ApiTags('Contact Admin')
@ApiBearerAuth()
@Controller('admin-portal/contact')
@UseGuards(JwtAuthGuard)
export class ContactAdminController {
  constructor(private readonly contactService: ContactService) {}

  @ApiOperation({ summary: 'List all contact submissions' })
  @Get()
  findAll() {
    return this.contactService.findAll();
  }

  @ApiOperation({ summary: 'Get a contact submission by ID' })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const msg = await this.contactService.findOne(id);
    if (!msg) throw new NotFoundException();
    return msg;
  }

  @ApiOperation({ summary: 'Delete a contact submission' })
  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.contactService.delete(id);
  }
}
