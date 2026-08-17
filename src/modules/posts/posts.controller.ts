import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { ParseObjectIdPipe } from '../../common/pipes/parse-objectid.pipe';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  create(@CurrentUser() user: any, @Body() dto: CreatePostDto) {
    return this.postsService.create(user.userId, dto);
  }

  @Get()
  findAll(@Query() query: PaginationQueryDto) {
    return this.postsService.findAll(query.page, query.limit);
  }

  @Get('by-user/:userId')
  findByUserAggregated(
    @Param('userId', ParseObjectIdPipe) userId: string,
  ) {
    return this.postsService.findByUserAggregated(userId);
  }
}
