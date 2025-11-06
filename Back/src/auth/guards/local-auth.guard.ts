// src/auth/guards/local-auth.guard.ts
import { Injectable, ExecutionContext, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {
  private readonly logger = new Logger(LocalAuthGuard.name);

  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    
    // Permitir peticiones OPTIONS (preflight CORS) sin autenticación
    if (request.method === 'OPTIONS') {
      return true;
    }

    // Log para debugging
    this.logger.log('🔒 LocalAuthGuard.canActivate - Iniciando autenticación');
    this.logger.log('📦 Body recibido:', { 
      email: request.body?.email || 'null/undefined',
      hasPassword: !!request.body?.password,
      passwordLength: request.body?.password?.length || 0,
      bodyKeys: Object.keys(request.body || {})
    });
    
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    if (err) {
      this.logger.error('❌ LocalAuthGuard.handleRequest - Error:', err.message);
      throw err;
    }
    if (!user) {
      this.logger.warn('⚠️ LocalAuthGuard.handleRequest - Usuario no autenticado');
      this.logger.warn('ℹ️ Info:', info);
    } else {
      this.logger.log('✅ LocalAuthGuard.handleRequest - Usuario autenticado:', { 
        id: user.id, 
        email: user.email, 
        role: user.role 
      });
    }
    return super.handleRequest(err, user, info, context);
  }
}