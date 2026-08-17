import { NotesService } from './notes.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
export declare class NotesController {
    private readonly notesService;
    constructor(notesService: NotesService);
    create(user: any, dto: CreateNoteDto): Promise<import("mongoose").Document<unknown, {}, import("./schemas/note.schema").Note, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/note.schema").Note & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }>;
    findAll(user: any, query: PaginationQueryDto): Promise<import("../../common/dto/pagination-query.dto").PaginatedResult<import("mongoose").Document<unknown, {}, import("./schemas/note.schema").Note, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/note.schema").Note & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }>>;
    findOne(user: any, id: string): Promise<import("mongoose").Document<unknown, {}, import("./schemas/note.schema").Note, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/note.schema").Note & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }>;
    update(user: any, id: string, dto: UpdateNoteDto): Promise<import("mongoose").Document<unknown, {}, import("./schemas/note.schema").Note, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/note.schema").Note & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }>;
    remove(user: any, id: string): Promise<void>;
}
