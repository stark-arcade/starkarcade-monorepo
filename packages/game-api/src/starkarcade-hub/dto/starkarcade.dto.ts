import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  Length,
  IsUrl,
  IsHexadecimal,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ExternalLinkDto {
  @IsUrl()
  @IsOptional()
  discord?: string;

  @IsUrl()
  @IsOptional()
  x?: string;

  @IsUrl()
  @IsOptional()
  website?: string;

  @IsUrl()
  @IsOptional()
  warpcastProfile?: string;
}

export class SubmitGameBodyDto {
  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  @Length(3)
  name: string;

  @ApiProperty()
  @IsString()
  @Length(3, 50)
  shortDescription: string;

  @ApiProperty()
  @IsString()
  @Length(3, 255)
  longDescripstion: string;

  @ApiProperty()
  @IsUrl()
  gameUrl: string;

  @ApiProperty()
  @IsUrl()
  sourceUrl: string;

  @ApiProperty()
  @IsUrl()
  logo: string;

  @ApiProperty()
  @IsUrl()
  banner: string;

  @ApiProperty()
  @IsHexadecimal({ each: true })
  tokens: string[];

  @ApiProperty()
  @IsOptional()
  @ValidateNested()
  @Type(() => ExternalLinkDto)
  externalLink?: ExternalLinkDto;
}
