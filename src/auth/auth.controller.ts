import { Controller, Req, Post, UseGuards, Get } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { LocalAuthGuard } from "./local-auth.guard";
import { User } from "../users/user.model";
import { Request } from "express";
import { JwtRefreshGuard } from "./jwt-refresh.guard";

@Controller("auth") // Definisce il percorso base per gli endpoint di questo controller
export class AuthController {
  constructor(private authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Post("login")
  async login(@Req() req: Request) {
    const user = req.user! as User;
    return this.authService.login(user); // Chiama il metodo login del AuthService per generare il token JWT
  }

  @UseGuards(JwtAuthGuard) // Usa il JwtAuthGuard per proteggere questo endpoint
  @Get("profile") // Esempio di endpoint protetto
  getProfile(@Req() req: Request) {
    // L'oggetto 'user' è allegato alla richiesta dal JwtAuthGuard dopo la validazione del token JWT
    return req.user; // Restituisce le informazioni dell'utente autenticato
  }

  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  async refresh(@Req() req: Request) {
    const user = req.user! as User;
    return this.authService.login(user);
  }
}
