import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { $Enums, VehicleStatus } from '@prisma/client';
import { IsDateString, IsEnum, IsIn, IsOptional } from 'class-validator';

export class ApproveVehicleDto {
  @ApiProperty({
    enum: [VehicleStatus.APPROVED, VehicleStatus.REJECTED],
    example: 'APPROVED',
  })
  @IsEnum(VehicleStatus)
  @IsIn([VehicleStatus.APPROVED, VehicleStatus.REJECTED])
  status: $Enums.VehicleStatus;

  @ApiPropertyOptional({ example: '2026-06-23T19:23:40.000Z', description: 'Required when approving. When the auction opens for bidding (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  auctionStartTime?: string;

  @ApiPropertyOptional({ example: '2026-06-23T21:23:40.000Z', description: 'Required when approving. When the auction closes (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  auctionEndTime?: string;
}
