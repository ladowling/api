import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class CreateStaffDto {
  @ApiProperty({ example: 'John' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'john12@gmail.com' })
  @IsEmail()
  email: string;
}
