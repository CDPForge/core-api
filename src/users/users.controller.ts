import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Response, Request } from "express";
import { UsersService } from "./users.service";
import { User } from "./user.model";
import { IsSuperAdmin } from "src/decorators/is-super-admin.decorator";
import { PermissionsGuard } from "src/auth/permission.guard";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";

@Controller("users")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}
  @Get("profile")
  getProfile(@Req() req: Request, @Res() res: Response) {
    return res.json(req.user);
  }

  @Post()
  @IsSuperAdmin()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @IsSuperAdmin()
  findAll() {
    return this.usersService.findAll();
  }

  @Get(":id")
  findOne(
    @Req() req: Request & { user?: { user: Partial<User> } },
    @Param("id") id: string,
  ) {
    if (req.user?.user.isSuperAdmin || req.user?.user.id == id) {
      return this.usersService.findOne(id);
    }
    throw new ForbiddenException();
  }

  @Patch(":id")
  update(
    @Req() req: Request & { user?: { user: Partial<User> } },
    @Param("id") id: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    if (req.user?.user.isSuperAdmin || req.user?.user.id == id) {
      return this.usersService.update(id, updateUserDto);
    }
    throw new ForbiddenException();
  }

  @Delete(":id")
  @IsSuperAdmin()
  remove(@Param("id") id: number) {
    return this.usersService.remove(id);
  }
}
