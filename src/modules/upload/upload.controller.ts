import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Post,
  Query,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { IdParam } from 'src/utils/decorator';
import { IAuthUser } from '../auth/auth.types';
import { Auth, AuthUser } from '../auth/decorators/auth.decorator';
import { UploadService } from './upload.service';

@ApiTags('upload')
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('bulk')
  @ApiOperation({
    summary: 'Retrieve multiple uploads by IDs',
    description: 'Returns upload metadata (without binary data) for the given IDs.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: { ids: { type: 'array', items: { type: 'string', format: 'uuid' } } },
      required: ['ids'],
    },
  })
  @ApiOkResponse({ description: 'Returns the matching uploads.' })
  async getUploads(@Body('ids') ids: string[]) {
    return this.uploadService.getUploads(ids);
  }

  @Post(':id')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: 'Upload a file',
    description: 'Uploads a file with the given UUID as its ID. Use multipart/form-data with a "file" field.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
      required: ['file'],
    },
  })
  @ApiQuery({ name: 'order', required: false, type: Number, description: 'Display order of the upload (defaults to 0)' })
  @ApiCreatedResponse({ description: 'File uploaded successfully.' })
  async upload(
    @IdParam() id: string,
    @UploadedFile() file: Express.Multer.File,
    @Query('order') orderParam?: string,
  ) {
    const order = Number(orderParam) || 0;
    return this.uploadService.upload(id, file, order);
  }

  @Auth()
  @Delete()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Delete uploads',
    description: 'Deletes uploads owned by the authenticated user. Accepts an array of upload IDs.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: { ids: { type: 'array', items: { type: 'string', format: 'uuid' } } },
      required: ['ids'],
    },
  })
  @ApiOkResponse({ description: 'Uploads deleted successfully.' })
  @ApiUnauthorizedResponse({ description: 'Authentication required.' })
  async cleanup(
    @Body('ids') ids: string | string[],
    @AuthUser() user: IAuthUser,
  ) {
    if (typeof ids === 'string') ids = ids.split(/,\s*/g);
    if (!Array.isArray(ids)) throw new Error('Invalid upload IDs.');
    return this.uploadService.cleanup(ids, user);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Download a file',
    description: 'Returns the file as a binary stream with the original filename.',
  })
  @ApiOkResponse({ description: 'Returns the file as a download.' })
  @ApiNotFoundResponse({ description: 'Upload not found.' })
  async download(@IdParam() id: string) {
    const upload = await this.uploadService.download(id);
    if (!upload) throw new NotFoundException('Upload not found');
    return new StreamableFile(upload.data, {
      type: upload.type,
      disposition: `attachment; filename="${upload.name}"`,
    });
  }
}
