import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Note, NoteDocument } from './schemas/note.schema';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import {
  PaginatedResult,
  paginate,
} from '../../common/dto/pagination-query.dto';

@Injectable()
export class NotesService {
  constructor(
    @InjectModel(Note.name) private noteModel: Model<NoteDocument>,
  ) {}

  async create(userId: string, dto: CreateNoteDto): Promise<NoteDocument> {
    return this.noteModel.create({
      userId: new Types.ObjectId(userId),
      title: dto.title,
      content: dto.content || '',
    });
  }

  async findAll(
    userId: string,
    role: string,
    page: number,
    limit: number,
  ): Promise<PaginatedResult<NoteDocument>> {
    const skip = (page - 1) * limit;
    const filter = role === 'admin' ? {} : { userId: new Types.ObjectId(userId) };

    return paginate(
      this.noteModel
        .find(filter)
        .sort({ _id: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.noteModel.countDocuments(filter),
      page,
      limit,
    );
  }

  async findById(id: string, userId: string, role: string): Promise<NoteDocument> {
    const note = await this.noteModel.findById(id).lean();
    if (!note) throw new NotFoundException(`Note #${id} not found`);

    if (role !== 'admin' && note.userId.toString() !== userId) {
      throw new ForbiddenException('Access denied');
    }
    return note;
  }

  async update(
    id: string,
    userId: string,
    role: string,
    dto: UpdateNoteDto,
  ): Promise<NoteDocument> {
    const note = await this.noteModel.findById(id);
    if (!note) throw new NotFoundException(`Note #${id} not found`);

    if (role !== 'admin' && note.userId.toString() !== userId) {
      throw new ForbiddenException('Access denied');
    }

    Object.assign(note, dto);
    return note.save();
  }

  async remove(id: string, userId: string, role: string): Promise<void> {
    const note = await this.noteModel.findById(id);
    if (!note) throw new NotFoundException(`Note #${id} not found`);

    if (role !== 'admin' && note.userId.toString() !== userId) {
      throw new ForbiddenException('Access denied');
    }

    await note.deleteOne();
  }
}
