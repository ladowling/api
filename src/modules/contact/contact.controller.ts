import { Body, Controller, Get, Post } from '@nestjs/common';
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
import { Admin } from '../auth/decorators/auth.decorator';
import { IdParam } from 'src/utils/decorator';
import { ContactService } from './contact.service';
import { CreateContactDto } from './dto/create-contact.dto';

@ApiTags('contact')
@Controller('contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Post()
  @ApiOperation({
    summary: 'Submit a contact message',
    description: 'Public endpoint — no authentication required.',
  })
  @ApiBody({ type: CreateContactDto })
  @ApiCreatedResponse({ description: 'Message submitted successfully.' })
  async create(@Body() dto: CreateContactDto) {
    return this.contactService.create(dto);
  }

  @Get()
  @Admin()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Fetch all contact messages' })
  @ApiOkResponse({ description: 'Returns all contact submissions.' })
  @ApiUnauthorizedResponse({ description: 'Admin privileges required.' })
  async findAll() {
    return this.contactService.findAll();
  }

  @Get(':id')
  @Admin()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Fetch a single contact message' })
  @ApiOkResponse({ description: 'Returns the contact submission.' })
  @ApiNotFoundResponse({ description: 'Contact message not found.' })
  @ApiUnauthorizedResponse({ description: 'Admin privileges required.' })
  async findOne(@IdParam() id: string) {
    return this.contactService.findOne(id);
  }
}
