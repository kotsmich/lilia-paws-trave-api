import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { MailerModule } from '@nestjs-modules/mailer';
import { join } from 'path';
import { TripsModule } from './trips/trips.module';
import { DogsModule } from './dogs/dogs.module';
import { RequestsModule } from './requests/requests.module';
import { ContactModule } from './contact/contact.module';
import { AuthModule } from './auth/auth.module';
import { CalendarModule } from './calendar/calendar.module';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const HandlebarsAdapter = require('@nestjs-modules/mailer/adapters/handlebars.adapter').HandlebarsAdapter;

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: process.env['DB_PATH'] ?? 'database.sqlite',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true,
      logging: true,
    }),
    MailerModule.forRoot({
      transport: {
        host: process.env['MAIL_HOST'] ?? 'smtp.gmail.com',
        port: parseInt(process.env['MAIL_PORT'] ?? '587'),
        secure: false,
        auth: {
          user: process.env['MAIL_USER'],
          pass: process.env['MAIL_PASS'],
        },
      },
      defaults: {
        from: `"Lilia Paws Travel" <${process.env['MAIL_USER'] ?? 'noreply@liliapawstravel.com'}>`,
      },
      template: {
        dir: join(__dirname, 'mail', 'templates'),
        adapter: new HandlebarsAdapter(),
        options: { strict: true },
      },
    }),
    AuthModule,
    TripsModule,
    DogsModule,
    RequestsModule,
    ContactModule,
    CalendarModule,
  ],
})
export class AppModule {}
