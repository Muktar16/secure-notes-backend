import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { Error as MongooseError } from 'mongoose';

@Catch()
export class MongooseExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const res = exception.getResponse();
      response.status(status).json(
        typeof res === 'string'
          ? { statusCode: status, message: res }
          : res,
      );
      return;
    }

    if (exception instanceof MongooseError.CastError) {
      response.status(HttpStatus.BAD_REQUEST).json({
        statusCode: HttpStatus.BAD_REQUEST,
        message: `Invalid ${exception.path}: ${exception.value}`,
      });
      return;
    }

    if (
      exception instanceof MongooseError.ValidationError
    ) {
      const messages = Object.values(exception.errors).map(
        (e) => e.message,
      );
      response.status(HttpStatus.BAD_REQUEST).json({
        statusCode: HttpStatus.BAD_REQUEST,
        message: messages,
      });
      return;
    }

    if (
      (exception as any)?.code === 11000
    ) {
      const key = Object.keys((exception as any).keyPattern)[0];
      response.status(HttpStatus.CONFLICT).json({
        statusCode: HttpStatus.CONFLICT,
        message: `Duplicate value for field: ${key}`,
      });
      return;
    }

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
    });
  }
}
