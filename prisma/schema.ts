import { Prisma } from '@prisma/client';

export const iUpload = {
  select: {
    id: true,
    name: true,
    type: true,
    size: true,
    order: true,
    userId: true,
    createdAt: true,
  },
} satisfies Prisma.UploadDefaultArgs;
