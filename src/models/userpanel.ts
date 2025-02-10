import { Column, DataType, Model, Table, HasMany } from 'sequelize-typescript';
import UserClientRoles from './userclientroles';

@Table({
    tableName: 'userpanel',
    timestamps: true
})
export default class UserPanel extends Model {
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
    password!: string;

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

    @HasMany(() => UserClientRoles)
    UserClientRoles!: UserClientRoles[];
}
