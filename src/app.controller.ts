import { Controller, Get } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { ApiExcludeController, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from './common/decorators/roles.decorator';

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

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Liveness plus database connection state' })
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
