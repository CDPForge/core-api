import { Module } from "@nestjs/common";
import { UsersService } from "./users.service";
import { UsersController } from "./users.controller";
import { SequelizeModule } from "@nestjs/sequelize";
import { User } from "./user.model";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";

@Module({
  imports: [SequelizeModule.forFeature([User])],
  providers: [UsersService, JwtAuthGuard],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
