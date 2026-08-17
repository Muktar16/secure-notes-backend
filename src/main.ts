import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { MongooseExceptionFilter } from './common/filters/mongoose-exception.filter';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const frontendUrl = configService.get<string>('FRONTEND_URL');

  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalFilters(new MongooseExceptionFilter());
  app.useGlobalGuards(new JwtAuthGuard(app.get(Reflector)), new RolesGuard(app.get(Reflector)));
  app.enableCors({ origin: frontendUrl, credentials: true });

  const port = process.env.PORT || configService.get<number>('BACKEND_PORT') || 3001;
  await app.listen(port);
  console.log(`Backend running on http://localhost:${port}`);
}
bootstrap();
