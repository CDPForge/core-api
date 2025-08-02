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

  async findByEmail(email: string): Promise<User | null> {
    return await this.userRepository.scope().findOne({
      where: { email },
    });
  }

  async findAll(): Promise<User[] | null> {
    return await this.userRepository.scope().findAll();
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

  async update(
    id: number,
    updateUserDto: Partial<User>,
    options?: { transaction?: Transaction },
  ) {
    return await this.userRepository.update(updateUserDto, {
      where: { id },
      ...(options?.transaction && { transaction: options.transaction }),
    });
  }

  async remove(id: number, options?: { transaction?: Transaction }) {
    return await this.userRepository.destroy({
      where: { id },
      ...(options?.transaction && { transaction: options.transaction }),
    });
  }
}
