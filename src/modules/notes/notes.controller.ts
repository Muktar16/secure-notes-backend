import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNoContentResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { NotesService } from './notes.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { NoteEntity } from './entities/note.entity';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { ParseObjectIdPipe } from '../../common/pipes/parse-objectid.pipe';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../auth/strategies/jwt.strategy';
import {
  ApiAuthFailures,
  ApiDataResponse,
  ApiMissing,
  ApiPaginatedResponse,
  ApiValidationFailure,
} from '../../common/swagger/api-response.decorators';

@ApiTags('notes')
@ApiBearerAuth()
@ApiAuthFailures()
@Controller('notes')
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a note',
    description: 'Ownership comes from the token — you cannot create a note for someone else.',
  })
  @ApiDataResponse(NoteEntity, { created: true })
  @ApiValidationFailure()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateNoteDto) {
    return this.notesService.create(user, dto);
  }

  @Get()
  @ApiOperation({
    summary: "Your notes — or everyone's, if you are an admin",
    description:
      'A user sees only their own, served by { userId: 1, _id: -1 }. An ' +
      'admin sees every note with the author populated, ordered by the ' +
      'default _id index.',
  })
  @ApiPaginatedResponse(NoteEntity)
  findAll(@CurrentUser() user: AuthUser, @Query() query: PaginationQueryDto) {
    return this.notesService.findAll(user, query.page, query.limit);
  }

  @Get(':id')
  @ApiParam({ name: 'id', example: '6a8338caf61145182ef4f981' })
  @ApiOperation({
    summary: 'Fetch one of your notes (admins: any note)',
    description:
      'Ownership is part of the query, not a check after reading. Another ' +
      "user's note therefore returns 404, not 403 — there is no way to probe " +
      'which note ids exist.',
  })
  @ApiDataResponse(NoteEntity)
  @ApiValidationFailure()
  @ApiMissing('Note')
  findOne(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseObjectIdPipe) id: string,
  ) {
    return this.notesService.findById(id, user);
  }

  @Put(':id')
  @ApiParam({ name: 'id', example: '6a8338caf61145182ef4f981' })
  @ApiOperation({ summary: 'Update one of your notes (admins: any note)' })
  @ApiDataResponse(NoteEntity)
  @ApiValidationFailure()
  @ApiMissing('Note')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: UpdateNoteDto,
  ) {
    return this.notesService.update(id, user, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiParam({ name: 'id', example: '6a8338caf61145182ef4f981' })
  @ApiOperation({ summary: 'Delete one of your notes (admins: any note)' })
  @ApiNoContentResponse({ description: 'Deleted' })
  @ApiValidationFailure()
  @ApiMissing('Note')
  remove(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseObjectIdPipe) id: string,
  ) {
    return this.notesService.remove(id, user);
  }
}
