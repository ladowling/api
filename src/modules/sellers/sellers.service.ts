import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { AuctionStatus, VehicleStatus } from '@prisma/client';
import { PrismaService } from 'src/services/prisma/prisma.service';
import { MailService } from 'src/services/mail/mail.service';
import { ApproveVehicleDto } from './dto/approve-vehicle.dto';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { ResolveVehicleDto } from './dto/resolve-vehicle.dto';
import { UpdateBidIncrementDto } from './dto/update-bid-increment.dto';
import { UpdateVehicleValuationDto } from './dto/update-vehicle-valuation.dto';

const uploadSelect = { select: { id: true, name: true } } as const;

const vehicleInclude = {
  uploads: uploadSelect,
  winningDealership: {
    select: {
      id: true,
      name: true,
      address: true,
      buyers: { select: { id: true, name: true, email: true, phoneNumber: true } },
    },
  },
  winningBuyer: { select: { id: true, name: true, email: true, phoneNumber: true } },
  highestBidDealer: {
    select: {
      id: true,
      name: true,
      address: true,
      buyers: { select: { id: true, name: true, email: true, phoneNumber: true } },
    },
  },
  highestBidBuyer: { select: { id: true, name: true, email: true, phoneNumber: true } },
} as const;

@Injectable()
export class SellersService {
  private readonly logger = new Logger(SellersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {}

  async createVehicle(dto: CreateVehicleDto) {
    const { uploads, auctionEndTime, ...rest } = dto;

    return this.prisma.vehicle.create({
      data: {
        ...rest,
        ...(auctionEndTime && { auctionEndTime: new Date(auctionEndTime) }),
        ...(uploads?.length && {
          uploads: { connect: uploads.map((id) => ({ id })) },
        }),
      },
      include: {
        uploads: {
          select: { id: true, name: true, type: true, size: true, order: true },
        },
      },
    });
  }

  async findAllVehicles() {
    return this.prisma.vehicle.findMany({
      orderBy: { createdAt: 'desc' },
      include: vehicleInclude,
    });
  }

  async findOneVehicle(id: string) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id },
      include: vehicleInclude,
    });
    if (!vehicle) throw new NotFoundException('Vehicle listing not found');
    return vehicle;
  }

  async approveVehicle(id: string, dto: ApproveVehicleDto) {
    const vehicle = await this.prisma.vehicle.findUnique({ where: { id } });
    if (!vehicle) throw new NotFoundException('Vehicle listing not found');
    if (
      vehicle.status !== VehicleStatus.PENDING &&
      vehicle.status !== VehicleStatus.AVAILABLE
    ) {
      throw new BadRequestException(
        'Only vehicles in PENDING or AVAILABLE status can be approved or rejected',
      );
    }

    if (dto.status === VehicleStatus.APPROVED && (!dto.auctionStartTime || !dto.auctionEndTime)) {
      throw new BadRequestException('auctionStartTime and auctionEndTime are required when approving a vehicle');
    }

    const updated = await this.prisma.vehicle.update({
      where: { id },
      data: {
        status: dto.status,
        ...(dto.status === VehicleStatus.APPROVED && {
          auctionStartTime: new Date(dto.auctionStartTime!),
          auctionEndTime: new Date(dto.auctionEndTime!),
          auctionStatus: AuctionStatus.INACTIVE,
        }),
      },
      include: vehicleInclude,
    });

    if (dto.status === VehicleStatus.APPROVED) {
      this.notifyBuyersVehicleApproved(updated).catch((err) =>
        this.logger.error('Failed to notify buyers of approved vehicle', err),
      );
    }

    return updated;
  }

  private async notifyBuyersVehicleApproved(vehicle: {
    vehicleName: string;
    make: string;
    model: string;
    year: number;
    location: string;
    auctionStartTime: Date | null;
    auctionEndTime: Date | null;
  }) {
    const buyers = await this.prisma.user.findMany({
      where: { role: 'BUYER', isActive: true },
      select: { email: true, name: true },
    });
    if (!buyers.length) return;

    await Promise.allSettled(
      buyers.map((buyer) =>
        this.mail.sendVehicleApprovedNotification({
          buyerName: buyer.name,
          email: buyer.email,
          vehicleName: vehicle.vehicleName,
          make: vehicle.make,
          model: vehicle.model,
          year: vehicle.year,
          location: vehicle.location,
          auctionStartTime: vehicle.auctionStartTime?.toISOString() ?? 'TBD',
          auctionEndTime: vehicle.auctionEndTime?.toISOString() ?? 'TBD',
        }),
      ),
    );
  }

  async updateBidIncrement(id: string, dto: UpdateBidIncrementDto) {
    const vehicle = await this.prisma.vehicle.findUnique({ where: { id } });
    if (!vehicle) throw new NotFoundException('Vehicle listing not found');

    return this.prisma.vehicle.update({
      where: { id },
      data: { bidIncrementNo: dto.bidIncrementNo },
      include: vehicleInclude,
    });
  }

  async resolveVehicle(id: string, dto: ResolveVehicleDto) {
    const vehicle = await this.prisma.vehicle.findUnique({ where: { id } });
    if (!vehicle) throw new NotFoundException('Vehicle listing not found');
    if (vehicle.status !== VehicleStatus.BIDDING_ENDED) {
      throw new BadRequestException(
        'Only vehicles with BIDDING_ENDED status can be resolved as SOLD or AVAILABLE',
      );
    }

    const data: Record<string, unknown> = { status: dto.status };
    if (dto.status === VehicleStatus.AVAILABLE) {
      data.highestBid = 0;
      data.bidCount = 0;
      data.bids = 0;
      data.winningBidderName = null;
      data.winningBidAmount = null;
      data.reserveMet = false;
    }

    return this.prisma.vehicle.update({
      where: { id },
      data,
      include: vehicleInclude,
    });
  }

  async updateValuation(id: string, dto: UpdateVehicleValuationDto) {
    const vehicle = await this.prisma.vehicle.findUnique({ where: { id } });
    if (!vehicle) throw new NotFoundException('Vehicle listing not found');

    return this.prisma.vehicle.update({
      where: { id },
      data: { ...dto, valuationUpdatedAt: new Date() },
      include: vehicleInclude,
    });
  }
}
