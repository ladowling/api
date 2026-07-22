import { Body, Controller, Get, Patch, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiProperty,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

class BidBuyerSchema {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiProperty() email: string;
  @ApiProperty({ nullable: true }) phoneNumber: string | null;
}

class BidDealershipSchema {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiProperty() address: string;
  @ApiProperty({ type: () => BidBuyerSchema }) buyer: BidBuyerSchema;
}

class BidVehicleSchema {
  @ApiProperty() id: string;
  @ApiProperty() vehicleName: string;
}

class BidResponseSchema {
  @ApiProperty() id: string;
  @ApiProperty() amount: number;
  @ApiProperty({ enum: ['CURRENT_HIGH_BID', 'OUTBID', 'WON'] }) status: string;
  @ApiProperty() createdAt: Date;
  @ApiProperty({ type: () => BidVehicleSchema }) vehicle: BidVehicleSchema;
  @ApiProperty({ type: () => BidDealershipSchema }) dealership: BidDealershipSchema;
}
import { Role } from '@prisma/client';
import { IAuthUser } from '../auth/auth.types';
import { Auth, AuthUser } from '../auth/decorators/auth.decorator';
import { IdParam } from 'src/utils/decorator';
import { BuyersService } from './buyers.service';
import { AssignDealershipsDto } from './dto/assign-dealerships.dto';
import { CreateBidDto } from './dto/create-bid.dto';
import { CreateBuyerDto } from './dto/create-buyer.dto';
import { RegisterForAuctionDto } from './dto/register-auction.dto';
import { UpdateBuyerDto } from './dto/update-buyer.dto';

@ApiTags('buyers')
@ApiBearerAuth()
@Controller('buyers')
export class BuyersController {
  constructor(private readonly buyersService: BuyersService) {}

  @Post()
  @Auth([Role.STAFF])
  @ApiOperation({
    summary: 'Create a buyer account',
    description:
      'Restricted to staff users. Returns a temporary password for the new buyer. A buyer can be related to multiple dealerships — existing dealerships with a matching name are reused.',
  })
  @ApiBody({ type: CreateBuyerDto })
  @ApiCreatedResponse({ description: 'Buyer account created successfully.' })
  @ApiBadRequestResponse({ description: 'A user with this email already exists.' })
  @ApiUnauthorizedResponse({ description: 'Staff privileges required.' })
  async createBuyer(@Body() dto: CreateBuyerDto, @AuthUser() user: IAuthUser) {
    return this.buyersService.createBuyer(dto, user.name);
  }

  @Get()
  @Auth([Role.STAFF])
  @ApiOperation({ summary: 'Fetch all buyers' })
  @ApiOkResponse({ description: 'Returns all buyer accounts.' })
  @ApiUnauthorizedResponse({ description: 'Staff privileges required.' })
  async findAll() {
    return this.buyersService.findAll();
  }

  @Get(':id')
  @Auth([Role.STAFF])
  @ApiOperation({ summary: 'Fetch a single buyer' })
  @ApiOkResponse({ description: 'Returns the buyer account.' })
  @ApiNotFoundResponse({ description: 'Buyer not found.' })
  @ApiUnauthorizedResponse({ description: 'Staff privileges required.' })
  async findOne(@IdParam() id: string) {
    return this.buyersService.findOne(id);
  }

  @Patch(':id')
  @Auth([Role.STAFF])
  @ApiOperation({
    summary: 'Update a buyer account',
    description:
      'Restricted to staff. Update name, email, phone number, or dealership associations.',
  })
  @ApiBody({ type: UpdateBuyerDto })
  @ApiOkResponse({ description: 'Buyer account updated.' })
  @ApiNotFoundResponse({ description: 'Buyer not found.' })
  @ApiBadRequestResponse({ description: 'A user with this email already exists.' })
  @ApiUnauthorizedResponse({ description: 'Staff privileges required.' })
  async updateBuyer(
    @IdParam() id: string,
    @Body() dto: UpdateBuyerDto,
    @AuthUser() user: IAuthUser,
  ) {
    return this.buyersService.updateBuyer(id, dto, user.name);
  }

  @Patch(':id/dealerships')
  @Auth([Role.STAFF])
  @ApiOperation({
    summary: 'Assign dealerships to a buyer',
    description: 'Replaces all current dealership assignments with the provided list of dealership IDs.',
  })
  @ApiBody({ type: AssignDealershipsDto })
  @ApiOkResponse({ description: 'Dealerships assigned successfully.' })
  @ApiNotFoundResponse({ description: 'Buyer or one or more dealerships not found.' })
  @ApiUnauthorizedResponse({ description: 'Staff privileges required.' })
  async assignDealerships(
    @IdParam() id: string,
    @Body() dto: AssignDealershipsDto,
    @AuthUser() user: IAuthUser,
  ) {
    return this.buyersService.assignDealerships(id, dto, user.name);
  }

  @Post('auctions/:id/register')
  @Auth([Role.BUYER])
  @ApiOperation({
    summary: 'Register for an auction',
    description:
      'A buyer must register once per vehicle before placing bids. Pass an existing dealershipId, a newDealership object, or neither if the buyer has exactly one dealership (auto-selected).',
  })
  @ApiBody({ type: RegisterForAuctionDto })
  @ApiCreatedResponse({ description: 'Registered for auction. Dealership locked in for all bids on this vehicle.' })
  @ApiBadRequestResponse({ description: 'Vehicle not in a biddable state, or dealership selection is ambiguous.' })
  @ApiNotFoundResponse({ description: 'Vehicle or buyer not found.' })
  @ApiUnauthorizedResponse({ description: 'Buyer privileges required.' })
  async registerForAuction(
    @IdParam() id: string,
    @Body() dto: RegisterForAuctionDto,
    @AuthUser() user: IAuthUser,
  ) {
    return this.buyersService.registerForAuction(id, dto, user.id);
  }

  @Get('auctions/:id/has-bid')
  @Auth([Role.BUYER])
  @ApiOperation({
    summary: 'Check if the authenticated buyer has placed a bid on a vehicle',
    description: 'Returns registered (whether the buyer is registered for the auction) and hasBid (whether they have placed at least one bid).',
  })
  @ApiOkResponse({
    schema: {
      properties: {
        registered: { type: 'boolean' },
        hasBid: { type: 'boolean' },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Buyer privileges required.' })
  async checkHasBid(@IdParam() id: string, @AuthUser() user: IAuthUser) {
    return this.buyersService.checkHasBid(id, user.id);
  }

  @Post('bids')
  @Auth([Role.BUYER])
  @ApiOperation({
    summary: 'Place a bid on a vehicle',
    description:
      'Buyer must be registered for the auction first. Bid amount must exceed current highest bid by at least the bid increment. Returns the bid with dealership (containing buyer) nested inside.',
  })
  @ApiBody({ type: CreateBidDto })
  @ApiCreatedResponse({ type: BidResponseSchema, description: 'Bid placed. Response includes dealership with buyer nested inside.' })
  @ApiBadRequestResponse({ description: 'Bidding not active, not registered, or bid amount too low.' })
  @ApiNotFoundResponse({ description: 'Vehicle not found.' })
  @ApiUnauthorizedResponse({ description: 'Buyer privileges required.' })
  async placeBid(@Body() dto: CreateBidDto, @AuthUser() user: IAuthUser) {
    return this.buyersService.placeBid(dto, user.id);
  }

  @Get('bids/vehicle/:id')
  @Auth([Role.STAFF])
  @ApiOperation({
    summary: 'Fetch all bids for a vehicle',
    description: 'Returns all bids for the given vehicle ordered by most recent first. Each bid includes dealership with buyer nested inside.',
  })
  @ApiOkResponse({ type: [BidResponseSchema], description: 'Returns all bids. Dealership contains buyer detail.' })
  @ApiNotFoundResponse({ description: 'Vehicle not found.' })
  @ApiUnauthorizedResponse({ description: 'Staff privileges required.' })
  async findBidsForVehicle(@IdParam() id: string) {
    return this.buyersService.findBidsForVehicle(id);
  }

  @Get('bids/:id')
  @Auth([Role.STAFF])
  @ApiOperation({ summary: 'Fetch a single bid' })
  @ApiOkResponse({ type: BidResponseSchema, description: 'Returns the bid. Dealership contains buyer detail.' })
  @ApiNotFoundResponse({ description: 'Bid not found.' })
  @ApiUnauthorizedResponse({ description: 'Staff privileges required.' })
  async findOneBid(@IdParam() id: string) {
    return this.buyersService.findOneBid(id);
  }
}
