import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, type QueryFilter } from 'mongoose';
import { Note, NoteDocument } from './schemas/note.schema';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import {
  PaginatedResult,
  paginate,
} from '../../common/dto/pagination-query.dto';
import type { AuthUser } from '../auth/strategies/jwt.strategy';

@Injectable()
export class NotesService {
  constructor(
    @InjectModel(Note.name) private noteModel: Model<NoteDocument>,
  ) {}

  /**
   * Ownership expressed as part of the query rather than as a check after
   * reading. A user's request can only ever match their own note, so there is
   * no window between "read" and "act" for the document to change hands, and
   * a note belonging to someone else is indistinguishable from one that does
   * not exist — no existence oracle for other users' data.
   */
  private scope(user: AuthUser, extra: QueryFilter<NoteDocument> = {}) {
    return user.role === 'admin'
      ? extra
      : { ...extra, userId: new Types.ObjectId(user.userId) };
  }

  async create(user: AuthUser, dto: CreateNoteDto): Promise<NoteDocument> {
    return this.noteModel.create({
      userId: new Types.ObjectId(user.userId),
      title: dto.title,
      content: dto.content ?? '',
    });
  }

  async findAll(
    user: AuthUser,
    page: number,
    limit: number,
  ): Promise<PaginatedResult<NoteDocument>> {
    const filter = this.scope(user);

    // For a user this is an equality match plus a descending _id sort — both
    // sides of the { userId: 1, _id: -1 } index, so skip/limit walk the index
    // directly. For an admin the filter is empty and the default _id index
    // supplies the same ordering.
    const query = this.noteModel
      .find(filter)
      .sort({ _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    // Admins look at everyone's notes, so they need to see whose each one is.
    if (user.role === 'admin') query.populate('userId', 'name email');

    return paginate(
      query.lean(),
      this.noteModel.countDocuments(filter),
      page,
      limit,
    );
  }

  async findById(id: string, user: AuthUser): Promise<NoteDocument> {
    const note = await this.noteModel.findOne(this.scope(user, { _id: id }));
    if (!note) throw new NotFoundException(`Note #${id} not found`);
    return note;
  }

  async update(
    id: string,
    user: AuthUser,
    dto: UpdateNoteDto,
  ): Promise<NoteDocument> {
    const note = await this.noteModel.findOneAndUpdate(
      this.scope(user, { _id: id }),
      dto,
      { new: true, runValidators: true },
    );
    if (!note) throw new NotFoundException(`Note #${id} not found`);
    return note;
  }

  async remove(id: string, user: AuthUser): Promise<void> {
    const note = await this.noteModel.findOneAndDelete(
      this.scope(user, { _id: id }),
    );
    if (!note) throw new NotFoundException(`Note #${id} not found`);
  }
}
