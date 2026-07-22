import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateVehicleValuationDto {
  @ApiPropertyOptional({ example: 25500.0, description: 'KBB trade-in value' })
  @IsOptional()
  @IsNumber()
  kbbTradeInValue?: number;

  @ApiPropertyOptional({ example: 28000.0, description: 'KBB private party value' })
  @IsOptional()
  @IsNumber()
  kbbPrivatePartyValue?: number;

  @ApiPropertyOptional({ example: 26200.0, description: 'Manheim Market Report value' })
  @IsOptional()
  @IsNumber()
  mmrValue?: number;

  @ApiPropertyOptional({ example: 24000.0, description: 'CarMax offer amount' })
  @IsOptional()
  @IsNumber()
  carMaxOffer?: number;

  @ApiPropertyOptional({ example: 24500.0, description: 'Carvana offer amount' })
  @IsOptional()
  @IsNumber()
  carvanaOffer?: number;

  @ApiPropertyOptional({ example: 25000.0, description: 'ACV wholesale estimate' })
  @IsOptional()
  @IsNumber()
  acvWholesaleEstimate?: number;

  @ApiPropertyOptional({ example: 24750.0, description: 'Final price the vehicle sold for, if any' })
  @IsOptional()
  @IsNumber()
  finalTransactionPrice?: number;

  @ApiPropertyOptional({ example: 'Seller backed out', description: 'Reason the vehicle did not sell' })
  @IsOptional()
  @IsString()
  reasonNotSold?: string;

  @ApiPropertyOptional({
    example: 'Vehicle has minor cosmetic damage on the rear bumper affecting the CarMax offer.',
    description: 'Internal admin notes about the valuation',
  })
  @IsOptional()
  @IsString()
  adminValuationNotes?: string;
}
