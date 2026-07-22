import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { BidStatus, Role, VehicleStatus } from '@prisma/client';
import { hash } from 'argon2';
import { bad } from 'src/utils/error.utils';
import { PrismaService } from 'src/services/prisma/prisma.service';
import { MailService } from 'src/services/mail/mail.service';
import { CreateBidDto } from './dto/create-bid.dto';
import { CreateBuyerDealershipDto, CreateBuyerDto } from './dto/create-buyer.dto';
import { UpdateBuyerDto } from './dto/update-buyer.dto';
import { AssignDealershipsDto } from './dto/assign-dealerships.dto';
import { RegisterForAuctionDto } from './dto/register-auction.dto';

function generateTempPassword(length = 12): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$';
  return Array.from({ length }, () =>
    chars.charAt(Math.floor(Math.random() * chars.length)),
  ).join('');
}

const bidInclude = {
  vehicle: { select: { id: true, vehicleName: true } },
  dealership: { select: { id: true, name: true, address: true } },
  buyer: { select: { id: true, name: true, email: true, phoneNumber: true } },
} as const;

function formatBid(bid: { buyer: object; dealership: object; [key: string]: unknown }) {
  const { buyer, dealership, ...rest } = bid;
  return { ...rest, dealership: { ...dealership, buyer } };
}

const buyerSelect = {
  id: true,
  name: true,
  email: true,
  phoneNumber: true,
  role: true,
  lastModifiedBy: true,
  lastModifiedAt: true,
  createdAt: true,
  dealerships: { select: { id: true, name: true, address: true, isDefault: true } },
} as const;

@Injectable()
export class BuyersService {
  private readonly logger = new Logger(BuyersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {}

  private async resolveDealerships(dealerships: CreateBuyerDealershipDto[], markFirstAsDefault = false) {
    return Promise.all(
      dealerships.map(async (d, index) => {
        const existing = await this.prisma.dealership.findFirst({
          where: { name: d.name },
        });
        if (existing) return { id: existing.id };
        const created = await this.prisma.dealership.create({
          data: { name: d.name, address: d.address, isDefault: markFirstAsDefault && index === 0 },
        });
        return { id: created.id };
      }),
    );
  }

  async createBuyer(dto: CreateBuyerDto, createdBy: string) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) bad('A user with this email already exists');

    const tempPassword = generateTempPassword();
    const dealershipConnections = await this.resolveDealerships(dto.dealerships, true);

    const buyer = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        phoneNumber: dto.phoneNumber,
        password: await hash(tempPassword),
        role: Role.BUYER,
        isAdmin: false,
        lastModifiedBy: createdBy,
        lastModifiedAt: new Date(),
        dealerships: { connect: dealershipConnections },
      },
      select: buyerSelect,
    });

    try {
      await this.mail.sendBuyerWelcomeMail({
        name: dto.name,
        email: dto.email,
        phoneNumber: dto.phoneNumber,
        tempPassword,
      });
    } catch (error) {
      this.logger.error(
        `Failed to send welcome email to buyer ${dto.email}`,
        error,
      );
    }

    return { ...buyer, tempPassword };
  }

  async findAll() {
    return this.prisma.user.findMany({
      where: { role: Role.BUYER },
      select: buyerSelect,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const buyer = await this.prisma.user.findFirst({
      where: { id, role: Role.BUYER },
      select: buyerSelect,
    });
    if (!buyer) throw new NotFoundException('Buyer not found');
    return buyer;
  }

  async updateBuyer(id: string, dto: UpdateBuyerDto, updatedBy: string) {
    const buyer = await this.prisma.user.findFirst({
      where: { id, role: Role.BUYER },
    });
    if (!buyer) throw new NotFoundException('Buyer not found');

    if (dto.email && dto.email !== buyer.email) {
      const existing = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });
      if (existing) bad('A user with this email already exists');
    }

    const { dealerships, ...rest } = dto;
    const dealershipConnections = dealerships
      ? await this.resolveDealerships(dealerships)
      : undefined;

    const tempPassword = generateTempPassword();

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        ...rest,
        password: await hash(tempPassword),
        lastModifiedBy: updatedBy,
        lastModifiedAt: new Date(),
        ...(dealershipConnections && {
          dealerships: { set: dealershipConnections },
        }),
      },
      select: buyerSelect,
    });

    try {
      await this.mail.sendBuyerWelcomeMail({
        name: updated.name,
        email: updated.email,
        phoneNumber: updated.phoneNumber ?? '',
        tempPassword,
      });
    } catch (error) {
      this.logger.error(
        `Failed to send updated credentials email to buyer ${updated.email}`,
        error,
      );
    }

    return { ...updated, tempPassword };
  }

  async assignDealerships(id: string, dto: AssignDealershipsDto, updatedBy: string) {
    const buyer = await this.prisma.user.findFirst({ where: { id, role: Role.BUYER } });
    if (!buyer) throw new NotFoundException('Buyer not found');

    const dealerships = await this.prisma.dealership.findMany({
      where: { id: { in: dto.dealershipIds } },
      select: { id: true },
    });

    if (dealerships.length !== dto.dealershipIds.length) {
      const foundIds = dealerships.map((d) => d.id);
      const missing = dto.dealershipIds.filter((id) => !foundIds.includes(id));
      throw new NotFoundException(`Dealership(s) not found: ${missing.join(', ')}`);
    }

    return this.prisma.user.update({
      where: { id },
      data: {
        dealerships: { set: dealerships },
        lastModifiedBy: updatedBy,
        lastModifiedAt: new Date(),
      },
      select: buyerSelect,
    });
  }

  async registerForAuction(vehicleId: string, dto: RegisterForAuctionDto, buyerId: string) {
    const [buyer, vehicle] = await Promise.all([
      this.prisma.user.findFirst({ where: { id: buyerId, role: Role.BUYER }, include: { dealerships: { select: { id: true, isDefault: true } } } }),
      this.prisma.vehicle.findUnique({ where: { id: vehicleId } }),
    ]);

    if (!buyer) throw new NotFoundException('Buyer not found');
    if (!vehicle) throw new NotFoundException('Vehicle not found');
    if (vehicle.status !== VehicleStatus.BIDDING_ACTIVE && vehicle.status !== VehicleStatus.APPROVED) {
      throw new BadRequestException('You can only register for vehicles that are approved or currently in auction');
    }

    let dealershipId: string;

    if (dto.dealershipId) {
      const owned = buyer.dealerships.some((d) => d.id === dto.dealershipId);
      if (!owned) throw new BadRequestException('This dealership is not associated with your account');
      dealershipId = dto.dealershipId;
    } else if (dto.newDealership) {
      const created = await this.prisma.dealership.create({
        data: {
          name: dto.newDealership.name,
          address: dto.newDealership.address,
          buyers: { connect: { id: buyerId } },
        },
      });
      dealershipId = created.id;
    } else {
      const defaultDealership = buyer.dealerships.find((d) => d.isDefault);
      if (!defaultDealership) {
        throw new BadRequestException('No default dealership found on your account — please provide a dealershipId or newDealership');
      }
      dealershipId = defaultDealership.id;
    }

    return this.prisma.auctionRegistration.upsert({
      where: { buyerId_vehicleId: { buyerId, vehicleId } },
      create: { buyerId, vehicleId, dealershipId },
      update: { dealershipId },
      include: {
        dealership: { select: { id: true, name: true, address: true } },
        vehicle: { select: { id: true, vehicleName: true } },
      },
    });
  }

  async checkHasBid(vehicleId: string, buyerId: string) {
    const registration = await this.prisma.auctionRegistration.findUnique({
      where: { buyerId_vehicleId: { buyerId, vehicleId } },
      select: { hasBid: true },
    });

    return {
      registered: !!registration,
      hasBid: registration?.hasBid ?? false,
    };
  }

  async placeBid(dto: CreateBidDto, buyerId: string) {
    const [vehicle, registration] = await Promise.all([
      this.prisma.vehicle.findUnique({ where: { id: dto.vehicleId } }),
      this.prisma.auctionRegistration.findUnique({
        where: { buyerId_vehicleId: { buyerId, vehicleId: dto.vehicleId } },
      }),
    ]);

    if (!vehicle) throw new NotFoundException('Vehicle listing not found');

    if (vehicle.status !== VehicleStatus.BIDDING_ACTIVE) {
      throw new BadRequestException(
        'Bidding is not active for this vehicle. You can only bid between the auction start and end times.',
      );
    }

    let activeRegistration = registration;
    if (!activeRegistration) {
      const buyerWithDealerships = await this.prisma.user.findUnique({
        where: { id: buyerId },
        include: { dealerships: { select: { id: true, isDefault: true } } },
      });
      const defaultDealership = buyerWithDealerships?.dealerships.find((d) => d.isDefault);
      if (!defaultDealership) {
        throw new BadRequestException(
          'You have no default dealership. Please register for this auction first.',
        );
      }
      activeRegistration = await this.prisma.auctionRegistration.create({
        data: { buyerId, vehicleId: dto.vehicleId, dealershipId: defaultDealership.id },
      });
    }

    if (dto.amount <= vehicle.highestBid) {
      throw new BadRequestException(
        `Bid amount must be higher than the current highest bid of $${vehicle.highestBid}`,
      );
    }

    if (
      vehicle.bidIncrementNo &&
      dto.amount < vehicle.highestBid + vehicle.bidIncrementNo
    ) {
      throw new BadRequestException(
        `Bid must be at least $${vehicle.bidIncrementNo} higher than the current highest bid`,
      );
    }

    const [buyer, dealership] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: buyerId }, select: { name: true } }),
      this.prisma.dealership.findUnique({ where: { id: activeRegistration.dealershipId }, select: { name: true } }),
    ]);
    if (!buyer) throw new NotFoundException('Buyer not found');
    if (!dealership) throw new NotFoundException('Dealership not found');

    const currentHighBid = await this.prisma.bid.findFirst({
      where: { vehicleId: dto.vehicleId, status: BidStatus.CURRENT_HIGH_BID },
      include: { buyer: { select: { name: true, email: true } } },
    });

    await this.prisma.bid.updateMany({
      where: { vehicleId: dto.vehicleId, status: BidStatus.CURRENT_HIGH_BID },
      data: { status: BidStatus.OUTBID },
    });

    if (currentHighBid?.buyer) {
      this.mail.sendOutbidNotification({
        buyerName: currentHighBid.buyer.name,
        email: currentHighBid.buyer.email,
        vehicleName: vehicle.vehicleName,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        yourBidAmount: currentHighBid.amount.toFixed(2),
        newHighBidAmount: dto.amount.toFixed(2),
      }).catch((err) => this.logger.error('Failed to send outbid notification', err));
    }

    const [bid] = await this.prisma.$transaction([
      this.prisma.bid.create({
        data: {
          amount: dto.amount,
          vehicleId: dto.vehicleId,
          buyerId,
          dealershipId: activeRegistration.dealershipId,
        },
        include: bidInclude,
      }),
      this.prisma.vehicle.update({
        where: { id: dto.vehicleId },
        data: {
          highestBid: dto.amount,
          bidCount: { increment: 1 },
          bids: { increment: dto.amount },
          winningBidderName: dealership.name,
          winningBidAmount: dto.amount,
          reserveMet: dto.amount >= vehicle.minimumAcceptablePrice,
          winningDealershipId: activeRegistration.dealershipId,
          winningBuyerId: buyerId,
          highestBidDealerId: activeRegistration.dealershipId,
          highestBidBuyerId: buyerId,
        },
      }),
    ]);

    if (!activeRegistration.hasBid) {
      this.prisma.auctionRegistration.update({
        where: { buyerId_vehicleId: { buyerId, vehicleId: dto.vehicleId } },
        data: { hasBid: true },
      }).catch((err) => this.logger.error('Failed to update hasBid', err));
    }

    return formatBid(bid);
  }

  async findBidsForVehicle(vehicleId: string) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: vehicleId },
    });
    if (!vehicle) throw new NotFoundException('Vehicle listing not found');

    const bids = await this.prisma.bid.findMany({
      where: { vehicleId },
      include: bidInclude,
      orderBy: { createdAt: 'desc' },
    });
    return bids.map(formatBid);
  }

  async findOneBid(id: string) {
    const bid = await this.prisma.bid.findUnique({
      where: { id },
      include: bidInclude,
    });
    if (!bid) throw new NotFoundException('Bid not found');
    return formatBid(bid);
  }
}
