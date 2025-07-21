import {
  Column,
  Model,
  Table,
  PrimaryKey,
  AutoIncrement,
  Unique,
  DataType,
} from "sequelize-typescript";

@Table({
  tableName: "plugins", // Assicura che il nome della tabella sia corretto
  timestamps: false, // Disabilita i timestamp automatici se non usi updatedAt
})
export class Plugin extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({
    type: DataType.BIGINT,
    allowNull: false,
  })
  declare id: number;

  @Unique
  @Column({
    type: DataType.STRING(100),
    allowNull: false,
  })
  name: string;

  @Column({
    type: DataType.STRING(20),
    allowNull: false,
  })
  type: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  priority: number;

  @Column({
    type: DataType.STRING(100),
    allowNull: false,
  })
  input_topic: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: true, // Può essere NULL
    defaultValue: null,
  })
  output_topic: string | null;

  @Column({
    type: DataType.DATE,
    allowNull: false,
    defaultValue: DataType.NOW, // Imposta il valore di default corrente
  })
  declare createdAt: Date;
}
