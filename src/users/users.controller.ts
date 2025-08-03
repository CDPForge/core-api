import {
  Body,
  Controller,
  Delete,
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

@Controller("users")
export class UsersController {
  constructor(private usersService: UsersService) {}
  @Get("profile")
  @UseGuards(JwtAuthGuard)
  getProfile(@Req() req: Request, @Res() res: Response) {
    return res.json(req.user);
  }

  @Post()
  create(@Body() createInstanceDto: Partial<User>) {
    return this.usersService.create(createInstanceDto);
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(":id")
  update(@Param("id") id: number, @Body() updateUserDeto: Partial<User>) {
    return this.usersService.update(id, updateUserDeto);
  }

  @Delete(":id")
  remove(@Param("id") id: number) {
    return this.usersService.remove(id);
  }
}
