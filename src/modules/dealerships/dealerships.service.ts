import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/services/prisma/prisma.service';
import { CreateDealershipDto } from './dto/create-dealership.dto';
import { UpdateDealershipDto } from './dto/update-dealership.dto';

const dealershipSelect = {
  id: true,
  name: true,
  address: true,
  createdAt: true,
  buyers: { select: { id: true, name: true, email: true, phoneNumber: true } },
} as const;

@Injectable()
export class DealershipsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateDealershipDto) {
    const { buyerId, ...rest } = dto;
    return this.prisma.dealership.create({
      data: {
        ...rest,
        ...(buyerId ? { buyers: { connect: { id: buyerId } } } : {}),
      },
      select: dealershipSelect,
    });
  }

  async findAll() {
    return this.prisma.dealership.findMany({
      orderBy: { createdAt: 'desc' },
      select: dealershipSelect,
    });
  }

  async findOne(id: string) {
    const dealership = await this.prisma.dealership.findUnique({
      where: { id },
      select: dealershipSelect,
    });
    if (!dealership) throw new NotFoundException('Dealership not found');
    return dealership;
  }

  async update(id: string, dto: UpdateDealershipDto) {
    const dealership = await this.prisma.dealership.findUnique({ where: { id } });
    if (!dealership) throw new NotFoundException('Dealership not found');
    return this.prisma.dealership.update({ where: { id }, data: dto, select: dealershipSelect });
  }

  async remove(id: string) {
    const dealership = await this.prisma.dealership.findUnique({ where: { id } });
    if (!dealership) throw new NotFoundException('Dealership not found');
    await this.prisma.dealership.delete({ where: { id } });
    return { message: 'Dealership deleted successfully' };
  }
}
