import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey, BelongsTo,
} from 'sequelize-typescript';
import {Client} from "../../clients/entities/client.entity";
import {Instance} from "../../instances/entities/instance.entity";

@Table({
  tableName: 'segments',
  timestamps: true,
  underscored: true,
})
export class Segment extends Model<Segment> {
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  name: string;

  @Column(DataType.TEXT)
  description: string;

  @Column({
    type: DataType.JSON,
    allowNull: false,
  })
  query: any;

  @Column({
    type: DataType.STRING,
    defaultValue: 'active',
  })
  status: string;

  @Column
  lastExecutedAt: Date;

  @Column
  resultCount: number;

  @ForeignKey(() => Client)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  client!: number;

  @ForeignKey(() => Instance)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  instance: number;

  @BelongsTo(() => Client, { foreignKey: "client" })
  clientEntity: Client;

  @BelongsTo(() => Instance, { foreignKey: "instance" })
  instanceEntity: Instance;
}
