"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const bcrypt = __importStar(require("bcryptjs"));
const user_schema_1 = require("./schemas/user.schema");
const pagination_query_dto_1 = require("../../common/dto/pagination-query.dto");
let UsersService = class UsersService {
    userModel;
    constructor(userModel) {
        this.userModel = userModel;
    }
    async create(dto) {
        const existing = await this.userModel.findOne({ email: dto.email });
        if (existing) {
            throw new common_1.ConflictException('Email already exists');
        }
        const hashed = await bcrypt.hash(dto.password, 12);
        return this.userModel.create({ ...dto, password: hashed });
    }
    async findAll(page, limit) {
        const skip = (page - 1) * limit;
        return (0, pagination_query_dto_1.paginate)(this.userModel.find().sort({ _id: -1 }).skip(skip).limit(limit).lean(), this.userModel.countDocuments(), page, limit);
    }
    async findById(id) {
        const user = await this.userModel.findById(id).lean();
        if (!user)
            throw new common_1.NotFoundException(`User #${id} not found`);
        return user;
    }
    async findByEmail(email) {
        return this.userModel.findOne({ email });
    }
    async update(id, dto) {
        if (dto.password) {
            dto.password = await bcrypt.hash(dto.password, 12);
        }
        const user = await this.userModel
            .findByIdAndUpdate(id, dto, { new: true })
            .lean();
        if (!user)
            throw new common_1.NotFoundException(`User #${id} not found`);
        return user;
    }
    async remove(id) {
        const result = await this.userModel.findByIdAndDelete(id);
        if (!result)
            throw new common_1.NotFoundException(`User #${id} not found`);
    }
    async groupByInterests() {
        return this.userModel.aggregate([
            { $unwind: '$interests' },
            {
                $group: {
                    _id: '$interests',
                    count: { $sum: 1 },
                    users: {
                        $push: { _id: '$_id', name: '$name', email: '$email' },
                    },
                },
            },
            { $sort: { _id: 1 } },
        ]);
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], UsersService);
//# sourceMappingURL=users.service.js.map