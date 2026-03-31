import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data: unknown) => {
        // If the response already has message and statusCode, return as is (for error responses)
        if (
          data &&
          typeof data === 'object' &&
          'message' in data &&
          'statusCode' in data
        ) {
          return data;
        }

        // For successful responses, wrap with message and statusCode
        return {
          message: 'Success',
          statusCode: 200,
          data: data,
        };
      }),
    );
  }
}
