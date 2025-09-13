import { IsString, IsOptional, IsObject, IsNotEmpty } from "class-validator";

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
}
