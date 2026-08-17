import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Post, PostDocument } from './schemas/post.schema';
import { CreatePostDto } from './dto/create-post.dto';
import {
  PaginatedResult,
  paginate,
} from '../../common/dto/pagination-query.dto';

@Injectable()
export class PostsService {
  constructor(
    @InjectModel(Post.name) private postModel: Model<PostDocument>,
  ) {}

  async create(userId: string, dto: CreatePostDto): Promise<PostDocument> {
    return this.postModel.create({
      userId: new Types.ObjectId(userId),
      title: dto.title,
      content: dto.content || '',
    });
  }

  async findAll(
    page: number,
    limit: number,
  ): Promise<PaginatedResult<PostDocument>> {
    const skip = (page - 1) * limit;
    return paginate(
      this.postModel.find().sort({ _id: -1 }).skip(skip).limit(limit).lean(),
      this.postModel.countDocuments(),
      page,
      limit,
    );
  }

  async findByUserAggregated(userId: string) {
    return this.postModel.aggregate([
      { $match: { userId: new Types.ObjectId(userId) } },
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
}
