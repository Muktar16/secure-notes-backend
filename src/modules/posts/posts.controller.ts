import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { ParseObjectIdPipe } from '../../common/pipes/parse-objectid.pipe';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../auth/strategies/jwt.strategy';

@ApiTags('posts')
@ApiBearerAuth()
@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  @ApiOperation({ summary: 'Write a post' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreatePostDto) {
    return this.postsService.create(user.userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'All posts — visible to everyone (paginated)' })
  findAll(@Query() query: PaginationQueryDto) {
    return this.postsService.findAll(query.page, query.limit);
  }

  @Get('by-user/:userId')
  @ApiOperation({
    summary: 'Scenario 2 — one user\'s posts via a single $lookup pipeline',
  })
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
