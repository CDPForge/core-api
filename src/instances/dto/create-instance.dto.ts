import { IsNumber, IsString, Length } from "class-validator";

export class CreateInstanceDto {
  @IsNumber(
    { allowNaN: false, allowInfinity: false, maxDecimalPlaces: 0 },
    { message: "client must be a valid integer number" },
  )
  client!: number;

  @IsString()
  @Length(4, 100)
  name!: string;

  @IsString()
  @Length(4, 100)
  description?: string;
}
