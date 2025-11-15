// src/auth/guards/optional-jwt-auth.guard.ts
import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  // Override canActivate to not throw error if no token
  canActivate(context: ExecutionContext) {
    // Call parent canActivate but catch errors
    return super.canActivate(context).catch(() => {
      // If authentication fails (no token), allow request to continue
      // The user will just be undefined
      return true;
    });
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

