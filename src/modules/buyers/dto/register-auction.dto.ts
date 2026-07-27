import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';

export class NewDealershipDto {
  @ApiProperty({ example: 'Metro Auto Group' })
  @IsString()
  name: string;

  @ApiProperty({ example: '123 Main St, Chicago, IL' })
  @IsString()
  address: string;
}

export class RegisterForAuctionDto {
  @ApiPropertyOptional({
    description: 'ID of an existing dealership linked to the buyer. Provide this OR newDealership.',
    example: 'uuid-here',
  })
  @IsOptional()
  @IsUUID('4')
  dealershipId?: string;

  @ApiPropertyOptional({
    type: NewDealershipDto,
    description: 'Create a new dealership on the fly. Provide this OR dealershipId.',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => NewDealershipDto)
  newDealership?: NewDealershipDto;
}
