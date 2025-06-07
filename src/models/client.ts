import { Column, DataType, Model, Table } from 'sequelize-typescript';

@Table({
    tableName: 'clients',
    timestamps: false,
})
export default class Client extends Model {
    @Column({
        type: DataType.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    })
    id!: number;

    @Column({
        type: DataType.STRING,
        allowNull: false
    })
    name!: string;

    @Column({
        type: DataType.DATE,
        allowNull: false,
        defaultValue: DataType.NOW,
    })
    createdAt!: Date;
}
