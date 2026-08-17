import { ApiProperty } from '@nestjs/swagger';

/**
 * The documented shape of a user as the API returns it.
 *
 * Note what is absent: `password`. That is not an omission in the docs — the
 * field is `select: false` on the schema and stripped by `toJSON`/`toObject`,
 * so it cannot appear in a response.
 */
export class UserEntity {
  @ApiProperty({ example: '6a8338caf61145182ef4f961' })
  _id: string;

  @ApiProperty({ example: 'Alice Johnson' })
  name: string;

  @ApiProperty({ example: 'alice@test.com' })
  email: string;

  @ApiProperty({ enum: ['user', 'admin'], example: 'user' })
  role: string;

  @ApiProperty({ example: ['reading', 'chess', 'painting'], type: [String] })
  interests: string[];

  @ApiProperty({ example: '2026-08-17T16:37:30.578Z' })
  createdAt: string;

  @ApiProperty({ example: '2026-08-17T16:37:30.578Z' })
  updatedAt: string;
}

class InterestGroupMemberEntity {
  @ApiProperty({ example: 'Alice Johnson' })
  name: string;

  @ApiProperty({ example: 'alice@test.com' })
  email: string;
}

/** One group produced by the Scenario 1 aggregation. */
export class InterestGroupEntity {
  @ApiProperty({ example: 'chess', description: 'The interest itself — the $group key' })
  _id: string;

  @ApiProperty({ example: 7, description: 'How many users hold this interest' })
  count: number;

  @ApiProperty({ type: [InterestGroupMemberEntity] })
  users: InterestGroupMemberEntity[];
}
