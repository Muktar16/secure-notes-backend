"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotesService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const note_schema_1 = require("./schemas/note.schema");
const pagination_query_dto_1 = require("../../common/dto/pagination-query.dto");
let NotesService = class NotesService {
    noteModel;
    constructor(noteModel) {
        this.noteModel = noteModel;
    }
    async create(userId, dto) {
        return this.noteModel.create({
            userId: new mongoose_2.Types.ObjectId(userId),
            title: dto.title,
            content: dto.content || '',
        });
    }
    async findAll(userId, role, page, limit) {
        const skip = (page - 1) * limit;
        const filter = role === 'admin' ? {} : { userId: new mongoose_2.Types.ObjectId(userId) };
        return (0, pagination_query_dto_1.paginate)(this.noteModel
            .find(filter)
            .sort({ _id: -1 })
            .skip(skip)
            .limit(limit)
            .lean(), this.noteModel.countDocuments(filter), page, limit);
    }
    async findById(id, userId, role) {
        const note = await this.noteModel.findById(id).lean();
        if (!note)
            throw new common_1.NotFoundException(`Note #${id} not found`);
        if (role !== 'admin' && note.userId.toString() !== userId) {
            throw new common_1.ForbiddenException('Access denied');
        }
        return note;
    }
    async update(id, userId, role, dto) {
        const note = await this.noteModel.findById(id);
        if (!note)
            throw new common_1.NotFoundException(`Note #${id} not found`);
        if (role !== 'admin' && note.userId.toString() !== userId) {
            throw new common_1.ForbiddenException('Access denied');
        }
        Object.assign(note, dto);
        return note.save();
    }
    async remove(id, userId, role) {
        const note = await this.noteModel.findById(id);
        if (!note)
            throw new common_1.NotFoundException(`Note #${id} not found`);
        if (role !== 'admin' && note.userId.toString() !== userId) {
            throw new common_1.ForbiddenException('Access denied');
        }
        await note.deleteOne();
    }
};
exports.NotesService = NotesService;
exports.NotesService = NotesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(note_schema_1.Note.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], NotesService);
//# sourceMappingURL=notes.service.js.map