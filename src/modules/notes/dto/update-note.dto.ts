import { IsString, MinLength, IsOptional } from 'class-validator';

export class UpdateNoteDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  title?: string;

  @IsOptional()
  @IsString()
  content?: string;
}
