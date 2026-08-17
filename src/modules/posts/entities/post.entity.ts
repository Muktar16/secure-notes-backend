import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AuthorEntity {
  @ApiProperty({ example: 'Alice Johnson' })
  name: string;

  @ApiProperty({ example: 'alice@test.com' })
  email: string;
}

export class PostEntity {
  @ApiProperty({ example: '6a8338caf61145182ef4f971' })
  _id: string;

  @ApiProperty({
    description:
      'The author. Populated to { _id, name, email } on GET /posts so the ' +
      'list is readable without a second request.',
    oneOf: [{ type: 'string' }, { $ref: '#/components/schemas/AuthorEntity' }],
  })
  userId: string | AuthorEntity;

  @ApiProperty({ example: 'Introduction to MongoDB indexing' })
  title: string;

  @ApiProperty({ example: 'How B-tree indexes work…' })
  content: string;

  @ApiProperty({ example: '2026-08-17T16:37:30.578Z' })
  createdAt: string;

  @ApiProperty({ example: '2026-08-17T16:37:30.578Z' })
  updatedAt: string;
}

/** What the Scenario 2 `$lookup` pipeline emits. */
export class PostWithAuthorEntity {
  @ApiProperty({ example: '6a8338caf61145182ef4f971' })
  _id: string;

  @ApiProperty({ example: 'Introduction to MongoDB indexing' })
  title: string;

  @ApiProperty({ example: 'How B-tree indexes work…' })
  content: string;

  @ApiProperty({
    type: AuthorEntity,
    description: 'Joined from users; the lookup sub-pipeline projects only these two fields',
  })
  author: AuthorEntity;

  @ApiPropertyOptional({ example: '2026-08-17T16:37:30.578Z' })
  createdAt?: string;

  @ApiPropertyOptional({ example: '2026-08-17T16:37:30.578Z' })
  updatedAt?: string;
}
