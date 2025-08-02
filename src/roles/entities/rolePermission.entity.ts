import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from "sequelize-typescript";
import { Role } from "./role.entity";
import { Permission } from "../../permissions/entities/permission.entity";

@Table({
  tableName: "roles_permissions",
  timestamps: true,
  underscored: true,
})
export class RolePermission extends Model<RolePermission> {
  // Chiave esterna per il ruolo
  @ForeignKey(() => Role)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  roleId: number;

  // Chiave esterna per il permesso
  @ForeignKey(() => Permission)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  permissionId: number;

  // Definisce le relazioni `belongs-to`
  @BelongsTo(() => Role)
  role: Role;

  @BelongsTo(() => Permission)
  permission: Permission;
}
