import { IsString, IsOptional, IsDateString } from 'class-validator';

export class CreateRaceDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsDateString()
  date: string;

  @IsString()
  location: string;

  @IsOptional()
  @IsString()
  distance?: string;
}
