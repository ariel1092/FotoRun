import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Photo } from 'src/photos/photo.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ name: 'firstName', type: 'varchar', nullable: true })
  firstName: string | null;

  @Column({ name: 'lastName', type: 'varchar', nullable: true })
  lastName: string | null;

  // Método helper para obtener el nombre completo
  getFullName(): string {
    const parts = [this.firstName, this.lastName].filter((part) => part != null && part.trim() !== '');
    return parts.length > 0 ? parts.join(' ') : this.email;
  }

  @Column({ default: true })
  isActive: boolean;

  // El enum en Supabase es 'participant' por defecto, pero aceptamos 'user', 'photographer', 'admin'
  @Column({ type: 'varchar', length: 20, default: 'user' })
  role: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

@OneToMany(() => Photo, (photo) => photo.uploader)
uploadedPhotos: Photo[];
}
