import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './services/prisma/prisma.module';
import { MailModule } from './services/mail/mail.module';
import { AuthModule } from './modules/auth/auth.module';
import { UploadModule } from './modules/upload/upload.module';
import { SellersModule } from './modules/sellers/sellers.module';
import { ContactModule } from './modules/contact/contact.module';
import { AdminModule } from './modules/admin/admin.module';
import { BuyersModule } from './modules/buyers/buyers.module';

@Module({
  imports: [ScheduleModule.forRoot(), PrismaModule, MailModule, AuthModule, UploadModule, SellersModule, ContactModule, AdminModule, BuyersModule],
})
export class AppModule {}
