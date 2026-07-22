import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/services/prisma/prisma.service';
import { CreateContactDto } from './dto/create-contact.dto';

@Injectable()
export class ContactService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateContactDto) {
    return this.prisma.contact.create({ data: dto });
  }

  async findAll() {
    return this.prisma.contact.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async findOne(id: string) {
    const contact = await this.prisma.contact.findUnique({ where: { id } });
    if (!contact) throw new NotFoundException('Contact not found');
    return contact;
  }
}
