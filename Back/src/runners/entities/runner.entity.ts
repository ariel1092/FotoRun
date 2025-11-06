import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, OneToMany } from 'typeorm';
import { Detection } from '../../detection/entities/detection.entity';

@Entity('runners')
export class Runner {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  plate_number: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  email?: string;

  @Column({ nullable: true })
  phone?: string;

  @CreateDateColumn()
  created_at: Date;

}
