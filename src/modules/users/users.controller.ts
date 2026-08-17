import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { ParseObjectIdPipe } from '../../common/pipes/parse-objectid.pipe';

@Controller('users')
@Roles('admin')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Get()
  findAll(@Query() query: PaginationQueryDto) {
    return this.usersService.findAll(query.page, query.limit);
  }

  @Get('grouped-by-interests')
  groupedByInterests() {
    return this.usersService.groupByInterests();
  }

  @Get(':id')
  findOne(@Param('id', ParseObjectIdPipe) id: string) {
    return this.usersService.findById(id);
  }

  @Put(':id')
  update(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseObjectIdPipe) id: string) {
    return this.usersService.remove(id);
  }
}
