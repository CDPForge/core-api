import { IsString, Length } from "class-validator";

export class CreateClientDto {
  @IsString()
  @Length(4, 45)
  name!: string;
}
