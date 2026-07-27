import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateDealershipDto {
  @ApiProperty({ example: 'Metro Auto Group' })
  @IsString()
  name: string;

  @ApiProperty({ example: '123 Main St, Chicago, IL' })
  @IsString()
  address: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Buyer ID to attach to this dealership on creation.',
    example: 'uuid-here',
  })
  @IsOptional()
  @IsUUID('4')
  buyerId?: string;
}
