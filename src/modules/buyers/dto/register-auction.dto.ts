import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';

class NewDealershipDto {
  @ApiPropertyOptional({ example: 'Metro Auto Group' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: '123 Main St, Chicago, IL' })
  @IsString()
  address: string;
}

export class RegisterForAuctionDto {
  @ApiPropertyOptional({
    description: 'ID of an existing dealership already linked to the buyer. Omit to create a new one.',
    example: 'uuid-here',
  })
  @IsOptional()
  @IsUUID('4')
  dealershipId?: string;

  @ApiPropertyOptional({
    type: NewDealershipDto,
    description: 'Create a new dealership on the fly. Used when dealershipId is not provided.',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => NewDealershipDto)
  newDealership?: NewDealershipDto;
}
