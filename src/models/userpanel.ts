import { Column, DataType, Model, Table } from 'sequelize-typescript';

@Table({
    tableName: 'userpanel',
    timestamps: true
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
    mail!: string;

    @Column({
        type: DataType.STRING,
        allowNull: false
    })
    passowrd!: string;

    @Column({
        type: DataType.STRING,
        allowNull: true
    })
    name: string | undefined;

    @Column({
        type: DataType.STRING,
        allowNull: true
    })
    surname: string | undefined;

    @Column({
        type: DataType.BOOLEAN,
        allowNull: false
    })
    active!: boolean;

}
