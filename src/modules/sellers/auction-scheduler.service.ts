import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AuctionStatus, VehicleStatus } from '@prisma/client';
import { PrismaService } from 'src/services/prisma/prisma.service';
import { MailService } from 'src/services/mail/mail.service';

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
        select: { id: true, vehicleName: true, make: true, model: true, year: true },
      });

      if (vehiclesToEnd.length > 0) {
        await this.prisma.$transaction(
          vehiclesToEnd.flatMap(({ id }) => [
            this.prisma.bid.updateMany({
              where: { vehicleId: id, status: 'CURRENT_HIGH_BID' },
              data: { status: 'WON' },
            }),
            this.prisma.vehicle.update({
              where: { id },
              data: { status: VehicleStatus.BIDDING_ENDED, auctionStatus: AuctionStatus.ENDED },
            }),
          ]),
        );
        this.logger.log(`Ended ${vehiclesToEnd.length} auction(s) and marked winning bids as WON`);

        const staff = await this.prisma.user.findMany({
          where: { role: 'STAFF', isActive: true },
          select: { name: true, email: true },
        });

        await Promise.allSettled(
          vehiclesToEnd.map(async (vehicle) => {
            const winningBid = await this.prisma.bid.findFirst({
              where: { vehicleId: vehicle.id, status: 'WON' },
              include: {
                buyer: { select: { name: true, email: true } },
                dealership: { select: { name: true } },
              },
            });

            if (winningBid) {
              await Promise.allSettled([
                this.mail.sendAuctionWonNotification({
                  buyerName: winningBid.buyer.name,
                  email: winningBid.buyer.email,
                  vehicleName: vehicle.vehicleName,
                  make: vehicle.make,
                  model: vehicle.model,
                  year: vehicle.year,
                  winningBidAmount: winningBid.amount.toFixed(2),
                  dealershipName: winningBid.dealership.name,
                }),
                ...staff.map((s) =>
                  this.mail.sendAuctionEndedStaffNotification({
                    staffName: s.name,
                    email: s.email,
                    vehicleName: vehicle.vehicleName,
                    make: vehicle.make,
                    model: vehicle.model,
                    year: vehicle.year,
                    winningBidAmount: winningBid.amount.toFixed(2),
                    winningBuyerName: winningBid.buyer.name,
                    winningDealershipName: winningBid.dealership.name,
                  }),
                ),
              ]);
            }
          }),
        );
      }
    } catch (err) {
      this.logger.error('Auction transition failed', err);
    }
  }
}
