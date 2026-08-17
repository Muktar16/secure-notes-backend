import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
export declare class PostsController {
    private readonly postsService;
    constructor(postsService: PostsService);
    create(user: any, dto: CreatePostDto): Promise<import("mongoose").Document<unknown, {}, import("./schemas/post.schema").Post, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/post.schema").Post & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }>;
    findAll(query: PaginationQueryDto): Promise<import("../../common/dto/pagination-query.dto").PaginatedResult<import("mongoose").Document<unknown, {}, import("./schemas/post.schema").Post, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/post.schema").Post & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }>>;
    findByUserAggregated(userId: string): Promise<any[]>;
}
