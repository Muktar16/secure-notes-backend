import { ApiProperty } from '@nestjs/swagger';
import { AuthorEntity } from '../../posts/entities/post.entity';

export class NoteEntity {
  @ApiProperty({ example: '6a8338caf61145182ef4f981' })
  _id: string;

  @ApiProperty({
    description:
      'The owner. A plain id for your own notes; populated to ' +
      '{ _id, name, email } in the admin view, where knowing whose note it ' +
      'is actually matters.',
    oneOf: [{ type: 'string' }, { $ref: '#/components/schemas/AuthorEntity' }],
  })
  userId: string | AuthorEntity;

  @ApiProperty({ example: 'Meeting notes' })
  title: string;

  @ApiProperty({ example: 'Discussed the Q3 roadmap.' })
  content: string;

  @ApiProperty({ example: '2026-08-17T16:37:30.578Z' })
  createdAt: string;

  @ApiProperty({ example: '2026-08-17T16:37:30.578Z' })
  updatedAt: string;
}
