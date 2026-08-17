import { IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class UserQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    example: 'chess',
    description: 'Filter to users holding this interest (multikey index scan)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  interest?: string;
}
