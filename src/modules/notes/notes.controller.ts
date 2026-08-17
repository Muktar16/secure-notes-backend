import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Req,
} from '@nestjs/common';
import { NotesService } from './notes.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { ParseObjectIdPipe } from '../../common/pipes/parse-objectid.pipe';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('notes')
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Post()
  create(@CurrentUser() user: any, @Body() dto: CreateNoteDto) {
    return this.notesService.create(user.userId, dto);
  }

  @Get()
  findAll(
    @CurrentUser() user: any,
    @Query() query: PaginationQueryDto,
  ) {
    return this.notesService.findAll(user.userId, user.role, query.page, query.limit);
  }

  @Get(':id')
  findOne(
    @CurrentUser() user: any,
    @Param('id', ParseObjectIdPipe) id: string,
  ) {
    return this.notesService.findById(id, user.userId, user.role);
  }

  @Put(':id')
  update(
    @CurrentUser() user: any,
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: UpdateNoteDto,
  ) {
    return this.notesService.update(id, user.userId, user.role, dto);
  }

  @Delete(':id')
  remove(
    @CurrentUser() user: any,
    @Param('id', ParseObjectIdPipe) id: string,
  ) {
    return this.notesService.remove(id, user.userId, user.role);
  }
}
