import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsUUID, Min } from 'class-validator';

export class CreateBidDto {
  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  @IsUUID()
  vehicleId: string;

  @ApiProperty({ example: 5000, description: 'Bid amount in USD' })
  @IsNumber()
  @Min(1)
  amount: number;
}
