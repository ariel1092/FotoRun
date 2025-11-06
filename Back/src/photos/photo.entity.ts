import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    OneToMany,
} from 'typeorm';
import { Race } from '../races/race.entity';
import { User } from '../users/entities/user.entity';
import { Detection } from '../detection/entities/detection.entity';

@Entity('photos')
export class Photo {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'varchar', length: 500 })
    url: string;

    @Column({ type: 'varchar', length: 500, nullable: true })
    thumbnailUrl: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    filename: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    originalName: string;

    @Column({ type: 'varchar', length: 50, nullable: true })
    mimeType: string;

    @Column({ type: 'int', nullable: true })
    size: number;

    @ManyToOne(() => Race, (race) => race.photos)
    @JoinColumn({ name: 'raceId' })
    race: Race;

    @Column({ type: 'uuid' })
    raceId: string;

    @ManyToOne(() => User, (user) => user.uploadedPhotos)
    @JoinColumn({ name: 'uploadedBy' })
    uploader: User;

    @Column({ type: 'uuid' })
    uploadedBy: string;

    @Column({ type: 'boolean', default: false })
    isProcessed: boolean;

    @Column({ type: 'timestamp', nullable: true })
    processedAt: Date;

    @Column({ 
      type: 'varchar', 
      length: 20, 
      default: 'pending',
      enum: ['pending', 'processing', 'completed', 'failed']
    })
    processingStatus: 'pending' | 'processing' | 'completed' | 'failed';

    @Column({ type: 'text', nullable: true })
    processingError: string | null;

    @OneToMany(() => Detection, (detection) => detection.photo)
    detections: Detection[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
