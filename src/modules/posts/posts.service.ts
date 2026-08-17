import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Post, PostDocument } from './schemas/post.schema';
import { CreatePostDto } from './dto/create-post.dto';
import {
  PaginatedResult,
  paginate,
  pageSlice,
  totalBranch,
  unwrapFacet,
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
      content: dto.content ?? '',
    });
  }

  async findAll(
    page: number,
    limit: number,
  ): Promise<PaginatedResult<PostDocument>> {
    // Posts are public to every authenticated user, so there is no filter to
    // index — the _id-ordered scan is served by the default _id index.
    return paginate(
      this.postModel
        .find()
        .sort({ _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('userId', 'name email')
        .lean(),
      this.postModel.countDocuments(),
      page,
      limit,
    );
  }

  /**
   * Scenario 2 — every post belonging to one user, joined to its author.
   *
   * One aggregate() call, one pipeline, one $lookup:
   *   $match  → equality on userId, served by { userId: 1, _id: -1 }
   *   $sort   → same index supplies _id descending, so no blocking sort
   *   $facet  → page slice and total count in a single pass
   *   $lookup → runs *inside* the page branch, so it joins only the documents
   *             actually returned rather than the user's whole history, and
   *             its sub-pipeline projects away everything except the author's
   *             name and email (the password hash never enters the pipeline).
   */
  async findByUserAggregated(userId: string, page: number, limit: number) {
    const [result] = await this.postModel.aggregate([
      { $match: { userId: new Types.ObjectId(userId) } },
      { $sort: { _id: -1 } },
      {
        $facet: {
          total: totalBranch,
          data: [
            ...pageSlice(page, limit),
            {
              $lookup: {
                from: 'users',
                localField: 'userId',
                foreignField: '_id',
                as: 'author',
                pipeline: [{ $project: { _id: 0, name: 1, email: 1 } }],
              },
            },
            { $unwind: '$author' },
            {
              $project: {
                title: 1,
                content: 1,
                author: 1,
                createdAt: 1,
                updatedAt: 1,
              },
            },
          ],
        },
      },
    ]);

    return unwrapFacet(result, page, limit);
  }
}
