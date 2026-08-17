import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { User, UserDocument } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import {
  PaginatedResult,
  paginate,
} from '../../common/dto/pagination-query.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async create(dto: CreateUserDto): Promise<UserDocument> {
    const existing = await this.userModel.findOne({ email: dto.email });
    if (existing) {
      throw new ConflictException('Email already exists');
    }
    const hashed = await bcrypt.hash(dto.password, 12);
    return this.userModel.create({ ...dto, password: hashed });
  }

  async findAll(
    page: number,
    limit: number,
  ): Promise<PaginatedResult<UserDocument>> {
    const skip = (page - 1) * limit;
    return paginate(
      this.userModel.find().sort({ _id: -1 }).skip(skip).limit(limit).lean(),
      this.userModel.countDocuments(),
      page,
      limit,
    );
  }

  async findById(id: string): Promise<UserDocument> {
    const user = await this.userModel.findById(id).lean();
    if (!user) throw new NotFoundException(`User #${id} not found`);
    return user;
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email });
  }

  async update(id: string, dto: UpdateUserDto): Promise<UserDocument> {
    if (dto.password) {
      dto.password = await bcrypt.hash(dto.password, 12);
    }
    const user = await this.userModel
      .findByIdAndUpdate(id, dto, { new: true })
      .lean();
    if (!user) throw new NotFoundException(`User #${id} not found`);
    return user;
  }

  async remove(id: string): Promise<void> {
    const result = await this.userModel.findByIdAndDelete(id);
    if (!result) throw new NotFoundException(`User #${id} not found`);
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
}
