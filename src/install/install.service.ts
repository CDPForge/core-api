import { InstallDto } from "./install.dto";
import { Injectable } from "@nestjs/common";
import { UsersService } from "../users/users.service";
import { InstancesService } from "../instances/instances.service";
import { ClientsService } from "../clients/clients.service";
import { Sequelize } from "sequelize-typescript";
import * as bcrypt from "bcrypt";

@Injectable()
export class InstallService {
  constructor(
    private usersService: UsersService,
    private instancesService: InstancesService,
    private clientsService: ClientsService,
    private readonly sequelize: Sequelize,
  ) {}
  async install(installDto: InstallDto) {
    const transaction = await this.sequelize.transaction();
    try {
      await this.usersService.create(
        {
          username: "admin",
          email: installDto.user.email,
          password: bcrypt.hashSync(installDto.user.password, 12),
          isSuperAdmin: true,
        },
        { transaction },
      );

      const client = await this.clientsService.create(
        {
          name: installDto.clientName,
        },
        { transaction },
      );

      await this.instancesService.create(
        {
          client: client.id,
          description: installDto.instanceDescription,
        },
        { transaction },
      );

      await this.clientsService.create(
        {
          name: installDto.clientName,
        },
        { transaction },
      );
      return await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}
