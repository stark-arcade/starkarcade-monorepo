import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsHexadecimal,
  IsObject,
  IsString,
  IsUrl,
  Length,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { Socials } from '@app/shared/models/schemas';

export class UserDto {
  @IsString()
  @ApiProperty()
  @Transform(({ value }) => String(value).trim())
  username: string;

  @ApiProperty()
  @IsEmail()
  email?: string;

  @ApiProperty()
  @IsUrl()
  avatar?: string;

  @ApiProperty()
  @IsUrl()
  cover?: string;

  @ApiProperty()
  @IsString()
  about?: string;

  @ApiProperty()
  @IsBoolean()
  emailVerified?: boolean;

  @ApiProperty()
  @IsHexadecimal()
  @Length(66, 66)
  @Transform(({ value }) => {
    if (String(value).length == 66) {
      return String(value).toLowerCase().trim();
    }
    return String(value).toLowerCase().trim().replace('0x', '0x0');
  })
  address: string;

  @ApiProperty()
  @IsObject()
  socials?: Socials;

  @ApiProperty()
  @IsBoolean()
  isVerified?: boolean;

  @IsArray()
  roles: string[];
}
