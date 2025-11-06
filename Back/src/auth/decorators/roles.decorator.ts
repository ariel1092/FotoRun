import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

export enum AppRole {
  USER = 'user',
  PHOTOGRAPHER = 'photographer',
  ADMIN = 'admin',
}

export const Roles = (...roles: (AppRole | string)[]) => SetMetadata(ROLES_KEY, roles);

