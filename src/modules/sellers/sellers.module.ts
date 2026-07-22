import { Module } from '@nestjs/common';
import { PrismaService } from 'src/services/prisma/prisma.service';
import { AuctionSchedulerService } from './auction-scheduler.service';
import { SellersController } from './sellers.controller';
import { SellersService } from './sellers.service';

@Module({
  controllers: [SellersController],
  providers: [SellersService, AuctionSchedulerService, PrismaService],
})
export class SellersModule {}
