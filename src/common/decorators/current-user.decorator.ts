import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AuthUser } from '../../modules/auth/strategies/jwt.strategy';

/**
 * The authenticated user as resolved by JwtStrategy — read fresh from the
 * database on every request, so `role` here is always the current one.
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser => {
    return ctx.switchToHttp().getRequest<{ user: AuthUser }>().user;
  },
);
