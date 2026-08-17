import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { NotesModule } from './modules/notes/notes.module';
import { PostsModule } from './modules/posts/posts.module';
import { HealthController, RootController } from './app.controller';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { validateEnv } from './config/env.validation';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    MongooseModule.forRootAsync({
      useFactory: (config: ConfigService) => ({
        uri: config.getOrThrow<string>('MONGODB_URI'),
        // Surface an unreachable cluster in seconds instead of hanging past a
        // platform's port-scan window.
        serverSelectionTimeoutMS: 10_000,
      }),
      inject: [ConfigService],
    }),
    // Baseline abuse protection for every route; /auth/login and
    // /auth/register tighten this further with @Throttle.
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    AuthModule,
    UsersModule,
    NotesModule,
    PostsModule,
  ],
  controllers: [RootController, HealthController],
  providers: [
    // Order matters: rate-limit before authenticating, authenticate before
    // checking roles. Registered here rather than in main.ts so each guard
    // can use dependency injection.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
