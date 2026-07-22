import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class CreateContactDto {
  @ApiProperty({ example: 'John' })
  @IsString()
  name: string;

  @ApiProperty({ example: '09373664737' })
  @IsString()
  phoneNo: string;

  @ApiProperty({ example: 'tochi@gmail.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'I need help with my auction listing.' })
  @IsString()
  message: string;
}
