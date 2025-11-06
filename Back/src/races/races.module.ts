import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RacesController } from './race.controller';
import { RacesService } from './race.service';
import { Race } from './race.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Race])],
    controllers: [RacesController],
    providers: [RacesService],
    exports: [RacesService],
})
export class RacesModule { }
