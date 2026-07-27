import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/services/prisma/prisma.service';
import { MailService } from 'src/services/mail/mail.service';
import { CreateContactDto } from './dto/create-contact.dto';

@Injectable()
export class ContactService {
  private readonly logger = new Logger(ContactService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {}

  async create(dto: CreateContactDto) {
    const contact = await this.prisma.contact.create({ data: dto });

    this.mail.sendContactFormNotification({
      name: dto.name,
      email: dto.email,
      phoneNo: dto.phoneNo,
      message: dto.message,
    }).catch((err) => this.logger.error('Failed to send contact form notification', err));

    return contact;
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
