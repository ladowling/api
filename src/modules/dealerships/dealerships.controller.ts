import { Body, Controller, Delete, Get, Patch, Post } from '@nestjs/common';
import {
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
import { Auth } from '../auth/decorators/auth.decorator';
import { IdParam } from 'src/utils/decorator';
import { DealershipsService } from './dealerships.service';
import { CreateDealershipDto } from './dto/create-dealership.dto';
import { UpdateDealershipDto } from './dto/update-dealership.dto';

@ApiTags('dealerships')
@ApiBearerAuth()
@Controller('dealerships')
export class DealershipsController {
  constructor(private readonly dealershipsService: DealershipsService) {}

  @Post()
  @Auth([Role.STAFF])
  @ApiOperation({ summary: 'Create a dealership', description: 'Staff only.' })
  @ApiBody({ type: CreateDealershipDto })
  @ApiCreatedResponse({ description: 'Dealership created successfully.' })
  @ApiUnauthorizedResponse({ description: 'Staff privileges required.' })
  async create(@Body() dto: CreateDealershipDto) {
    return this.dealershipsService.create(dto);
  }

  @Get()
  @Auth([Role.STAFF])
  @ApiOperation({ summary: 'Fetch all dealerships', description: 'Staff only.' })
  @ApiOkResponse({ description: 'Returns all dealerships with their associated buyers.' })
  @ApiUnauthorizedResponse({ description: 'Staff privileges required.' })
  async findAll() {
    return this.dealershipsService.findAll();
  }

  @Get(':id')
  @Auth([Role.STAFF])
  @ApiOperation({ summary: 'Fetch a single dealership', description: 'Staff only.' })
  @ApiOkResponse({ description: 'Returns the dealership.' })
  @ApiNotFoundResponse({ description: 'Dealership not found.' })
  @ApiUnauthorizedResponse({ description: 'Staff privileges required.' })
  async findOne(@IdParam() id: string) {
    return this.dealershipsService.findOne(id);
  }

  @Patch(':id')
  @Auth([Role.STAFF])
  @ApiOperation({ summary: 'Update a dealership', description: 'Staff only.' })
  @ApiBody({ type: UpdateDealershipDto })
  @ApiOkResponse({ description: 'Dealership updated.' })
  @ApiNotFoundResponse({ description: 'Dealership not found.' })
  @ApiUnauthorizedResponse({ description: 'Staff privileges required.' })
  async update(@IdParam() id: string, @Body() dto: UpdateDealershipDto) {
    return this.dealershipsService.update(id, dto);
  }

  @Delete(':id')
  @Auth([Role.STAFF])
  @ApiOperation({ summary: 'Delete a dealership', description: 'Staff only.' })
  @ApiOkResponse({ description: 'Dealership deleted.' })
  @ApiNotFoundResponse({ description: 'Dealership not found.' })
  @ApiUnauthorizedResponse({ description: 'Staff privileges required.' })
  async remove(@IdParam() id: string) {
    return this.dealershipsService.remove(id);
  }
}
