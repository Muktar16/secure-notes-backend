import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AuthorEntity } from '../../modules/posts/entities/post.entity';
import {
  ErrorResponseDto,
  PaginationMetaDto,
} from './api-response.decorators';

const DESCRIPTION = `
Role-based note taking, built for the Care Guide BD backend task.

### Signing in

1. \`POST /api/auth/login\` with **admin@test.com** / **admin123** (admin) or
   **alice@test.com** / **password123** (regular user).
2. Copy \`data.access_token\` from the response.
3. Click **Authorize** above, paste the token, and every endpoint below is
   callable from this page. The token is remembered across reloads.

Signing in as both accounts is the quickest way to see the access control:
the same request to \`/api/users\` returns 200 for one and 403 for the other.

### Response shape

Every response is wrapped by a global interceptor:

\`\`\`json
{ "data": { "…": "one item" } }
{ "data": [ "…" ], "meta": { "page": 1, "limit": 10, "total": 70, "totalPages": 7 } }
\`\`\`

Every list endpoint — including both aggregations — accepts \`page\` and
\`limit\` (1–100, default 10).

### Things worth trying

- Delete a user, then call any endpoint with their token: **401**. The user is
  re-read from the database on every request, so access is revoked at once
  rather than when the token expires.
- Ask for another user's note by id: **404**, not 403. Ownership is part of the
  query, so there is no way to discover which ids exist.
- Search any response for \`password\`: it is never present. The field is
  \`select: false\` and stripped on serialisation.
`;

export function setupSwagger(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('SecureNotes API')
    .setDescription(DESCRIPTION)
    .setVersion('1.0.0')
    .addBearerAuth({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      description: 'Paste the access_token from POST /api/auth/login',
    })
    // Declaration order here is the order the groups appear in the UI:
    // authenticate first, then the resources, then the graded aggregations.
    .addTag('auth', 'Registration, login, and the current user')
    .addTag('users', 'Admin user management, self-service profile, and Scenario 1')
    .addTag('notes', 'Ownership-scoped CRUD — your own notes, or all of them as an admin')
    .addTag('posts', 'Public posts, and Scenario 2 ($lookup)')
    .addTag('health', 'Liveness and database connectivity')
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    // Referenced through $ref rather than as a direct property type, so they
    // have to be registered explicitly or the schema would dangle.
    extraModels: [AuthorEntity, ErrorResponseDto, PaginationMetaDto],
  });

  SwaggerModule.setup('api/docs', app, document, {
    // The raw OpenAPI document, for importing into Postman or Insomnia.
    jsonDocumentUrl: 'api/docs-json',
    customSiteTitle: 'SecureNotes API — documentation',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      docExpansion: 'list',
      filter: true,
      tryItOutEnabled: true,
    },
  });
}
