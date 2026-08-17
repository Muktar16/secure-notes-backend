import { NestFactory } from '@nestjs/core';
import { Logger, RequestMethod, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { MongooseExceptionFilter } from './common/filters/mongoose-exception.filter';
import { setupSwagger } from './common/swagger/setup-swagger';

/**
 * FRONTEND_URL holds a comma-separated allow-list. Requests with no Origin
 * header (curl, Postman, server-to-server) are allowed through; browser
 * origins must match the list exactly, with Vercel preview deployments
 * permitted so a new preview URL does not require a redeploy of the API.
 */
function buildCorsOrigin(configured: string | undefined) {
  const allowed = (configured ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  return (origin: string | undefined, callback: (err: Error | null, ok?: boolean) => void) => {
    if (!origin) return callback(null, true);
    if (allowed.includes(origin)) return callback(null, true);
    if (/^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(origin)) {
      return callback(null, true);
    }
    return callback(null, false);
  };
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(ConfigService);

  // Render/Vercel terminate TLS upstream; without this the rate limiter would
  // see the proxy's address for every caller and throttle them as one client.
  app.set('trust proxy', 1);

  app.use(helmet());
  app.enableCors({
    origin: buildCorsOrigin(config.get<string>('FRONTEND_URL')),
    credentials: true,
  });

  // Everything lives under /api except the root index page.
  app.setGlobalPrefix('api', {
    exclude: [{ path: '/', method: RequestMethod.GET }],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
    }),
  );
  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalFilters(new MongooseExceptionFilter());

  setupSwagger(app);

  const port = Number(
    process.env.PORT ?? config.get<string>('BACKEND_PORT') ?? 3001,
  );
  await app.listen(port, '0.0.0.0');
  new Logger('Bootstrap').log(`API listening on 0.0.0.0:${port}`);
}

bootstrap().catch((err) => {
  console.error('Failed to start backend', err);
  process.exit(1);
});
