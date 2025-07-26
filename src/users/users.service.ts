import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { User } from "./user.model";
import { Transaction } from "sequelize";

@Injectable()
export class UsersService {
  constructor(@InjectModel(User) private userRepository: typeof User) {}

  async findOne(username: string): Promise<User | null> {
    return await this.userRepository.scope().findOne({
      where: { username },
    });
  }

  async create(
    user: Partial<User>,
    options?: { transaction?: Transaction },
  ): Promise<User> {
    return this.userRepository.create(user, options);
  }

  async count(): Promise<number> {
    return this.userRepository.count();
  }
}
