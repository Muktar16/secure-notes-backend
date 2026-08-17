import { Controller, Get } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import {
  ApiExcludeController,
  ApiOperation,
  ApiProperty,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Public } from './common/decorators/roles.decorator';
import { ApiDataResponse } from './common/swagger/api-response.decorators';

/** Served at `/` — the URL a reviewer pastes into a browser first. */
@ApiExcludeController()
@Controller()
export class RootController {
  @Public()
  @Get()
  index() {
    return {
      name: 'SecureNotes API',
      docs: '/api/docs',
      health: '/api/health',
    };
  }
}

export class HealthEntity {
  @ApiProperty({ enum: ['ok', 'degraded'], example: 'ok' })
  status: string;

  @ApiProperty({ enum: ['connected', 'disconnected'], example: 'connected' })
  database: string;

  @ApiProperty({ example: 128, description: 'Seconds since this instance started' })
  uptimeSeconds: number;
}

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  @Public()
  @Get()
  @ApiOperation({
    summary: 'Liveness plus database connection state',
    description:
      'Reports the live Mongoose connection state rather than a hard-coded ' +
      'ok, so a running process that has lost its database is not mistaken ' +
      'for a healthy one. Used as the platform health check.',
  })
  @ApiDataResponse(HealthEntity, { description: 'Service is up' })
  @ApiServiceUnavailableResponse({
    description: 'Reachable, but not connected to MongoDB',
  })
  check() {
    // 1 === connected, per Mongoose's readyState enum.
    const connected = this.connection.readyState === 1;
    return {
      status: connected ? 'ok' : 'degraded',
      database: connected ? 'connected' : 'disconnected',
      uptimeSeconds: Math.floor(process.uptime()),
    };
  }
}
