import { Column, DataType, Model, Table, ForeignKey, BelongsTo } from 'sequelize-typescript';
import Client from './client';

@Table({
    tableName: 'instances',
    timestamps: false,
})
export default class Instance extends Model {
    @Column({
        type: DataType.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    })
    id!: number;

    @ForeignKey(() => Client)
    @Column(DataType.INTEGER)
    client!: number;

    @BelongsTo(() => Client)
    clientRelation!: Client;

    @Column(DataType.STRING)
    description: string | undefined;

    @Column({
        type: DataType.BOOLEAN,
        allowNull: false,
        defaultValue: true
    })
    active!: boolean;
}