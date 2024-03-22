import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsHexadecimal,
  IsNumber,
  IsString,
  IsUrl,
  Length,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class UserDTO {
  @IsString()
  username: string;

  @IsHexadecimal()
  @Length(66, 66)
  @Transform(({ value }) => String(value).toLowerCase())
  address: string;

  @IsNumber()
  nonce: number;

  @IsEmail()
  email?: string;

  @IsUrl()
  avatar?: string;

  @IsUrl()
  cover?: string;

  @IsString()
  about?: string;

  @IsBoolean()
  emailVerified?: boolean;

  @IsBoolean()
  isVerified?: boolean;

  @IsArray()
  roles: string[];
}
