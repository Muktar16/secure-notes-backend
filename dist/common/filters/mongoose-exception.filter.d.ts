import { ExceptionFilter, ArgumentsHost } from '@nestjs/common';
export declare class MongooseExceptionFilter implements ExceptionFilter {
    catch(exception: unknown, host: ArgumentsHost): void;
}
