import { IsNumber, IsOptional, IsObject, IsNotEmpty } from "class-validator";

export class PreviewSegmentDto {
  @IsNumber()
  @IsNotEmpty()
  clientId: number;

  @IsNumber()
  @IsOptional()
  instanceId?: number;

  @IsObject()
  @IsNotEmpty()
  query: any;
}
