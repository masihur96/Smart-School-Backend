import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let detail: any = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'string') {
        message = res;
      } else {
        const resObj = res as any;
        message = resObj.message || message;
        // Pass through a nested errors array (e.g. from ConflictException)
        if (resObj.errors) {
          detail = resObj.errors;
        }
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      detail = process.env.NODE_ENV !== 'production' ? exception.stack : undefined;
    }

    // Always log the full error on server side
    this.logger.error(
      `[${request.method}] ${request.url} → ${status} — ${message}`,
      exception instanceof Error ? exception.stack : String(exception),
    );

    response.status(status).json({
      statusCode: status,
      message,
      ...(detail ? { errors: detail } : {}),
    });
  }
}
