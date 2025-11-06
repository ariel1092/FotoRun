import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import type { AuthResponse, UserPayload } from './auth.service';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';

interface JwtUser {
  id: string;
  email: string;
  role: string;
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar nuevo usuario' })
  @ApiResponse({
    status: 201,
    description: 'Usuario creado exitosamente',
    schema: {
      example: {
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        user: {
          id: 'uuid',
          email: 'leslie@fotorun.com',
          name: 'Leslie',
          role: 'user',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 409, description: 'El email ya existe' })
  async register(@Body() registerDto: RegisterDto): Promise<AuthResponse> {
    return await this.authService.register(registerDto);
  }

  @Post('register/photographer')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar nuevo fotógrafo' })
  @ApiResponse({
    status: 201,
    description: 'Fotógrafo creado exitosamente',
    schema: {
      example: {
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        user: {
          id: 'uuid',
          email: 'fotografo@email.com',
          name: 'Fotógrafo',
          role: 'photographer',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 409, description: 'El email ya existe' })
  async registerPhotographer(@Body() registerDto: RegisterDto): Promise<AuthResponse> {
    return await this.authService.register(registerDto, 'photographer');
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Iniciar sesión' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Login exitoso',
    schema: {
      example: {
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        user: {
          id: 'uuid',
          email: 'leslie@fotorun.com',
          name: 'Leslie',
          role: 'user',
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Credenciales inválidas' })
  async login(
    @Body() loginDto: LoginDto,
    @CurrentUser() user: UserPayload,
  ): Promise<AuthResponse> {
    // Log para debugging (remover en producción)
    console.log('🔐 AuthController.login - Inicio de login');
    console.log('📥 LoginDto recibido:', { 
      email: loginDto?.email || 'null/undefined', 
      hasPassword: !!loginDto?.password,
      passwordLength: loginDto?.password?.length || 0
    });
    console.log('👤 Usuario del CurrentUser:', { 
      id: user?.id, 
      email: user?.email, 
      role: user?.role 
    });
    const response = await this.authService.login(user);
    console.log('✅ AuthController.login - Login exitoso para:', user.email);
    return response;
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Obtener perfil del usuario autenticado' })
  @ApiResponse({
    status: 200,
    description: 'Perfil obtenido exitosamente',
    schema: {
      example: {
        id: 'uuid',
        email: 'leslie@fotorun.com',
        role: 'user',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  getProfile(@CurrentUser() user: JwtUser): JwtUser {
    return user;
  }
}
