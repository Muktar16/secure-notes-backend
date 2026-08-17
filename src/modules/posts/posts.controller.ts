import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { PostEntity, PostWithAuthorEntity } from './entities/post.entity';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { ParseObjectIdPipe } from '../../common/pipes/parse-objectid.pipe';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../auth/strategies/jwt.strategy';
import {
  ApiAuthFailures,
  ApiDataResponse,
  ApiPaginatedResponse,
  ApiValidationFailure,
} from '../../common/swagger/api-response.decorators';

@ApiTags('posts')
@ApiBearerAuth()
@ApiAuthFailures()
@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  @ApiOperation({ summary: 'Write a post' })
  @ApiDataResponse(PostEntity, { created: true })
  @ApiValidationFailure()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreatePostDto) {
    return this.postsService.create(user.userId, dto);
  }

  @Get()
  @ApiOperation({
    summary: 'All posts — visible to every signed-in user',
    description: 'The author is populated so the list is readable in one request.',
  })
  @ApiPaginatedResponse(PostEntity)
  findAll(@Query() query: PaginationQueryDto) {
    return this.postsService.findAll(query.page, query.limit);
  }

  @Get('by-user/:userId')
  @ApiParam({
    name: 'userId',
    example: '6a8338caf61145182ef4f961',
    description: 'Any user id — take one from GET /api/users or a populated post',
  })
  @ApiOperation({
    summary: "Scenario 2 — one user's posts via a single $lookup pipeline",
    description:
      '$match → $sort → $facet, with the $lookup inside the page branch so ' +
      'it joins only the documents being returned rather than the whole ' +
      'history. Both $match and $sort are served by { userId: 1, _id: -1 }, ' +
      'so the pipeline performs no in-memory sort. The lookup sub-pipeline ' +
      "projects only the author's name and email, so the password hash never " +
      'enters the pipeline.',
  })
  @ApiPaginatedResponse(PostWithAuthorEntity)
  @ApiValidationFailure()
  findByUserAggregated(
    @Param('userId', ParseObjectIdPipe) userId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.postsService.findByUserAggregated(
      userId,
      query.page,
      query.limit,
    );
  }
}
