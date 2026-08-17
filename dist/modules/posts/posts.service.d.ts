import { Model } from 'mongoose';
import { PostDocument } from './schemas/post.schema';
import { CreatePostDto } from './dto/create-post.dto';
import { PaginatedResult } from '../../common/dto/pagination-query.dto';
export declare class PostsService {
    private postModel;
    constructor(postModel: Model<PostDocument>);
    create(userId: string, dto: CreatePostDto): Promise<PostDocument>;
    findAll(page: number, limit: number): Promise<PaginatedResult<PostDocument>>;
    findByUserAggregated(userId: string): Promise<any[]>;
}
