import { Injectable } from '@nestjs/common';
import { iUpload } from 'prisma/schema';
import { PrismaService } from 'src/services/prisma/prisma.service';
import { IAuthUser } from '../auth/auth.types';

@Injectable()
export class UploadService {
  constructor(private readonly prisma: PrismaService) {}

  async upload(id: string, file: Express.Multer.File, order: number) {
    return this.prisma.upload.create({
      data: {
        id,
        data: new Uint8Array(file.buffer),
        size: file.size,
        name: file.originalname,
        type: file.mimetype,
        order,
      },
      ...iUpload,
    });
  }

  async cleanup(ids: string[], user: IAuthUser) {
    return this.prisma.upload.deleteMany({
      where: {
        id: { in: ids },
        userId: user.id,
      },
    });
  }

  async download(id: string) {
    return this.prisma.upload.findUnique({
      where: { id },
      select: { type: true, size: true, data: true, name: true },
    });
  }

  async getUploads(ids: string[]) {
    return this.prisma.upload.findMany({
      where: { id: { in: ids } },
      ...iUpload,
    });
  }
}
