import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RoboflowService } from './roboflow.service';

@Module({
  imports: [ConfigModule],
  providers: [RoboflowService],
  exports: [RoboflowService],
})
export class RoboflowModule {}
