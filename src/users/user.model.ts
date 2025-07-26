import { Column, Model, Table, DataType } from "sequelize-typescript";

@Table({
  timestamps: true,
  tableName: "users",
  underscored: true,
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
  })
  password!: string;

  @Column({
    defaultValue: false,
  })
  isSuperAdmin!: boolean;

  @Column({
    type: DataType.ENUM("active", "inactive", "blocked"),
    defaultValue: "active",
  })
  status!: string;

  @Column({})
  lastLoginAt?: Date;

  @Column({
    field: "reset_token",
  })
  resetToken?: string;

  @Column({
    field: "reset_token_expiry",
  })
  resetTokenExpiry?: Date;
}
