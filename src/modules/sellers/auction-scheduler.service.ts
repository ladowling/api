import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AuctionStatus, VehicleStatus } from '@prisma/client';
import { PrismaService } from 'src/services/prisma/prisma.service';
import { MailService } from 'src/services/mail/mail.service';
import { company } from 'src/services/company.constants';

@Injectable()
export class AuctionSchedulerService {
  private readonly logger = new Logger(AuctionSchedulerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {}

  @Cron(CronExpression.EVERY_30_SECONDS)
  async handleAuctionTransitions() {
    try {
      const now = new Date();
      this.logger.log(`Scheduler tick at ${now.toISOString()}`);

      const activated = await this.prisma.vehicle.updateMany({
        where: {
          status: VehicleStatus.APPROVED,
          auctionStartTime: { lte: now },
        },
        data: { status: VehicleStatus.BIDDING_ACTIVE, auctionStatus: AuctionStatus.ACTIVE },
      });

      if (activated.count > 0) {
        this.logger.log(`Started ${activated.count} auction(s)`);
      }

      const vehiclesToEnd = await this.prisma.vehicle.findMany({
        where: {
          status: VehicleStatus.BIDDING_ACTIVE,
          auctionEndTime: { lte: now },
        },
        select: {
          id: true,
          vehicleName: true,
          make: true,
          model: true,
          year: true,
          highestBid: true,
          minimumAcceptablePrice: true,
        },
      });

      if (vehiclesToEnd.length > 0) {
        await this.prisma.$transaction(
          vehiclesToEnd.flatMap((vehicle) => {
            const reserveMet = vehicle.highestBid >= vehicle.minimumAcceptablePrice && vehicle.highestBid > 0;
            return [
              this.prisma.bid.updateMany({
                where: { vehicleId: vehicle.id, status: 'CURRENT_HIGH_BID' },
                data: { status: reserveMet ? 'WON' : 'OUTBID' },
              }),
              this.prisma.vehicle.update({
                where: { id: vehicle.id },
                data: {
                  status: VehicleStatus.BIDDING_ENDED,
                  auctionStatus: AuctionStatus.ENDED,
                  reserveMet,
                },
              }),
            ];
          }),
        );
        this.logger.log(`Ended ${vehiclesToEnd.length} auction(s)`);

        const staff = await this.prisma.user.findMany({
          where: { role: 'STAFF', isActive: true },
          select: { name: true, email: true },
        });

        await Promise.allSettled(
          vehiclesToEnd.map(async (vehicle) => {
            const reserveMet = vehicle.highestBid >= vehicle.minimumAcceptablePrice && vehicle.highestBid > 0;

            const topBid = await this.prisma.bid.findFirst({
              where: { vehicleId: vehicle.id, status: reserveMet ? 'WON' : 'OUTBID' },
              orderBy: { amount: 'desc' },
              include: {
                buyer: { select: { name: true, email: true } },
                dealership: { select: { name: true } },
              },
            });

            const staffRecipients = [
              { name: 'Lane 16 Admin', email: company.email },
              ...staff.filter((s) => s.email !== company.email),
            ];

            if (reserveMet && topBid) {
              await Promise.allSettled([
                this.mail.sendAuctionWonNotification({
                  buyerName: topBid.buyer.name,
                  email: topBid.buyer.email,
                  vehicleName: vehicle.vehicleName,
                  make: vehicle.make,
                  model: vehicle.model,
                  year: vehicle.year,
                  winningBidAmount: topBid.amount.toFixed(2),
                  dealershipName: topBid.dealership.name,
                }),
                ...staffRecipients.map((s) =>
                  this.mail.sendAuctionEndedStaffNotification({
                    staffName: s.name,
                    email: s.email,
                    vehicleName: vehicle.vehicleName,
                    make: vehicle.make,
                    model: vehicle.model,
                    year: vehicle.year,
                    winningBidAmount: topBid.amount.toFixed(2),
                    winningBuyerName: topBid.buyer.name,
                    winningDealershipName: topBid.dealership.name,
                  }),
                ),
              ]);
            } else {
              // Reserve not met — notify staff only
              await Promise.allSettled(
                staffRecipients.map((s) =>
                  this.mail.sendAuctionEndedStaffNotification({
                    staffName: s.name,
                    email: s.email,
                    vehicleName: vehicle.vehicleName,
                    make: vehicle.make,
                    model: vehicle.model,
                    year: vehicle.year,
                    winningBidAmount: topBid ? topBid.amount.toFixed(2) : '0.00',
                    winningBuyerName: topBid ? topBid.buyer.name : 'N/A',
                    winningDealershipName: topBid ? topBid.dealership.name : 'N/A',
                  }),
                ),
              );
              this.logger.log(`Reserve not met for vehicle ${vehicle.vehicleName} — no winner`);
            }
          }),
        );
      }
    } catch (err) {
      this.logger.error('Auction transition failed', err);
    }
  }
}
