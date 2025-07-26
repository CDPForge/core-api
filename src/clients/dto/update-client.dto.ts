import { PartialType } from "@nestjs/mapped-types";
import { CreateClientDto } from "./create-client.dto";
import { IsString, Length } from "class-validator";

export class UpdateClientDto extends PartialType(CreateClientDto) {
  @IsString()
  @Length(4, 45)
  name!: string;
}
