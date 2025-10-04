import {
  Table,
  Column,
  Model,
  DataType,
  BelongsToMany,
} from "sequelize-typescript";
import { RolePermission } from "./rolePermission.entity";
import { Permission } from "../../permissions/entities/permission.entity";

@Table({
  tableName: "roles",
  timestamps: true,
  underscored: true,
})
export class Role extends Model<Role> {
  static SUPER_ADMIN_ROLE_ID = 1;
  @Column({
    type: DataType.STRING(255),
    allowNull: false,
    unique: true,
  })
  name: string;

  @BelongsToMany(() => Permission, {
    through: () => RolePermission,
    otherKey: 'permissionId',
    foreignKey: 'roleId',
  })
  permissions: Permission[];
}
