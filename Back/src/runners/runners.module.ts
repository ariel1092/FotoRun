import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RunnersController } from './runners.controller';
import { RunnersService } from './runners.service';
import { Runner } from './entities/runner.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Runner])],
  controllers: [RunnersController],
  providers: [RunnersService],
  exports: [RunnersService],
})
export class RunnersModule {}