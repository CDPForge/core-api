import { Table, Column, Model, DataType, HasMany } from "sequelize-typescript";
import { RolePermission } from "../../roles/entities/rolePermission.entity";

@Table({
  tableName: "permissions",
  timestamps: true,
  underscored: true,
})
export class Permission extends Model {
  @Column({
    type: DataType.STRING(255),
    allowNull: false,
    unique: true,
  })
  name: string;

  // Definisce la relazione "one-to-many" con la tabella di join `roles_permissions`
  @HasMany(() => RolePermission)
  rolePermissions: RolePermission[];
}
