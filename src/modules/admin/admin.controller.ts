import { Body, Controller, Get, Patch, Post } from '@nestjs/common';
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
import { IAuthUser } from '../auth/auth.types';
import { Admin, AuthUser } from '../auth/decorators/auth.decorator';
import { IdParam } from 'src/utils/decorator';
import { AdminService } from './admin.service';
import { CreateAdminDto } from './dto/create-admin.dto';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';

@ApiTags('admin')
@ApiBearerAuth()
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('register')
  @Admin()
  @ApiOperation({
    summary: 'Create a new admin user',
    description: 'Restricted to existing admins.',
  })
  @ApiBody({ type: CreateAdminDto })
  @ApiCreatedResponse({ description: 'Admin user created successfully.' })
  @ApiBadRequestResponse({ description: 'A user with this email already exists.' })
  @ApiUnauthorizedResponse({ description: 'Admin privileges required.' })
  async createAdmin(@Body() dto: CreateAdminDto, @AuthUser() user: IAuthUser) {
    return this.adminService.createAdmin(dto, user.name);
  }

  @Post('staff')
  @Admin()
  @ApiOperation({
    summary: 'Create a staff member',
    description:
      'Restricted to admins. A temporary password is auto-generated and returned — share it with the staff member to log in.',
  })
  @ApiBody({ type: CreateStaffDto })
  @ApiCreatedResponse({ description: 'Staff account created. Returns a temporary password.' })
  @ApiBadRequestResponse({ description: 'A user with this email already exists.' })
  @ApiUnauthorizedResponse({ description: 'Admin privileges required.' })
  async createStaff(@Body() dto: CreateStaffDto, @AuthUser() user: IAuthUser) {
    return this.adminService.createStaff(dto, user.name);
  }

  @Get('staff')
  @Admin()
  @ApiOperation({ summary: 'Fetch all staff members' })
  @ApiOkResponse({ description: 'Returns all staff accounts (admins + non-admins).' })
  @ApiUnauthorizedResponse({ description: 'Admin privileges required.' })
  async findAllStaff() {
    return this.adminService.findAllStaff();
  }

  @Get('staff/:id')
  @Admin()
  @ApiOperation({ summary: 'Fetch a single staff member' })
  @ApiOkResponse({ description: 'Returns the staff account.' })
  @ApiNotFoundResponse({ description: 'Staff member not found.' })
  @ApiUnauthorizedResponse({ description: 'Admin privileges required.' })
  async findOneStaff(@IdParam() id: string) {
    return this.adminService.findOneStaff(id);
  }

  @Patch('staff/:id')
  @Admin()
  @ApiOperation({
    summary: 'Update a staff member',
    description: 'Restricted to admins. Update name, email, or phone number.',
  })
  @ApiBody({ type: UpdateStaffDto })
  @ApiOkResponse({ description: 'Staff account updated.' })
  @ApiNotFoundResponse({ description: 'Staff member not found.' })
  @ApiBadRequestResponse({ description: 'A user with this email already exists.' })
  @ApiUnauthorizedResponse({ description: 'Admin privileges required.' })
  async updateStaff(
    @IdParam() id: string,
    @Body() dto: UpdateStaffDto,
    @AuthUser() user: IAuthUser,
  ) {
    return this.adminService.updateStaff(id, dto, user.name);
  }

  @Patch('staff/:id/deactivate')
  @Admin()
  @ApiOperation({
    summary: 'Deactivate a staff member',
    description: 'Sets isActive to false. The staff member can no longer log in.',
  })
  @ApiOkResponse({ description: 'Staff member deactivated.' })
  @ApiNotFoundResponse({ description: 'Staff member not found.' })
  @ApiUnauthorizedResponse({ description: 'Admin privileges required.' })
  async deactivateStaff(@IdParam() id: string, @AuthUser() user: IAuthUser) {
    return this.adminService.deactivateStaff(id, user.name);
  }

  @Patch('staff/:id/activate')
  @Admin()
  @ApiOperation({
    summary: 'Activate a staff member',
    description: 'Sets isActive to true. Restores login access for a previously deactivated staff member.',
  })
  @ApiOkResponse({ description: 'Staff member activated.' })
  @ApiNotFoundResponse({ description: 'Staff member not found.' })
  @ApiUnauthorizedResponse({ description: 'Admin privileges required.' })
  async activateStaff(@IdParam() id: string, @AuthUser() user: IAuthUser) {
    return this.adminService.activateStaff(id, user.name);
  }
}
