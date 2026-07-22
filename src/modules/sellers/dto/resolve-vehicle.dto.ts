import { ApiProperty } from '@nestjs/swagger';
import { VehicleStatus } from '@prisma/client';
import { IsEnum, IsIn } from 'class-validator';

export class ResolveVehicleDto {
  @ApiProperty({
    enum: [VehicleStatus.SOLD, VehicleStatus.AVAILABLE],
    example: VehicleStatus.SOLD,
    description:
      'SOLD — vehicle sold to winning bidder. AVAILABLE — not sold, bid history cleared, re-enters approval queue.',
  })
  @IsEnum(VehicleStatus)
  @IsIn([VehicleStatus.SOLD, VehicleStatus.AVAILABLE])
  status: 'SOLD' | 'AVAILABLE';
}
