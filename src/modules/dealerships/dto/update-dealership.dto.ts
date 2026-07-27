import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateDealershipDto {
  @ApiPropertyOptional({ example: 'Metro Auto Group' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: '123 Main St, Chicago, IL' })
  @IsOptional()
  @IsString()
  address?: string;
}
