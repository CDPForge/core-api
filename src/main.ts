import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
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
bootstrap();
