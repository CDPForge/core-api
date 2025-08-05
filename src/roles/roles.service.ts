import { Injectable } from "@nestjs/common";
import { Role } from "./entities/role.entity";
import { UserRole } from "./entities/userRole.entity";
import { InstancesService } from "../instances/instances.service";

@Injectable()
export class RolesService {
  constructor(private readonly instancesService: InstancesService) {}
  create(createRoleDto: Partial<Role>) {
    return "This action adds a new role";
  }

  async findAll() {
    return await Role.findAll();
  }

  async findOne(id: number) {
    return await Role.findByPk(id);
  }

  update(id: number, updateRoleDto: Partial<Role>) {
    return `This action updates a #${id} role`;
  }

  remove(id: number) {
    return `This action removes a #${id} role`;
  }

  async addUserRoles(userid: number, instance: number, roles: number[]) {
    const i = await this.instancesService.findOne(instance);

    const promises = roles.map((r) =>
      UserRole.upsert({
        userId: userid,
        clientId: i!.get("client"),
        instanceId: instance,
        roleId: r,
      }),
    );

    return await Promise.all(promises);
  }

  async removeUserRoles(userid: number, instance: number, roles: number[]) {
    const i = await this.instancesService.findOne(instance);

    const promises = roles.map((r) =>
      UserRole.destroy({
        where: {
          userId: userid,
          clientId: i!.get("client"),
          instanceId: instance,
          roleId: r,
        },
      }),
    );

    return await Promise.all(promises);
  }

  async setUserRoles(
    userid: number,
    rolesMap: { instance: number; roles: number[] }[],
  ) {
    await UserRole.destroy({
      where: {
        userId: userid,
      },
    });

    const promises = rolesMap.map((r) => {
      return this.addUserRoles(userid, r.instance, r.roles);
    });

    return await Promise.all(promises);
  }

  async findUserRoles(id: number) {
    return await UserRole.findAll({where: {userId: id}});
  }

  async findAllUsersRoles() {
    return await UserRole.findAll();
  }
}
