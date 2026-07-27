import { Module } from '@nestjs/common';
import { PrismaService } from 'src/services/prisma/prisma.service';
import { DealershipsController } from './dealerships.controller';
import { DealershipsService } from './dealerships.service';

@Module({
  controllers: [DealershipsController],
  providers: [DealershipsService, PrismaService],
})
export class DealershipsModule {}
