import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { Injectable, Logger } from '@nestjs/common';

export interface AuthResponse {
  access_token: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

export interface UserPayload {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<UserPayload | null> {
    
    this.logger.log('🔍 AuthService.validateUser - Iniciando validación');
    this.logger.log('📧 Email recibido:', email || 'null/undefined');
    this.logger.log('🔑 Password recibido:', { hasPassword: !!password, passwordLength: password?.length || 0 });
    
    if (!email || !password) {
      this.logger.error('❌ AuthService.validateUser - Email o password faltantes');
      return null;
    }
    
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      this.logger.warn('⚠️ AuthService.validateUser - Usuario no encontrado con email:', email);
      return null;
    }

    this.logger.log('✅ AuthService.validateUser - Usuario encontrado:', { 
      id: user.id, 
      email: user.email, 
      role: user.role,
      isActive: user.isActive 
    });
    
    this.logger.log('🔐 AuthService.validateUser - Validando contraseña...');
    const isPasswordValid = await this.usersService.validatePassword(
      password,
      user.password,
    );
    
    if (!isPasswordValid) {
      this.logger.warn('⚠️ AuthService.validateUser - Contraseña inválida para usuario:', email);
      return null;
    }

    this.logger.log('✅ AuthService.validateUser - Usuario y contraseña válidos');
    
    const { password: _, ...result } = user;
    // Convertir firstName/lastName a name para compatibilidad
    const userPayload: UserPayload = {
      ...result,
      name: user.getFullName(),
    };
    
    this.logger.log('✅ AuthService.validateUser - UserPayload creado:', {
      id: userPayload.id,
      email: userPayload.email,
      role: userPayload.role,
      name: userPayload.name
    });
    
    return userPayload;
  }

  async login(user: UserPayload): Promise<AuthResponse> {
    const payload = {
      email: user.email,
      sub: user.id,
      role: user.role,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  async register(registerDto: RegisterDto, role: string = 'user'): Promise<AuthResponse> {
    const user = await this.usersService.create(
      registerDto.email,
      registerDto.password,
      registerDto.name,
      role,
    );

    const { password: _, ...result } = user;
    // Agregar name para compatibilidad con UserPayload
    const userPayload: UserPayload = {
      ...result,
      name: user.getFullName(),
    };
    return this.login(userPayload);
  }
}
