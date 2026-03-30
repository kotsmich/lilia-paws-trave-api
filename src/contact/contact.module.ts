import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContactSubmission } from './contact.entity';
import { ContactController } from './contact.controller';
import { ContactAdminController } from './contact-admin.controller';
import { ContactService } from './contact.service';

@Module({
  imports: [TypeOrmModule.forFeature([ContactSubmission])],
  controllers: [ContactController, ContactAdminController],
  providers: [ContactService],
})
export class ContactModule {}
