import { Injectable } from "@nestjs/common";
import { Role } from "./entities/role.entity";

@Injectable()
export class RolesService {
  create(createRoleDto: Partial<Role>) {
    return "This action adds a new role";
  }

  findAll() {
    return `This action returns all roles`;
  }

  findOne(id: number) {
    return `This action returns a #${id} role`;
  }

  update(id: number, updateRoleDto: Partial<Role>) {
    return `This action updates a #${id} role`;
  }

  remove(id: number) {
    return `This action removes a #${id} role`;
  }
}
