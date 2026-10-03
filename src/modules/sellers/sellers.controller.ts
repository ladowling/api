import { Body, Controller, Get, Patch, Post } from '@nestjs/common';
import { IAuthUser } from '../auth/auth.types';
import { AuthUser } from '../auth/decorators/auth.decorator';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Admin, Auth } from '../auth/decorators/auth.decorator';
import { IdParam } from 'src/utils/decorator';
import { ApproveVehicleDto } from './dto/approve-vehicle.dto';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { ResolveVehicleDto } from './dto/resolve-vehicle.dto';
import { UpdateBidIncrementDto } from './dto/update-bid-increment.dto';
import { UpdateVehicleValuationDto } from './dto/update-vehicle-valuation.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { SellersService } from './sellers.service';

@ApiTags('sellers')
@Controller('sellers')
export class SellersController {
  constructor(private readonly sellersService: SellersService) {}

  @Post('vehicle')
  @ApiOperation({
    summary: 'Submit a vehicle listing for buyer bidding',
    description:
      'Public endpoint — no authentication required. Listing starts in PENDING status.',
  })
  @ApiBody({ type: CreateVehicleDto })
  @ApiCreatedResponse({ description: 'Vehicle listing created successfully.' })
  async createVehicle(@Body() dto: CreateVehicleDto) {
    return this.sellersService.createVehicle(dto);
  }

  @Get('vehicles')
  @Auth([Role.STAFF, Role.BUYER])
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Fetch all vehicle listings',
    description: 'Accessible by staff and buyers. Uploads returned with id and name only.',
  })
  @ApiOkResponse({ description: 'Returns all vehicle listings.' })
  @ApiUnauthorizedResponse({ description: 'Staff or buyer privileges required.' })
  async findAllVehicles() {
    return this.sellersService.findAllVehicles();
  }

  @Get('vehicles/archived')
  @Auth([Role.STAFF])
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Fetch all archived vehicle listings', description: 'Staff only.' })
  @ApiOkResponse({ description: 'Returns all archived vehicle listings.' })
  @ApiUnauthorizedResponse({ description: 'Staff privileges required.' })
  async findArchivedVehicles() {
    return this.sellersService.findArchivedVehicles();
  }

  @Get('vehicles/:id')
  @Auth([Role.STAFF, Role.BUYER])
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Fetch a single vehicle listing' })
  @ApiOkResponse({ description: 'Returns the vehicle listing.' })
  @ApiNotFoundResponse({ description: 'Vehicle listing not found.' })
  @ApiUnauthorizedResponse({ description: 'Staff or buyer privileges required.' })
  async findOneVehicle(@IdParam() id: string) {
    return this.sellersService.findOneVehicle(id);
  }

  @Patch('vehicles/:id')
  @Auth([Role.STAFF])
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Edit a vehicle listing',
    description: 'Staff only. Update any vehicle field. All fields are optional.',
  })
  @ApiBody({ type: UpdateVehicleDto })
  @ApiOkResponse({ description: 'Vehicle updated.' })
  @ApiNotFoundResponse({ description: 'Vehicle listing not found.' })
  @ApiUnauthorizedResponse({ description: 'Staff privileges required.' })
  async updateVehicle(
    @IdParam() id: string,
    @Body() dto: UpdateVehicleDto,
    @AuthUser() user: IAuthUser,
  ) {
    return this.sellersService.updateVehicle(id, dto, user.name);
  }

  @Patch('vehicles/:id/approve')
  @Auth([Role.STAFF])
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Approve or reject a vehicle listing',
    description:
      'Sets status to APPROVED or REJECTED and sets auction times. Notifies all active buyers when approved.',
  })
  @ApiBody({ type: ApproveVehicleDto })
  @ApiOkResponse({ description: 'Vehicle status updated.' })
  @ApiNotFoundResponse({ description: 'Vehicle listing not found.' })
  @ApiBadRequestResponse({ description: 'Only vehicles in PENDING status can be approved or rejected.' })
  @ApiUnauthorizedResponse({ description: 'Staff privileges required.' })
  async approveVehicle(@IdParam() id: string, @Body() dto: ApproveVehicleDto) {
    return this.sellersService.approveVehicle(id, dto);
  }

  @Patch('vehicles/:id/bid-increment')
  @Auth([Role.STAFF])
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update the bid increment amount for a vehicle' })
  @ApiBody({ type: UpdateBidIncrementDto })
  @ApiOkResponse({ description: 'Bid increment updated.' })
  @ApiNotFoundResponse({ description: 'Vehicle listing not found.' })
  @ApiUnauthorizedResponse({ description: 'Staff privileges required.' })
  async updateBidIncrement(
    @IdParam() id: string,
    @Body() dto: UpdateBidIncrementDto,
  ) {
    return this.sellersService.updateBidIncrement(id, dto);
  }

  @Patch('vehicles/:id/resolve')
  @Auth([Role.STAFF])
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Resolve a vehicle after bidding ends',
    description:
      'SOLD — vehicle sold to winning bidder. AVAILABLE — not sold, bid history cleared, re-enters approval queue.',
  })
  @ApiBody({ type: ResolveVehicleDto })
  @ApiOkResponse({ description: 'Vehicle resolved.' })
  @ApiNotFoundResponse({ description: 'Vehicle listing not found.' })
  @ApiBadRequestResponse({ description: 'Vehicle must be in BIDDING_ENDED status.' })
  @ApiUnauthorizedResponse({ description: 'Staff privileges required.' })
  async resolveVehicle(@IdParam() id: string, @Body() dto: ResolveVehicleDto) {
    return this.sellersService.resolveVehicle(id, dto);
  }

  @Patch('vehicles/:id/archive')
  @Auth([Role.STAFF])
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Toggle archive on a vehicle listing',
    description: 'Staff only. Archives the vehicle if active, or restores it to PENDING if already archived. Cannot be toggled while bidding is active.',
  })
  @ApiOkResponse({ description: 'Vehicle archive status toggled.' })
  @ApiNotFoundResponse({ description: 'Vehicle listing not found.' })
  @ApiBadRequestResponse({ description: 'Cannot archive while bidding is active.' })
  @ApiUnauthorizedResponse({ description: 'Staff privileges required.' })
  async archiveVehicle(@IdParam() id: string) {
    return this.sellersService.archiveVehicle(id);
  }

  @Patch('vehicles/:id/valuation')
  @Admin()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update vehicle valuation data',
    description:
      'Restricted to admins. Updates third-party valuation figures (KBB, MMR, CarMax, Carvana, ACV), final sale price, and admin notes.',
  })
  @ApiBody({ type: UpdateVehicleValuationDto })
  @ApiOkResponse({ description: 'Vehicle valuation updated.' })
  @ApiNotFoundResponse({ description: 'Vehicle listing not found.' })
  @ApiUnauthorizedResponse({ description: 'Admin privileges required.' })
  async updateValuation(
    @IdParam() id: string,
    @Body() dto: UpdateVehicleValuationDto,
  ) {
    return this.sellersService.updateValuation(id, dto);
  }
}
