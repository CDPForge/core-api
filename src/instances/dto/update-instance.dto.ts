import { PartialType } from "@nestjs/mapped-types";
import { CreateInstanceDto } from "./create-instance.dto";
import { IsString, Length } from "class-validator";

export class UpdateInstanceDto extends PartialType(CreateInstanceDto) {
  @IsString()
  @Length(4, 100)
  description?: string;
}
