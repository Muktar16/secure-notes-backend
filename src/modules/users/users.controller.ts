import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNoContentResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UserQueryDto } from './dto/user-query.dto';
import { InterestGroupEntity, UserEntity } from './entities/user.entity';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { ParseObjectIdPipe } from '../../common/pipes/parse-objectid.pipe';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../auth/strategies/jwt.strategy';
import {
  ApiAdminOnly,
  ApiAuthFailures,
  ApiDataResponse,
  ApiDuplicateEmail,
  ApiMissing,
  ApiPaginatedResponse,
  ApiValidationFailure,
} from '../../common/swagger/api-response.decorators';

@ApiTags('users')
@ApiBearerAuth()
@ApiAuthFailures()
@ApiAdminOnly()
@Controller('users')
// Admin by default for the whole controller; the two /me routes below opt
// back down to any authenticated role. Deny-by-default beats remembering to
// guard each new admin route.
@Roles('admin')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @Roles('user', 'admin')
  @ApiOperation({ summary: 'Your own profile', description: 'Any signed-in role.' })
  @ApiDataResponse(UserEntity)
  findMe(@CurrentUser() user: AuthUser) {
    return this.usersService.findById(user.userId);
  }

  @Patch('me')
  @Roles('user', 'admin')
  @ApiOperation({
    summary: 'Update your own name / interests',
    description:
      'Deliberately narrower than PUT /users/:id — `role` and `password` are ' +
      'not part of this payload, so self-promotion is impossible by ' +
      'construction rather than by a runtime check. Sending either field is ' +
      'rejected as an unknown property.',
  })
  @ApiDataResponse(UserEntity)
  @ApiValidationFailure()
  updateMe(@CurrentUser() user: AuthUser, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(user.userId, dto);
  }

  @Get('grouped-by-interests')
  @ApiOperation({
    summary: 'Scenario 1 — users grouped by interest',
    description:
      'One collection.aggregate() call: $match → $unwind → $group → $sort → ' +
      '$facet. The $facet stage produces the page and the total in a single ' +
      'pass, which is how this paginates without a second query or a second ' +
      'method call.',
  })
  @ApiPaginatedResponse(InterestGroupEntity, 'One entry per distinct interest')
  groupedByInterests(@Query() query: PaginationQueryDto) {
    return this.usersService.groupByInterests(query.page, query.limit);
  }

  @Post()
  @ApiOperation({
    summary: 'Create a user',
    description: 'Unlike registration, an admin may set the role here.',
  })
  @ApiDataResponse(UserEntity, { created: true })
  @ApiValidationFailure()
  @ApiDuplicateEmail()
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Get()
  @ApiOperation({
    summary: 'List users',
    description:
      'Add `?interest=chess` to filter. That query is served by the ' +
      '{ interests: 1, _id: -1 } index — equality on the array element, with ' +
      'the same index supplying the page order.',
  })
  @ApiPaginatedResponse(UserEntity)
  findAll(@Query() query: UserQueryDto) {
    return this.usersService.findAll(query.page, query.limit, query.interest);
  }

  @Get(':id')
  @ApiParam({ name: 'id', example: '6a8338caf61145182ef4f961' })
  @ApiOperation({ summary: 'Fetch one user', description: 'Served by the default _id index.' })
  @ApiDataResponse(UserEntity)
  @ApiValidationFailure()
  @ApiMissing('User')
  findOne(@Param('id', ParseObjectIdPipe) id: string) {
    return this.usersService.findById(id);
  }

  @Put(':id')
  @ApiParam({ name: 'id', example: '6a8338caf61145182ef4f961' })
  @ApiOperation({
    summary: 'Update a user',
    description:
      'An admin cannot remove their own admin role — that would lock them ' +
      'out of this endpoint with no way back.',
  })
  @ApiDataResponse(UserEntity)
  @ApiValidationFailure()
  @ApiMissing('User')
  @ApiDuplicateEmail()
  update(
    @CurrentUser() actor: AuthUser,
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.update(id, dto, actor.userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiParam({ name: 'id', example: '6a8338caf61145182ef4f961' })
  @ApiOperation({
    summary: 'Delete a user and all of their notes and posts',
    description:
      'Cascades so nothing is left pointing at a missing owner. The deleted ' +
      "user's token stops working on their very next request. An admin " +
      'cannot delete their own account.',
  })
  @ApiNoContentResponse({ description: 'Deleted' })
  @ApiValidationFailure()
  @ApiMissing('User')
  remove(
    @CurrentUser() actor: AuthUser,
    @Param('id', ParseObjectIdPipe) id: string,
  ) {
    return this.usersService.remove(id, actor.userId);
  }
}
