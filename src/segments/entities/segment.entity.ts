import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
} from 'sequelize-typescript';

@Table({
  tableName: 'segments',
  timestamps: true,
  underscored: true,
})
export class Segment extends Model<Segment> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id: number;

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
}
