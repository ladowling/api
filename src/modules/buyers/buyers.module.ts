import { Module } from '@nestjs/common';
import { PrismaService } from 'src/services/prisma/prisma.service';
import { BuyersController } from './buyers.controller';
import { BuyersService } from './buyers.service';

@Module({
  controllers: [BuyersController],
  providers: [BuyersService, PrismaService],
})
export class BuyersModule {}
