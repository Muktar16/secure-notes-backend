import { ApiProperty } from '@nestjs/swagger';
import { UserEntity } from '../../users/entities/user.entity';

export class AuthResultEntity {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9…',
    description:
      'Send as `Authorization: Bearer <token>`. Expires per JWT_EXPIRY ' +
      '(24h by default), and stops working immediately if the account is ' +
      'deleted, since the user is re-read on every request.',
  })
  access_token: string;

  @ApiProperty({ type: UserEntity })
  user: UserEntity;
}
