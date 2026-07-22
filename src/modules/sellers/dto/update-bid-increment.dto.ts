import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class UpdateBidIncrementDto {
  @ApiProperty({ example: 500, description: 'Minimum bid increment in USD' })
  @IsInt()
  @Min(1)
  bidIncrementNo: number;
}
