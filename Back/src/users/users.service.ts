import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(email: string, password: string, name: string, role: string = 'user'): Promise<User> {
    const existingUser = await this.userRepository.findOne({
      where: { email },
    });
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Dividir el nombre en firstName y lastName
    const nameParts = name.trim().split(' ');
    const firstName = nameParts[0] || null;
    const lastName = nameParts.slice(1).join(' ') || null;

    const user = this.userRepository.create({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      role,
    });

    const savedUser = await this.userRepository.save(user);
    return savedUser;
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.userRepository.findOne({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    return await this.userRepository.findOne({ where: { id } });
  }

  async validatePassword(
    password: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword);
  }

  async findAll(): Promise<User[]> {
    return await this.userRepository.find({
      select: ['id', 'email', 'firstName', 'lastName', 'role', 'isActive', 'createdAt'],
    });
  }

  async remove(id: string): Promise<void> {
    const result = await this.userRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
  }

  async updateRole(id: string, role: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    const validRoles = ['user', 'photographer', 'admin'];
    if (!validRoles.includes(role)) {
      throw new ConflictException(`Invalid role. Must be one of: ${validRoles.join(', ')}`);
    }

    user.role = role;
    return await this.userRepository.save(user);
  }

  async promoteToPhotographer(userId: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Verificar si ya existe algún photographer en el sistema
    const existingPhotographer = await this.userRepository.findOne({
      where: { role: 'photographer' },
    });

    if (existingPhotographer && existingPhotographer.id !== userId) {
      throw new ConflictException(
        'Ya existe un photographer en el sistema. Solo un administrador puede asignar roles.',
      );
    }

    // Si ya es photographer, no hacer nada
    if (user.role === 'photographer') {
      return user;
    }

    user.role = 'photographer';
    return await this.userRepository.save(user);
  }

  async hasPhotographer(): Promise<boolean> {
    const photographer = await this.userRepository.findOne({
      where: { role: 'photographer' },
    });
    return !!photographer;
  }
}
