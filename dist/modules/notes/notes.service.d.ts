import { Model } from 'mongoose';
import { NoteDocument } from './schemas/note.schema';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { PaginatedResult } from '../../common/dto/pagination-query.dto';
export declare class NotesService {
    private noteModel;
    constructor(noteModel: Model<NoteDocument>);
    create(userId: string, dto: CreateNoteDto): Promise<NoteDocument>;
    findAll(userId: string, role: string, page: number, limit: number): Promise<PaginatedResult<NoteDocument>>;
    findById(id: string, userId: string, role: string): Promise<NoteDocument>;
    update(id: string, userId: string, role: string, dto: UpdateNoteDto): Promise<NoteDocument>;
    remove(id: string, userId: string, role: string): Promise<void>;
}
