import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, type QueryFilter } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { User, UserDocument } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { Note, NoteDocument } from '../notes/schemas/note.schema';
import { Post, PostDocument } from '../posts/schemas/post.schema';
import { BCRYPT_ROUNDS } from '../auth/auth.service';
import {
  PaginatedResult,
  paginate,
  paginatedFacet,
  unwrapFacet,
} from '../../common/dto/pagination-query.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Note.name) private noteModel: Model<NoteDocument>,
    @InjectModel(Post.name) private postModel: Model<PostDocument>,
  ) {}

  async create(dto: CreateUserDto): Promise<UserDocument> {
    // Uniqueness is enforced by the unique index on users.email; a collision
    // returns 409 through MongooseExceptionFilter. No read-then-write race.
    return this.userModel.create({
      ...dto,
      password: await bcrypt.hash(dto.password, BCRYPT_ROUNDS),
    });
  }

  async findAll(
    page: number,
    limit: number,
    interest?: string,
  ): Promise<PaginatedResult<UserDocument>> {
    // An equality match on the array element uses the multikey
    // { interests: 1, ... } index; with no filter this is an _id-ordered
    // scan served by the default _id index.
    const filter: QueryFilter<UserDocument> = interest
      ? { interests: interest.toLowerCase() }
      : {};

    return paginate(
      this.userModel
        .find(filter)
        .sort({ _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      this.userModel.countDocuments(filter),
      page,
      limit,
    );
  }

  async findById(id: string): Promise<UserDocument> {
    const user = await this.userModel.findById(id).lean();
    if (!user) throw new NotFoundException(`User #${id} not found`);
    return user;
  }

  async update(
    id: string,
    dto: UpdateUserDto,
    actingUserId: string,
  ): Promise<UserDocument> {
    // An admin demoting themselves would immediately lose access to this very
    // endpoint, so the last thing they could do is lock themselves out.
    if (id === actingUserId && dto.role && dto.role !== 'admin') {
      throw new BadRequestException('You cannot remove your own admin role');
    }

    const patch: Record<string, unknown> = { ...dto };
    if (dto.password) {
      patch.password = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    }

    const user = await this.userModel
      .findByIdAndUpdate(id, patch, { new: true, runValidators: true })
      .lean();
    if (!user) throw new NotFoundException(`User #${id} not found`);
    return user;
  }

  async updateProfile(
    id: string,
    dto: UpdateProfileDto,
  ): Promise<UserDocument> {
    // Deliberately narrower than update(): a user may edit their own name and
    // interests, but role and password changes are not reachable here.
    const user = await this.userModel
      .findByIdAndUpdate(id, dto, { new: true, runValidators: true })
      .lean();
    if (!user) throw new NotFoundException(`User #${id} not found`);
    return user;
  }

  async remove(id: string, actingUserId: string): Promise<void> {
    if (id === actingUserId) {
      throw new BadRequestException('You cannot delete your own account');
    }

    const result = await this.userModel.findByIdAndDelete(id);
    if (!result) throw new NotFoundException(`User #${id} not found`);

    // Remove the user's content so no orphaned notes/posts remain pointing at
    // a missing owner. Done after the user is gone, so a failure here can
    // never leave a deleted-but-still-usable account behind. Sequential rather
    // than transactional to stay compatible with standalone MongoDB, which
    // does not support multi-document transactions.
    await Promise.all([
      this.noteModel.deleteMany({ userId: result._id }),
      this.postModel.deleteMany({ userId: result._id }),
    ]);
  }

  /**
   * Scenario 1 — users grouped by interest.
   *
   * Exactly one collection.aggregate() call: $facet computes the page of
   * groups and the total group count in the same pass, so pagination costs no
   * extra round trip and no second method call.
   *
   * The leading $match is what makes { interests: 1, _id: -1 } eligible:
   * with it the pipeline runs as an IXSCAN, without it MongoDB falls back to
   * a COLLSCAN (verified with explain(); see README "Indexing strategy").
   */
  async groupByInterests(page: number, limit: number) {
    const [result] = await this.userModel.aggregate([
      { $match: { interests: { $exists: true, $ne: [] } } },
      { $unwind: '$interests' },
      {
        $group: {
          _id: '$interests',
          count: { $sum: 1 },
          users: { $push: { name: '$name', email: '$email' } },
        },
      },
      { $sort: { count: -1, _id: 1 } },
      { $facet: paginatedFacet(page, limit) },
    ]);

    return unwrapFacet(result, page, limit);
  }
}
