import {
  Controller,
  Get,
  Post,
  Param,
  Delete,
  Put,
  Body,
  UseGuards,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

interface JwtUser {
  id: string;
  email: string;
  role: string;
}

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Listar todos los usuarios' })
  @ApiResponse({
    status: 200,
    description: 'Lista de usuarios obtenida exitosamente',
    schema: {
      example: [
        {
          id: 'uuid',
          email: 'leslie@fotorun.com',
          firstName: 'Leslie',
          lastName: null,
          name: 'Leslie',
          role: 'user',
          isActive: true,
          createdAt: '2025-10-31T10:00:00.000Z',
        },
      ],
    },
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async findAll() {
    const users = await this.usersService.findAll();
    // Agregar name para compatibilidad con frontend
    return users.map(user => ({
      ...user,
      name: user.getFullName(),
    }));
  }

  @Get('me')
  @ApiOperation({ summary: 'Obtener datos del usuario autenticado' })
  @ApiResponse({
    status: 200,
    description: 'Usuario obtenido exitosamente',
    schema: {
      example: {
        id: 'uuid',
        email: 'leslie@fotorun.com',
        name: 'Leslie',
        role: 'user',
        isActive: true,
        createdAt: '2025-10-31T10:00:00.000Z',
        updatedAt: '2025-10-31T10:00:00.000Z',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  async getMe(@CurrentUser() user: JwtUser) {
    const fullUser = await this.usersService.findById(user.id);
    if (!fullUser) {
      throw new NotFoundException('User not found');
    }

    const { password: _, ...result } = fullUser;
    // Agregar name para compatibilidad con frontend
    return {
      ...result,
      name: fullUser.getFullName(),
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener usuario por ID' })
  @ApiParam({ name: 'id', description: 'ID del usuario', example: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'Usuario obtenido exitosamente',
    schema: {
      example: {
        id: 'uuid',
        email: 'leslie@fotorun.com',
        name: 'Leslie',
        role: 'user',
        isActive: true,
        createdAt: '2025-10-31T10:00:00.000Z',
        updatedAt: '2025-10-31T10:00:00.000Z',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  async findOne(@Param('id') id: string) {
    const user = await this.usersService.findById(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    const { password: _, ...result } = user;
    // Agregar name para compatibilidad con frontend
    return {
      ...result,
      name: user.getFullName(),
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar usuario' })
  @ApiParam({ name: 'id', description: 'ID del usuario', example: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'Usuario eliminado exitosamente',
    schema: {
      example: {
        message: 'User deleted successfully',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Sin permisos para eliminar' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  async remove(@Param('id') id: string, @CurrentUser() currentUser: JwtUser) {
    const user = await this.usersService.findById(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    if (currentUser.role !== 'admin' && currentUser.id !== id) {
      throw new ForbiddenException(
        'You do not have permission to delete this user',
      );
    }

    await this.usersService.remove(id);
    return { message: 'User deleted successfully' };
  }

  @Put(':id/role')
  @Roles('admin')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Actualizar rol de usuario (solo admin)' })
  @ApiParam({ name: 'id', description: 'ID del usuario', example: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'Rol actualizado exitosamente',
    schema: {
      example: {
        id: 'uuid',
        email: 'fotografo@jerpro.com',
        name: 'JERPRO',
        role: 'photographer',
        isActive: true,
      },
    },
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Solo administradores pueden cambiar roles' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  async updateRole(
    @Param('id') id: string,
    @Body('role') role: string,
  ) {
    if (!role) {
      throw new ForbiddenException('Role is required');
    }

    const user = await this.usersService.updateRole(id, role);
    const { password: _, ...result } = user;
    // Agregar name para compatibilidad con frontend
    return {
      ...result,
      name: user.getFullName(),
    };
  }

  @Post('me/promote-to-photographer')
  @ApiOperation({ 
    summary: 'Auto-promocionarse a photographer (solo si no existe ningún photographer)',
    description: 'Permite a un usuario autenticado promocionarse a photographer si es el primero en el sistema. Útil para setup inicial.',
  })
  @ApiResponse({
    status: 200,
    description: 'Promocionado a photographer exitosamente',
    schema: {
      example: {
        id: 'uuid',
        email: 'fotografo@jerpro.com',
        firstName: 'JERPRO',
        lastName: null,
        name: 'JERPRO',
        role: 'photographer',
        isActive: true,
        message: 'Promocionado a photographer exitosamente',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 409, description: 'Ya existe un photographer en el sistema' })
  async promoteToPhotographer(@CurrentUser() user: JwtUser) {
    const updatedUser = await this.usersService.promoteToPhotographer(user.id);
    const { password: _, ...result } = updatedUser;
    // Agregar name para compatibilidad con frontend
    return {
      ...result,
      name: updatedUser.getFullName(),
      message: 'Promocionado a photographer exitosamente',
    };
  }

  @Get('check-photographer')
  @ApiOperation({ summary: 'Verificar si existe algún photographer en el sistema' })
  @ApiResponse({
    status: 200,
    description: 'Estado de photographers',
    schema: {
      example: {
        hasPhotographer: true,
      },
    },
  })
  async checkPhotographer() {
    const hasPhotographer = await this.usersService.hasPhotographer();
    return { hasPhotographer };
  }
}
