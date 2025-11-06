import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { AuthService } from '../auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(LocalStrategy.name);

  constructor(private authService: AuthService) {
    super({
      usernameField: 'email',
    });
    this.logger.log('🔧 LocalStrategy inicializada con usernameField: email');
  }

  async validate(email: string, password: string): Promise<any> {
    this.logger.log('🔍 LocalStrategy.validate - Iniciando validación');
    this.logger.log('📧 Email recibido:', email || 'null/undefined');
    this.logger.log('🔑 Password recibido:', { 
      hasPassword: !!password, 
      passwordLength: password?.length || 0 
    });

    if (!email || !password) {
      this.logger.error('❌ LocalStrategy.validate - Email o password faltantes');
      throw new UnauthorizedException('Email and password are required');
    }

    const user = await this.authService.validateUser(email, password);
    
    if (!user) {
      this.logger.warn('⚠️ LocalStrategy.validate - Usuario no encontrado o contraseña incorrecta');
      throw new UnauthorizedException('Invalid credentials');
    }
    
    this.logger.log('✅ LocalStrategy.validate - Usuario validado exitosamente:', { 
      id: user.id, 
      email: user.email, 
      role: user.role 
    });
    
    return user;
  }
}
