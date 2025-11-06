import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Photo } from '../../photos/photo.entity';  // ← SIN /entities/

@Entity('detections')
export class Detection {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Photo, (photo) => photo.detections)
  @JoinColumn({ name: 'photoId' })
  photo: Photo;

  @Column({ type: 'uuid' })
  photoId: string;

  @Column({ type: 'varchar', length: 10 })
  bibNumber: string;

  @Column({ type: 'float', default: 0 })
  confidence: number;

  @Column({ type: 'float' })
  x: number;

  @Column({ type: 'float' })
  y: number;

  @Column({ type: 'float' })
  width: number;

  @Column({ type: 'float' })
  height: number;

    @Column({ type: 'float', default: 0 })
    detectionConfidence: number; // Roboflow confidence

    @Column({ type: 'float', default: 0 })
    ocrConfidence: number; // OCR confidence

    @Column({ type: 'varchar', length: 20, nullable: true })
    detectionMethod: string; // 'robofow_only' | 'ocr_verified' | 'ocr_corrected'

    @Column({ type: 'jsonb', nullable: true })
    metadata: Record<string, any>;

    @Column({ type: 'jsonb', nullable: true })
    ocrMetadata: Record<string, any>; // OCR raw text, alternatives, etc.

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
