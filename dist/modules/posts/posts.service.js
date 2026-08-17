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
exports.PostsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const post_schema_1 = require("./schemas/post.schema");
const pagination_query_dto_1 = require("../../common/dto/pagination-query.dto");
let PostsService = class PostsService {
    postModel;
    constructor(postModel) {
        this.postModel = postModel;
    }
    async create(userId, dto) {
        return this.postModel.create({
            userId: new mongoose_2.Types.ObjectId(userId),
            title: dto.title,
            content: dto.content || '',
        });
    }
    async findAll(page, limit) {
        const skip = (page - 1) * limit;
        return (0, pagination_query_dto_1.paginate)(this.postModel.find().sort({ _id: -1 }).skip(skip).limit(limit).lean(), this.postModel.countDocuments(), page, limit);
    }
    async findByUserAggregated(userId) {
        return this.postModel.aggregate([
            { $match: { userId: new mongoose_2.Types.ObjectId(userId) } },
            {
                $lookup: {
                    from: 'users',
                    localField: 'userId',
                    foreignField: '_id',
                    as: 'author',
                },
            },
            { $unwind: '$author' },
            {
                $project: {
                    title: 1,
                    content: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    'author.name': 1,
                    'author.email': 1,
                },
            },
            { $sort: { createdAt: -1 } },
        ]);
    }
};
exports.PostsService = PostsService;
exports.PostsService = PostsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(post_schema_1.Post.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], PostsService);
//# sourceMappingURL=posts.service.js.map