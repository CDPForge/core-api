import { Column, DataType, Model, Table, ForeignKey, BelongsTo } from 'sequelize-typescript';
import UserPanel from './userpanel';
import Client from './client';
import Roles from './roles';

@Table({
    tableName: 'userclientroles',
    timestamps: true
})
export default class UserClientRoles extends Model {
    @ForeignKey(() => UserPanel)
    @Column(DataType.INTEGER)
    user!: number;

    @BelongsTo(() => UserPanel)
    userRelation!: UserPanel;

    @Column({
        type: DataType.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    })
    id!: number;

    @ForeignKey(() => Client)
    @Column(DataType.INTEGER)
    client!: number;

    @BelongsTo(() => Client)
    clientRelation!: Client;

    @ForeignKey(() => Roles)
    @Column(DataType.INTEGER)
    role!: number;

    @BelongsTo(() => Roles)
    roleRelation!: Roles;
}
