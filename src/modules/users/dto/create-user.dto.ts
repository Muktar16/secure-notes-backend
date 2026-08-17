import { IsEmail, IsString, MinLength, IsOptional, IsArray, IsEnum } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsOptional()
  @IsEnum(['user', 'admin'])
  role?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  interests?: string[];
}
