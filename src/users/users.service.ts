import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { User } from "./user.model";

@Injectable()
export class UsersService {
  constructor(@InjectModel(User) private userRepository: typeof User) {}

  async findOne(username: string): Promise<User | null> {
    return await this.userRepository.scope().findOne({
      where: { username },
    });
  }

  async create(user: Partial<User>): Promise<User> {
    return this.userRepository.create(user);
  }
}
