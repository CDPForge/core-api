import { Injectable } from "@nestjs/common";
import { Permission } from "./entities/permission.entity";
import { Op, Transaction } from "sequelize";
import { Role } from "../roles/entities/role.entity";
import { User } from "../users/user.model";

@Injectable()
export class PermissionsService {
  async create(
    permissionBody: Partial<Permission>,
    options?: { transaction?: Transaction },
  ) {
    return await Permission.create(permissionBody, options);
  }

  async findAll() {
    return await Permission.findAll();
  }

  async findOne(id: number) {
    return await Permission.findByPk(id);
  }

  async update(id: number, updatePermissionDto: Partial<Permission>) {
    return await Permission.update(updatePermissionDto, { where: { id } });
  }

  async remove(id: number) {
    return await Permission.destroy({ where: { id } });
  }

  async findUserPermissions(
    userId: number,
    clientId: number,
    instanceId: number | null = null,
  ) {
    const user = await User.findByPk(userId, {
      include: [
        {
          model: Role,
          through: {
            attributes: [],
            where: {
              [Op.or]: [
                // Super admin role
                { roleId: Role.SUPER_ADMIN_ROLE_ID },
                // Altri ruoli con filtri client/instance
                {
                  ...(clientId && { clientId }),
                  ...(instanceId && { instanceId }),
                },
              ],
            },
          },
          include: [
            {
              model: Permission,
              through: { attributes: [] },
            },
          ],
        },
      ],
    });

    return user?.get("roles")?.flatMap((role) => role.get("permissions")) || [];
  }
}
