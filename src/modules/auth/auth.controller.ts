import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResultEntity } from './entities/auth-result.entity';
import { UserEntity } from '../users/entities/user.entity';
import { Public } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from './strategies/jwt.strategy';
import {
  ApiAuthFailures,
  ApiDataResponse,
  ApiDuplicateEmail,
  ApiValidationFailure,
  ErrorResponseDto,
} from '../../common/swagger/api-response.decorators';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  // Credential endpoints get a far tighter budget than the global one so
  // that password guessing is not merely slow but rate-limited.
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('register')
  @ApiOperation({
    summary: 'Create an account and receive a JWT',
    description:
      'New accounts are always created with the `user` role — the role field ' +
      'is not accepted here, so registration cannot mint an admin. Rate ' +
      'limited to 10 requests per minute.',
  })
  @ApiDataResponse(AuthResultEntity, { created: true, description: 'Account created' })
  @ApiValidationFailure()
  @ApiDuplicateEmail()
  @ApiTooManyRequestsResponse({
    description: 'More than 10 attempts in a minute',
    type: ErrorResponseDto,
  })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @UseGuards(AuthGuard('local'))
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiBody({ type: LoginDto })
  @ApiOperation({
    summary: 'Exchange credentials for a JWT',
    description:
      'Try `admin@test.com` / `admin123`, or `alice@test.com` / ' +
      '`password123`. Copy `data.access_token` into **Authorize** above to ' +
      'call the protected endpoints. Rate limited to 10 requests per minute.',
  })
  @ApiDataResponse(AuthResultEntity, { description: 'Authenticated' })
  @ApiUnauthorizedResponse({
    description:
      'Wrong password, or no such account — reported identically, and taking ' +
      'the same time, so login cannot be used to discover which emails exist',
    type: ErrorResponseDto,
  })
  @ApiTooManyRequestsResponse({
    description: 'More than 10 attempts in a minute',
    type: ErrorResponseDto,
  })
  login(@Request() req: { user: Parameters<AuthService['login']>[0] }) {
    return this.authService.login(req.user);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiAuthFailures()
  @ApiOperation({
    summary: 'Profile of the authenticated user',
    description:
      'Read from the database rather than decoded from the token, so the ' +
      'response always reflects the current name, role and interests.',
  })
  @ApiDataResponse(UserEntity)
  me(@CurrentUser() user: AuthUser) {
    return this.authService.profile(user.userId);
  }
}
