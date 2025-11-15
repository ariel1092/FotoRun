// src/auth/guards/optional-jwt-auth.guard.ts
import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  // Override canActivate to not throw error if no token
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    // Call parent canActivate but catch errors
    const result = super.canActivate(context);
    
    // Handle different return types
    if (result instanceof Promise) {
      return result.catch(() => {
        // If authentication fails (no token), allow request to continue
        // The user will just be undefined
        return true;
      });
    }
    
    if (result instanceof Observable) {
      return result.pipe(
        catchError(() => {
          // If authentication fails (no token), allow request to continue
          return of(true);
        })
      );
    }
    
    // If it's a boolean, return it as is
    return result;
  }

  // Override handleRequest to not throw if no user
  handleRequest(err: any, user: any) {
    // If there's an error or no user, just return undefined
    // Don't throw - this makes authentication optional
    if (err || !user) {
      return undefined;
    }
    return user;
  }
}

