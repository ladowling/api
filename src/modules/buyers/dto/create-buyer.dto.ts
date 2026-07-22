import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsString,
  ValidateNested,
} from 'class-validator';

export class CreateBuyerDealershipDto {
  @ApiProperty({ example: 'ABC Motors' })
  @IsString()
  name: string;

  @ApiProperty({ example: '123 Main St, Louisville, KY' })
  @IsString()
  address: string;
}

export class CreateBuyerDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '09373664737' })
  @IsString()
  phoneNumber: string;

  @ApiProperty({
    type: [CreateBuyerDealershipDto],
    description:
      'Dealerships this buyer is associated with — a buyer can belong to multiple dealerships. Existing dealerships with a matching name are reused.',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateBuyerDealershipDto)
  dealerships: CreateBuyerDealershipDto[];
}
