import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AuctionStatus, VehicleStatus } from '@prisma/client';
import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsISO8601,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateVehicleDto {
  @ApiProperty({ example: '2020 Honda Civic' })
  @IsString()
  vehicleName: string;

  @ApiProperty({ example: 'mariaLopez' })
  @IsString()
  sellerName: string;

  @ApiProperty({ example: '5366363667' })
  @IsString()
  sellerPhoneNo: string;

  @ApiProperty({ example: 'lisa@gmail.com' })
  @IsEmail()
  sellerEmail: string;

  @ApiProperty({ example: '2EWTRY67436T47', description: 'Vehicle Identification Number' })
  @IsString()
  vin: string;

  @ApiProperty({ example: 2020 })
  @IsInt()
  year: number;

  @ApiProperty({ example: 'Honda' })
  @IsString()
  make: string;

  @ApiProperty({ example: 'Model 3' })
  @IsString()
  model: string;

  @ApiProperty({ example: 2300 })
  @IsInt()
  mileage: number;

  @ApiProperty({ example: 'New York' })
  @IsString()
  location: string;

  @ApiProperty({ example: 'In good shape' })
  @IsString()
  condition: string;

  @ApiProperty({ example: 4000, description: 'Minimum acceptable price in USD' })
  @IsNumber()
  minimumAcceptablePrice: number;

  @ApiPropertyOptional({
    enum: VehicleStatus,
    default: VehicleStatus.PENDING,
    description: 'Listing approval status — defaults to PENDING',
  })
  @IsOptional()
  @IsEnum(VehicleStatus)
  status?: VehicleStatus;

  @ApiPropertyOptional({
    enum: AuctionStatus,
    default: AuctionStatus.ACTIVE,
    description: 'Whether the auction is currently active',
  })
  @IsOptional()
  @IsEnum(AuctionStatus)
  auctionStatus?: AuctionStatus;

  @ApiPropertyOptional({ example: 30000, description: 'Aggregate bid value' })
  @IsOptional()
  @IsNumber()
  bids?: number;

  @ApiPropertyOptional({ example: 7000 })
  @IsOptional()
  @IsNumber()
  highestBid?: number;

  @ApiPropertyOptional({ example: 4 })
  @IsOptional()
  @IsInt()
  bidCount?: number;

  @ApiPropertyOptional({ example: '2024-04-28T07:27:00.000Z', description: 'ISO 8601 auction end time' })
  @IsOptional()
  @IsISO8601()
  auctionEndTime?: string;

  @ApiPropertyOptional({ example: 'Olom' })
  @IsOptional()
  @IsString()
  winningBidderName?: string;

  @ApiPropertyOptional({ example: 89500, description: 'Winning bid amount in USD' })
  @IsOptional()
  @IsNumber()
  winningBidAmount?: number;

  @ApiPropertyOptional({ example: 'good' })
  @IsOptional()
  @IsString()
  tireCondition?: string;

  @ApiPropertyOptional({ example: 'excellent' })
  @IsOptional()
  @IsString()
  mechanicalCondition?: string;

  @ApiPropertyOptional({ example: 'clean' })
  @IsOptional()
  @IsString()
  interiorCondition?: string;

  @ApiPropertyOptional({ example: 'no dents' })
  @IsOptional()
  @IsString()
  exteriorCondition?: string;

  @ApiPropertyOptional({ example: 'John', description: 'Name of last user to update this listing' })
  @IsOptional()
  @IsString()
  lastUpdatedBy?: string;

  @ApiPropertyOptional({ example: 200, description: 'Minimum bid increment in USD' })
  @IsOptional()
  @IsInt()
  bidIncrementNo?: number;

  @ApiPropertyOptional({ example: '647ghe' })
  @IsOptional()
  @IsString()
  trim?: string;

  @ApiPropertyOptional({ example: 'yellow' })
  @IsOptional()
  @IsString()
  exteriorColor?: string;

  @ApiPropertyOptional({ example: 'red' })
  @IsOptional()
  @IsString()
  interiorColor?: string;

  @ApiPropertyOptional({ example: false, description: 'Whether the vehicle was driven by a smoker' })
  @IsOptional()
  @IsBoolean()
  smokerVehicle?: boolean;

  @ApiPropertyOptional({ example: true, description: 'Whether the reserve price has been met' })
  @IsOptional()
  @IsBoolean()
  reserveMet?: boolean;

  @ApiPropertyOptional({ example: '2.0L 4-Cylinder' })
  @IsOptional()
  @IsString()
  engine?: string;

  @ApiPropertyOptional({ example: 'Leather' })
  @IsOptional()
  @IsString()
  leatherOrCloth?: string;

  @ApiPropertyOptional({ example: 'Sunroof' })
  @IsOptional()
  @IsString()
  roof?: string;

  @ApiPropertyOptional({ example: 'AWD' })
  @IsOptional()
  @IsString()
  drivetrain?: string;

  @ApiPropertyOptional({ example: 'Automatic' })
  @IsOptional()
  @IsString()
  transmission?: string;

  @ApiPropertyOptional({ example: 'No accidents reported' })
  @IsOptional()
  @IsString()
  accidentHistory?: string;

  @ApiPropertyOptional({ example: 'Minor scratch on rear bumper' })
  @IsOptional()
  @IsString()
  additionalDisclosures?: string;

  @ApiPropertyOptional({
    type: [String],
    example: ['3fa85f64-5717-4562-b3fc-2c963f66afa6'],
    description: 'UUIDs of uploads previously created via POST /upload/:id',
  })
  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  uploads?: string[];
}
