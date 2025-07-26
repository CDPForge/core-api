import { IsString, Length, IsEmail, ValidateNested } from "class-validator";
import { Type } from "class-transformer";

class UserDto {
  @IsString()
  @Length(4, 100)
  password: string;

  @IsEmail()
  @Length(4, 100)
  email: string;
}

export class InstallDto {
  @ValidateNested()
  @Type(() => UserDto)
  user: UserDto;
  @IsString()
  @Length(4, 45)
  clientName: string;
  @IsString()
  @Length(4, 100)
  instanceDescription: string;
}
