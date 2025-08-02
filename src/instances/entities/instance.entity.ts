import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  Default,
  BelongsTo,
} from "sequelize-typescript";
import { Client } from "../../clients/entities/client.entity";

@Table({
  tableName: "instances",
  timestamps: true,
  underscored: true,
})
export class Instance extends Model {
  @ForeignKey(() => Client)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  client!: number;

  @Column({
    type: DataType.STRING(100),
    allowNull: false,
  })
  name!: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: true,
  })
  description?: string;

  @Default(true)
  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
  })
  active!: boolean;

  @BelongsTo(() => Client, { foreignKey: "client" })
  clientEntity: Client;
}
