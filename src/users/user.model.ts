import { Column, Model, Table } from 'sequelize-typescript';

@Table
export class User extends Model {
  @Column({
    allowNull: false,
    unique: true,
  })
  username!: string;

  @Column({
    allowNull: false,
  })
  password!: string;

  @Column({
    defaultValue: false,
  })
  isAdmin!: boolean;
}
