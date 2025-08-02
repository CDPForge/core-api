import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from "sequelize-typescript";
import { User } from "../../users/user.model"; // Assumi che esista un'entità User
import { Role } from "./role.entity";

@Table({
  tableName: "users_roles",
  timestamps: true,
  underscored: true,
})
export class UserRole extends Model<UserRole> {
  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    onDelete: "CASCADE",
  })
  userId: number;

  @ForeignKey(() => Role)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    onDelete: "CASCADE",
  })
  roleId: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  clientId: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  instanceId: number;

  @BelongsTo(() => User)
  user: User;

  @BelongsTo(() => Role)
  role: Role;
}
