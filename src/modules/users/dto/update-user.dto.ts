import { IsString, MinLength, IsOptional, IsArray, IsEnum } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @IsOptional()
  @IsEnum(['user', 'admin'])
  role?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  interests?: string[];
}
