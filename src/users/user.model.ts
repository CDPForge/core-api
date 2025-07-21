import { Column, Model, Table, DataType } from "sequelize-typescript";

@Table({
  timestamps: true,
  tableName: "users",
})
export class User extends Model {
  @Column({
    allowNull: false,
    unique: true,
  })
  username!: string;

  @Column({
    allowNull: false,
    unique: true,
  })
  email!: string;

  @Column({
    allowNull: false,
    field: "password",
  })
  password!: string;

  @Column({
    defaultValue: false,
    field: "is_super_admin",
  })
  isSuperAdmin!: boolean;

  @Column({
    type: DataType.ENUM("active", "inactive", "blocked"),
    defaultValue: "active",
  })
  status!: string;

  @Column({
    field: "last_login_at",
  })
  lastLoginAt?: Date;

  @Column({
    field: "reset_token",
  })
  resetToken?: string;

  @Column({
    field: "reset_token_expiry",
  })
  resetTokenExpiry?: Date;

  @Column({
    field: "created_at",
  })
  declare createdAt?: Date;

  @Column({
    field: "updated_at",
  })
  declare updatedAt?: Date;
}
