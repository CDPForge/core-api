import { Controller, Req, Post, UseGuards, Get, Res } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { LocalAuthGuard } from "./local-auth.guard";
import { User } from "../users/user.model";
import { Request, Response } from "express";
import { JwtRefreshGuard } from "./jwt-refresh.guard";

@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Post("login")
  async login(@Req() req: Request, @Res() res: Response) {
    return await this._login(req, res);
  }

  @UseGuards(JwtAuthGuard)
  @Get("profile")
  getProfile(@Req() req: Request) {
    return req.user;
  }

  @UseGuards(JwtRefreshGuard)
  @Post("refresh")
  async refresh(@Req() req: Request, @Res() res: Response) {
    return await this._login(req, res);
  }

  private async _login(@Req() req: Request, @Res() res: Response) {
    const user = req.user! as User;
    const credentials = await this.authService.login(user);
    const refreshToken = credentials.refreshToken;
    return res
      .status(200)
      .cookie("refreshToken", refreshToken, {
        httpOnly: true, // 🔐 non accessibile da JS
        secure: true, // 🔒 solo HTTPS
        sameSite: "none",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 giorni
      })
      .json(credentials);
  }

  @Get("logout")
  logout(@Res() res: Response) {
    res.clearCookie("refreshToken");
    return res.sendStatus(200);
  }
}
