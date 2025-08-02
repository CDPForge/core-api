import { Column, Model, Table, HasMany } from "sequelize-typescript";
import { Instance } from "../../instances/entities/instance.entity";

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

  @HasMany(() => Instance, { foreignKey: "client" })
  instances?: Instance[];
}
