import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { plainToInstance } from 'class-transformer';
import { sanitize } from 'class-sanitizer';

@Injectable()
export class SanitizeInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();

    // Sanitize request body
    if (request.body && typeof request.body === 'object') {
      request.body = sanitize(request.body);
    }

    // Sanitize request query parameters
    if (request.query && typeof request.query === 'object') {
      request.query = sanitize(request.query);
    }

    // Sanitize request parameters
    if (request.params && typeof request.params === 'object') {
      request.params = sanitize(request.params);
    }

    return next.handle();
  }
}

