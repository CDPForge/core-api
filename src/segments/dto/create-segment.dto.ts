import {
  IsString,
  IsOptional,
  IsObject,
  IsNotEmpty,
  IsNumber,
} from "class-validator";

export class CreateSegmentDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsObject()
  @IsNotEmpty()
  query: any;

  @IsString()
  @IsOptional()
  status?: string;

  @IsNumber()
  client: number;

  @IsNumber()
  @IsOptional()
  instance?: number;
}
