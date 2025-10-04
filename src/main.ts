import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { AppModule } from "./app.module";
import * as cookieParser from "cookie-parser";
import * as process from "node:process";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: process.env.FRONTEND_URL || "*",
    credentials: true,
  });
  app.use(cookieParser());
  // 🔐 Abilita la validazione automatica dei DTO
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Rimuove i campi non dichiarati nel DTO
      forbidNonWhitelisted: true, // Genera errore se ci sono campi non dichiarati
      transform: true, // Trasforma i tipi (utile per es. con numeri)
    }),
  );
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
