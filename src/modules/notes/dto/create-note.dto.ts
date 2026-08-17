import { IsString, MinLength, IsOptional } from 'class-validator';

export class CreateNoteDto {
  @IsString()
  @MinLength(1)
  title: string;

  @IsOptional()
  @IsString()
  content?: string;
}
