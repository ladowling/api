import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { hash } from 'argon2';
import { bad } from 'src/utils/error.utils';
import { PrismaService } from 'src/services/prisma/prisma.service';
import { MailService } from 'src/services/mail/mail.service';
import { CreateAdminDto } from './dto/create-admin.dto';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';

function generateTempPassword(length = 12): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$';
  return Array.from({ length }, () =>
    chars.charAt(Math.floor(Math.random() * chars.length)),
  ).join('');
}

const staffSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  isAdmin: true,
  isActive: true,
  lastModifiedBy: true,
  lastModifiedAt: true,
  createdAt: true,
} as const;

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {}

  async createAdmin(dto: CreateAdminDto, createdBy: string) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) bad('A user with this email already exists');

    await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        password: await hash(dto.password),
        role: Role.STAFF,
        isAdmin: true,
        lastModifiedBy: createdBy,
        lastModifiedAt: new Date(),
      },
    });

    try {
      await this.mail.sendNewStaffMail({
        name: dto.name,
        email: dto.email,
        tempPassword: dto.password,
      });
    } catch (error) {
      this.logger.error(
        `Failed to send welcome email to admin ${dto.email}`,
        error,
      );
    }

    return { message: 'Admin user created successfully' };
  }

  async createStaff(dto: CreateStaffDto, createdBy: string) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) bad('A user with this email already exists');

    const tempPassword = generateTempPassword();

    await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        password: await hash(tempPassword),
        role: Role.STAFF,
        isAdmin: false,
        lastModifiedBy: createdBy,
        lastModifiedAt: new Date(),
      },
    });

    try {
      await this.mail.sendNewStaffMail({
        name: dto.name,
        email: dto.email,
        tempPassword,
      });
    } catch (error) {
      this.logger.error(
        `Failed to send welcome email to staff ${dto.email}`,
        error,
      );
    }

    return { message: 'Staff account created successfully', tempPassword };
  }

  async findAllStaff() {
    return this.prisma.user.findMany({
      where: { role: Role.STAFF },
      select: staffSelect,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneStaff(id: string) {
    const staff = await this.prisma.user.findFirst({
      where: { id, role: Role.STAFF },
      select: staffSelect,
    });
    if (!staff) throw new NotFoundException('Staff member not found');
    return staff;
  }

  async deactivateStaff(id: string, updatedBy: string) {
    const staff = await this.prisma.user.findFirst({
      where: { id, role: Role.STAFF },
    });
    if (!staff) throw new NotFoundException('Staff member not found');

    return this.prisma.user.update({
      where: { id },
      data: { isActive: false, lastModifiedBy: updatedBy, lastModifiedAt: new Date() },
      select: staffSelect,
    });
  }

  async activateStaff(id: string, updatedBy: string) {
    const staff = await this.prisma.user.findFirst({
      where: { id, role: Role.STAFF },
    });
    if (!staff) throw new NotFoundException('Staff member not found');

    return this.prisma.user.update({
      where: { id },
      data: { isActive: true, lastModifiedBy: updatedBy, lastModifiedAt: new Date() },
      select: staffSelect,
    });
  }

  async updateStaff(id: string, dto: UpdateStaffDto, updatedBy: string) {
    const staff = await this.prisma.user.findFirst({
      where: { id, role: Role.STAFF },
    });
    if (!staff) throw new NotFoundException('Staff member not found');

    if (dto.email && dto.email !== staff.email) {
      const existing = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });
      if (existing) bad('A user with this email already exists');
    }

    const tempPassword = generateTempPassword();

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        ...dto,
        password: await hash(tempPassword),
        lastModifiedBy: updatedBy,
        lastModifiedAt: new Date(),
      },
      select: staffSelect,
    });

    try {
      await this.mail.sendNewStaffMail({
        name: updated.name,
        email: updated.email,
        tempPassword,
      });
    } catch (error) {
      this.logger.error(
        `Failed to send updated credentials email to staff ${updated.email}`,
        error,
      );
    }

    return { ...updated, tempPassword };
  }
}
