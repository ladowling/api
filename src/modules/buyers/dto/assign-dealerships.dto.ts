import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsUUID } from 'class-validator';

export class AssignDealershipsDto {
  @ApiProperty({
    type: [String],
    description: 'List of dealership IDs to assign to the buyer. Replaces all current assignments.',
    example: ['uuid-1', 'uuid-2'],
  })
  @IsArray()
  @IsUUID('4', { each: true })
  dealershipIds: string[];
}
