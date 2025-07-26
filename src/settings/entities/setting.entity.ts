import {
  Table,
  Column,
  Model,
  ForeignKey,
  DataType,
  AllowNull,
  Index,
  BelongsTo,
} from "sequelize-typescript";
import { Client } from "../../clients/entities/client.entity";

@Table({
  tableName: "settings",
  timestamps: true,
  underscored: true,
})
export class Setting extends Model {
  @ForeignKey(() => Client)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  @Index
  client?: number;

  @AllowNull(false)
  @Index
  @Column({
    type: DataType.STRING(50),
  })
  field!: string;

  @AllowNull(false)
  @Column({
    type: DataType.TEXT("medium"), // mediumtext
  })
  value!: string;

  @BelongsTo(() => Client)
  clientData?: Client;
}
