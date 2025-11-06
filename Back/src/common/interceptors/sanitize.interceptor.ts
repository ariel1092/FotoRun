import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { sanitize } from 'class-sanitizer';

@Injectable()
export class SanitizeInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();

    // Sanitize request body (only if it's a plain object, not arrays or complex objects)
    if (request.body && typeof request.body === 'object' && !Array.isArray(request.body)) {
      try {
        request.body = sanitize(request.body);
      } catch (error) {
        // Silently ignore sanitization errors for plain objects
        // class-sanitizer requires class instances with decorators
      }
    }

    // Sanitize request query parameters
    if (request.query && typeof request.query === 'object' && !Array.isArray(request.query)) {
      try {
        request.query = sanitize(request.query);
      } catch (error) {
        // Silently ignore sanitization errors
      }
    }

    // Sanitize request parameters
    if (request.params && typeof request.params === 'object' && !Array.isArray(request.params)) {
      try {
        request.params = sanitize(request.params);
      } catch (error) {
        // Silently ignore sanitization errors
      }
    }

    // Don't sanitize responses - they come from TypeORM and are plain objects/arrays
    return next.handle();
  }
}

