import { Column, Model, Table } from "sequelize-typescript";

@Table({
  timestamps: true,
  tableName: "clients",
  underscored: true,
})
export class Client extends Model {
  @Column({
    allowNull: false,
    unique: true,
  })
  name!: string;
}
