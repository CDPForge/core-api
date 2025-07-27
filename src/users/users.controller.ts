import {Controller, Get, Req, Res, UseGuards} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Response, Request } from "express";

@Controller("user")
export class UsersController {
  @Get("profile")
  @UseGuards(JwtAuthGuard)
  getProfile(@Req() req: Request,@Res() res: Response) {
      return req.user
  }
}
