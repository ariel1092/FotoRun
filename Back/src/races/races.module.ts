import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RacesController } from './race.controller';
import { RacesService } from './race.service';
import { Race } from './race.entity';
import { PhotosModule } from '../photos/photos.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Race]),
        forwardRef(() => PhotosModule), // ForwardRef para evitar dependencia circular
    ],
    controllers: [RacesController],
    providers: [RacesService],
    exports: [RacesService],
})
export class RacesModule { }
