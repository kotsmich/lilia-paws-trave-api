import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { TripsModule } from './trips/trips.module';
import { DogsModule } from './dogs/dogs.module';
import { RequestsModule } from './requests/requests.module';
import { ContactModule } from './contact/contact.module';
import { AuthModule } from './auth/auth.module';
import { CalendarModule } from './calendar/calendar.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: 'database.sqlite',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true,
      logging: true,
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
